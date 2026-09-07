#include <Wire.h>
#include <WebServer.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <time.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ESP32Servo.h>
#include <Keypad.h>
#include <SD.h>
#include <LittleFS.h>

// ================= LCD =================
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ================= WIFI =================
const char* ssid = "Tae";
const char* pass = "qqqqqqqq90qq90";

// ================= TIME =================
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec    = 0;
const int daylightOffset_sec = 0;

// ================= RFID =================
#define SS_PIN  5
#define RST_PIN 2
MFRC522 rfid(SS_PIN, RST_PIN);

// ================= SD =================
#define SD_CS 4
bool sdAvailable = false;

// ================= LITTLEFS (BLACK-BOX FALLBACK + OFFLINE CLOUD QUEUE) =================
bool fsAvailable = false;
const char* BLACKBOX_FILE  = "/blackbox_log.txt";      // used only when SD is unavailable
const char* QUEUE_FILE     = "/pending_events.txt";    // cloud-event retry queue
const char* QUEUE_TMP_FILE = "/pending_events.tmp";

// ---- NEW: cloud black-box sync queue (separate from the two above) ----
const char* BB_QUEUE_FILE     = "/blackbox_cloud_queue.txt";
const char* BB_QUEUE_TMP_FILE = "/blackbox_cloud_queue.tmp";

// ================= HARDWARE =================
#define PIR_PIN    36
#define SERVO_PIN  13
#define BUZZER_PIN 12
#define LED_PIN    17
#define TAMPER_PIN 34

Servo lockServo;

// ================= KEYPAD =================
byte rowPins[4] = {14, 27, 26, 25};
byte colPins[4] = {33, 32, 15, 16};

char keys[4][4] = {
  {'1','2','3','A'},
  {'4','5','6','B'},
  {'7','8','9','C'},
  {'*','0','#','D'}
};

Keypad keypad = Keypad(makeKeymap(keys), rowPins, colPins, 4, 4);

// ================= SECURITY =================
String validCards[] = {
  "A1 58 69 06",
  "B2 11 AA 99",
  "C3 77 10 FF"
};
const int NUM_CARDS = 3;

const String PIN_CODE = "1234";
const String MASTER   = "999A99";

String input = "";

// ================= ENCRYPTION =================
const String XOR_KEY = "INTELLIGUARD";

String xorEncrypt(String data) {
  String result = "";
  for (int i = 0; i < data.length(); i++) {
    char c = data[i] ^ XOR_KEY[i % XOR_KEY.length()];
    char hex[3];
    sprintf(hex, "%02X", (unsigned char)c);
    result += hex;
  }
  return result;
}

String xorDecrypt(String hex) {
  String result = "";
  for (int i = 0; i < hex.length(); i += 2) {
    String byteStr = hex.substring(i, i + 2);
    char c = (char)strtol(byteStr.c_str(), NULL, 16);
    char d = c ^ XOR_KEY[(i / 2) % XOR_KEY.length()];
    result += d;
  }
  return result;
}

// ================= BLACK-BOX LOG DUMP (SD if present, else LittleFS) =================
void dumpLog() {
  if (sdAvailable) {
    File f = SD.open("/log.txt", FILE_READ);
    if (!f) { Serial.println("[INTELLIGUARD] Could not open log file"); return; }
    Serial.println("============ INTELLIGUARD SD LOG (DECRYPTED) ============");
    int lineCount = 0;
    while (f.available()) {
      String line = f.readStringUntil('\n');
      line.trim();
      if (line.length() > 0) { Serial.println(xorDecrypt(line)); lineCount++; }
    }
    f.close();
    Serial.println("============ END OF LOG — " + String(lineCount) + " ENTRIES ============");
    return;
  }
  if (fsAvailable) {
    File f = LittleFS.open(BLACKBOX_FILE, FILE_READ);
    if (!f) { Serial.println("[INTELLIGUARD] No black-box log found"); return; }
    Serial.println("============ INTELLIGUARD BLACK-BOX LOG (DECRYPTED, LittleFS) ============");
    int lineCount = 0;
    while (f.available()) {
      String line = f.readStringUntil('\n');
      line.trim();
      if (line.length() > 0) { Serial.println(xorDecrypt(line)); lineCount++; }
    }
    f.close();
    Serial.println("============ END OF LOG — " + String(lineCount) + " ENTRIES ============");
    return;
  }
  Serial.println("[INTELLIGUARD] No log storage available (no SD card, no LittleFS)");
}

void dumpLogRaw() {
  if (sdAvailable) {
    File f = SD.open("/log.txt", FILE_READ);
    if (!f) { Serial.println("[INTELLIGUARD] Could not open log file"); return; }
    Serial.println("============ INTELLIGUARD SD LOG (ENCRYPTED) ============");
    int lineCount = 0;
    while (f.available()) {
      String line = f.readStringUntil('\n');
      line.trim();
      if (line.length() > 0) { Serial.println(line); lineCount++; }
    }
    f.close();
    Serial.println("============ END OF ENCRYPTED LOG — " + String(lineCount) + " ENTRIES ============");
    return;
  }
  if (fsAvailable) {
    File f = LittleFS.open(BLACKBOX_FILE, FILE_READ);
    if (!f) { Serial.println("[INTELLIGUARD] No black-box log found"); return; }
    Serial.println("============ INTELLIGUARD BLACK-BOX LOG (ENCRYPTED, LittleFS) ============");
    int lineCount = 0;
    while (f.available()) {
      String line = f.readStringUntil('\n');
      line.trim();
      if (line.length() > 0) { Serial.println(line); lineCount++; }
    }
    f.close();
    Serial.println("============ END OF ENCRYPTED LOG — " + String(lineCount) + " ENTRIES ============");
    return;
  }
  Serial.println("[INTELLIGUARD] No log storage available (no SD card, no LittleFS)");
}

int countQueuedEvents() {
  if (!fsAvailable || !LittleFS.exists(QUEUE_FILE)) return 0;
  File f = LittleFS.open(QUEUE_FILE, FILE_READ);
  if (!f) return 0;
  int count = 0;
  while (f.available()) {
    String line = f.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) count++;
  }
  f.close();
  return count;
}

// ---- NEW: count entries waiting to sync to the cloud black-box ----
int countQueuedBlackbox() {
  if (!fsAvailable || !LittleFS.exists(BB_QUEUE_FILE)) return 0;
  File f = LittleFS.open(BB_QUEUE_FILE, FILE_READ);
  if (!f) return 0;
  int count = 0;
  while (f.available()) {
    String line = f.readStringUntil('\n');
    line.trim();
    if (line.length() > 0) count++;
  }
  f.close();
  return count;
}

// ================= STATE MACHINE =================
enum STATE { S_BOOT, S_IDLE, S_PIN, S_LOCKOUT, S_GRANTED };
STATE state = S_BOOT;

// ================= THREAT =================
enum THREAT_LEVEL { THREAT_NORMAL, THREAT_SUSPICIOUS, THREAT_INTRUSION };
THREAT_LEVEL currentThreat = THREAT_NORMAL;
String threatLabel = "NORMAL";

unsigned long lastMotionTime      = 0;
const unsigned long MOTION_WINDOW = 30000;

// ================= COUNTERS =================
int rfidFail   = 0;
int pinFail    = 0;
int masterFail = 0;

// ================= TIMERS =================
unsigned long pinTimer           = 0;
const unsigned long PIN_TIMEOUT  = 12000;
unsigned long grantedTime        = 0;
const unsigned long DOOR_OPEN_MS = 15000;
unsigned long pinDelayUntil      = 0;

// ================= MISC =================
unsigned long lastWifiCheck  = 0;
bool wifiReconnecting        = false;
bool logServerStarted        = false;
int ledMode                  = 0;
unsigned long lastBlink      = 0;
bool ledState                = false;
unsigned long lastMotion     = 0;
bool tamperActive            = false;
unsigned long lastRFIDCheck  = 0;
String eventTime             = "";
bool timeSynced              = false;

// ================= SD HTTP SERVER =================
WebServer sdServer(4001);

// =========================================
//           HELPER FUNCTIONS
// =========================================

String getTimeNow() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo, 100)) return "NO_TIME";
  if (timeinfo.tm_year + 1900 < 2024) return "SYNCING";
  if (!timeSynced) {
    timeSynced = true;
  }
  char buf[20];
  strftime(buf, sizeof(buf), "%d/%m/%Y %H:%M:%S", &timeinfo);
  return String(buf);
}

void systemPrint(String msg) {
  String timestamp = getTimeNow();
  Serial.println("[INTELLIGUARD " + timestamp + "] " + msg);
}

void updateLED() {
  if (ledMode == 0) {
    digitalWrite(LED_PIN, LOW);
  } else if (ledMode == 2) {
    digitalWrite(LED_PIN, HIGH);
  } else {
    unsigned long interval = (ledMode == 1) ? 100 : 600;
    if (millis() - lastBlink > interval) {
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState);
      lastBlink = millis();
    }
  }
}

void setLED(int mode) {
  ledMode = mode;
  if (mode == 0) digitalWrite(LED_PIN, LOW);
  if (mode == 2) digitalWrite(LED_PIN, HIGH);
}

// ================= OFFLINE CLOUD-EVENT QUEUE (LITTLEFS) =================
void queueEvent(String message, String type) {
  if (!fsAvailable) {
    systemPrint("ERROR — LittleFS unavailable, offline event dropped: " + message);
    return;
  }
  File f = LittleFS.open(QUEUE_FILE, FILE_APPEND);
  if (!f) {
    systemPrint("ERROR — Could not open offline queue file");
    return;
  }
  String safeMsg = message;
  safeMsg.replace("|", " ");
  String line = type + "|" + safeMsg;
  f.println(xorEncrypt(line));
  f.close();
  systemPrint("Event queued offline (no WiFi): " + message);
}

bool postEvent(String message, String type) {
  HTTPClient http;
  String serverUrl = "https://intelliguard-1.onrender.com/api/event";

  if (!http.begin(serverUrl)) {
    systemPrint("ERROR — Could not reach server");
    return false;
  }

  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  String msg = message;
  msg.replace("\"", "'");
  String payload = "{\"message\":\"" + msg + "\",\"type\":\"" + type + "\"}";

  int code = http.POST(payload);
  bool ok = (code == 201);

  if (ok) {
    systemPrint("EVENT SENT — " + message);
  } else if (code < 0) {
    systemPrint("ERROR — Server unreachable (" + http.errorToString(code) + ")");
  } else {
    systemPrint("WARNING — Unexpected server response: " + String(code));
  }

  http.end();
  return ok;
}

void syncPendingEvents() {
  if (!fsAvailable) return;
  if (!LittleFS.exists(QUEUE_FILE)) return;
  if (WiFi.status() != WL_CONNECTED) return;

  File f = LittleFS.open(QUEUE_FILE, FILE_READ);
  if (!f) return;

  File tmp = LittleFS.open(QUEUE_TMP_FILE, FILE_WRITE);
  if (!tmp) { f.close(); return; }

  int total = 0, sent = 0;

  while (f.available()) {
    String encLine = f.readStringUntil('\n');
    encLine.trim();
    if (encLine.length() == 0) continue;
    total++;

    String line = xorDecrypt(encLine);
    int sep = line.indexOf('|');
    if (sep == -1) continue;
    String type    = line.substring(0, sep);
    String message = line.substring(sep + 1);

    if (postEvent(message, type)) {
      sent++;
    } else {
      tmp.println(encLine);  // keep encrypted line for next retry
    }
  }

  f.close();
  tmp.close();

  LittleFS.remove(QUEUE_FILE);
  LittleFS.rename(QUEUE_TMP_FILE, QUEUE_FILE);

  if (sent > 0) {
    systemPrint("Synced " + String(sent) + " of " + String(total) + " queued offline event(s)");
  }

  File check = LittleFS.open(QUEUE_FILE, FILE_READ);
  if (check) {
    bool empty = (check.size() == 0);
    check.close();
    if (empty) LittleFS.remove(QUEUE_FILE);
  }
}

// ---- NEW: queue a black-box entry for cloud sync ----
// Stores BOTH the encrypted and plaintext forms so the cloud copy
// can offer the same encrypted/decrypted toggle as the local dump,
// with zero decryption logic needed on the server or frontend.
void queueBlackboxCloud(String plainLine) {
  if (!fsAvailable) return;

  String safePlain = plainLine;
  safePlain.replace("|", "/"); // keep the delimiter unambiguous

  String encHex = xorEncrypt(plainLine);

  File f = LittleFS.open(BB_QUEUE_FILE, FILE_APPEND);
  if (!f) {
    systemPrint("ERROR — Could not open black-box cloud queue file");
    return;
  }
  f.println(encHex + "|" + safePlain);
  f.close();
}

// ---- NEW: push queued black-box entries to Render ----
void syncBlackboxCloud() {
  if (!fsAvailable) return;
  if (!LittleFS.exists(BB_QUEUE_FILE)) return;
  if (WiFi.status() != WL_CONNECTED) return;

  File f = LittleFS.open(BB_QUEUE_FILE, FILE_READ);
  if (!f) return;

  File tmp = LittleFS.open(BB_QUEUE_TMP_FILE, FILE_WRITE);
  if (!tmp) { f.close(); return; }

  int total = 0, sent = 0;

  while (f.available()) {
    String line = f.readStringUntil('\n');
    line.trim();
    if (line.length() == 0) continue;
    total++;

    int sep = line.indexOf('|');
    if (sep == -1) continue;
    String encHex = line.substring(0, sep);
    String plain  = line.substring(sep + 1);

    HTTPClient http;
    String url = "https://intelliguard-1.onrender.com/api/blackbox";
    bool sentOk = false;

    if (http.begin(url)) {
      http.addHeader("Content-Type", "application/json");
      http.setTimeout(8000);

      String safePlain = plain;
      safePlain.replace("\"", "'");

      String payload = "{\"encrypted\":\"" + encHex + "\",\"decrypted\":\"" + safePlain + "\"}";
      int code = http.POST(payload);
      http.end();
      sentOk = (code == 201);
    }

    if (sentOk) {
      sent++;
    } else {
      tmp.println(line); // keep for next retry
    }
  }

  f.close();
  tmp.close();

  LittleFS.remove(BB_QUEUE_FILE);
  LittleFS.rename(BB_QUEUE_TMP_FILE, BB_QUEUE_FILE);

  if (sent > 0) {
    systemPrint("Synced " + String(sent) + " of " + String(total) + " black-box entries to cloud");
  }

  File check = LittleFS.open(BB_QUEUE_FILE, FILE_READ);
  if (check) {
    bool empty = (check.size() == 0);
    check.close();
    if (empty) LittleFS.remove(BB_QUEUE_FILE);
  }
}

void sendEvent(String message, String type) {
  if (WiFi.status() != WL_CONNECTED) {
    queueEvent(message, type);
    return;
  }
  if (!postEvent(message, type)) {
    queueEvent(message, type);
  }
}

void checkWifi() {
  if (millis() - lastWifiCheck < 10000) return;
  lastWifiCheck = millis();
  if (WiFi.status() != WL_CONNECTED) {
    if (!wifiReconnecting) {
      systemPrint("WARNING — WiFi disconnected, attempting reconnect...");
      WiFi.disconnect();
      WiFi.begin(ssid, pass);
      wifiReconnecting = true;
    } else {
      if (WiFi.status() == WL_CONNECTED) {
        systemPrint("WiFi reconnected successfully");
        systemPrint("Device IP  : " + WiFi.localIP().toString());
        wifiReconnecting = false;
        configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
        if (sdAvailable || fsAvailable) setupSDServer();
        syncPendingEvents();
        syncBlackboxCloud();   // ---- NEW ----
      }
    }
  } else {
    wifiReconnecting = false;
  }
}

// ================= BLACK-BOX WRITE (SD primary, LittleFS fallback) =================
void safeLog(String data) {
  if (sdAvailable) {
    File f = SD.open("/log.txt", FILE_APPEND);
    if (f) { f.println(data); f.flush(); f.close(); }
    return;
  }
  if (fsAvailable) {
    File f = LittleFS.open(BLACKBOX_FILE, FILE_APPEND);
    if (f) { f.println(data); f.close(); }
  }
}

void logEvent(String msg) {
  String line = "[" + eventTime + "] " + msg + " [THREAT:" + threatLabel + "]";
  Serial.println(line);
  safeLog(xorEncrypt(line));
  queueBlackboxCloud(line);   // ---- NEW ----
}

void classifyThreat() {
  THREAT_LEVEL prev = currentThreat;
  bool recentMotion = (millis() - lastMotionTime < MOTION_WINDOW) && lastMotionTime > 0;

  if (state == S_LOCKOUT || tamperActive) {
    currentThreat = THREAT_INTRUSION; threatLabel = "INTRUSION";
  } else if ((pinFail >= 2 || rfidFail >= 2) && recentMotion) {
    currentThreat = THREAT_INTRUSION; threatLabel = "INTRUSION";
  } else if ((pinFail >= 1 || rfidFail >= 1) || recentMotion) {
    currentThreat = THREAT_SUSPICIOUS; threatLabel = "SUSPICIOUS";
  } else {
    currentThreat = THREAT_NORMAL; threatLabel = "NORMAL";
  }

  if (currentThreat != prev) {
    eventTime = getTimeNow();
    String line = "[" + eventTime + "] THREAT LEVEL CHANGED TO: " + threatLabel;
    Serial.println(line);
    safeLog(xorEncrypt(line));
    queueBlackboxCloud(line);   // ---- NEW ----
    if (currentThreat == THREAT_NORMAL)     sendEvent("All clear — threat level returned to normal", "ok");
    if (currentThreat == THREAT_SUSPICIOUS) sendEvent("Suspicious activity detected — monitoring elevated", "warn");
    if (currentThreat == THREAT_INTRUSION)  sendEvent("Intrusion alert — immediate attention required", "danger");
  }
}

void beep(int ms = 80) {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(ms);
  digitalWrite(BUZZER_PIN, LOW);
}

String lastL1 = "";
String lastL2 = "";

void showLCD(String l1, String l2) {
  if (l1 == lastL1 && l2 == lastL2) return;
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(l1);
  lcd.setCursor(0, 1); lcd.print(l2);
  lastL1 = l1; lastL2 = l2;
}

void forceLCD(String l1, String l2) {
  lastL1 = ""; lastL2 = "";
  showLCD(l1, l2);
}

void resetRFID() {
  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();
  rfid.PCD_Reset();
  delay(100);
  rfid.PCD_Init();
  delay(100);
  Serial.println("[INTELLIGUARD] RFID reader reset complete");
}

void checkRFID() {
  if (millis() - lastRFIDCheck < 30000) return;
  lastRFIDCheck = millis();
  byte v = rfid.PCD_ReadRegister(rfid.VersionReg);
  if (v == 0x00 || v == 0xFF) {
    systemPrint("WARNING — RFID reader not responding, attempting recovery...");
    resetRFID();
    delay(200);
    v = rfid.PCD_ReadRegister(rfid.VersionReg);
    if (v == 0x00 || v == 0xFF) {
      systemPrint("ERROR — RFID reader recovery failed");
    } else {
      systemPrint("RFID reader recovered successfully");
    }
  }
}

void checkTamper() {
  if (digitalRead(TAMPER_PIN) == LOW) {
    if (!tamperActive) {
      tamperActive = true;
      eventTime    = getTimeNow();
      logEvent("TAMPER DETECTED - ENCLOSURE OPENED");
      sendEvent("ALERT — Security enclosure has been opened", "danger");
      setLED(2);
      digitalWrite(BUZZER_PIN, HIGH);
      showLCD("TAMPER ALERT", "ENCLOSURE OPEN");
    }
  } else {
    if (tamperActive) {
      tamperActive = false;
      eventTime    = getTimeNow();
      logEvent("TAMPER CLEARED - ENCLOSURE CLOSED");
      sendEvent("Enclosure secured — tamper alert cleared", "ok");
      digitalWrite(BUZZER_PIN, LOW);
      setLED(0);
      forceLCD("WELCOME", "SCAN YOUR CARD");
    }
  }
}

String readUID() {
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
    if (i < rfid.uid.size - 1) uid += " ";
  }
  uid.toUpperCase();
  return uid;
}

bool isValidCard(String uid) {
  for (int i = 0; i < NUM_CARDS; i++) {
    if (uid == validCards[i]) return true;
  }
  return false;
}

// ================= SERIAL COMMAND CONSOLE =================
void checkSerialCommands() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toUpperCase();
    if (cmd == "DUMP") {
      dumpLog();
    } else if (cmd == "DUMPRAW") {
      dumpLogRaw();
    } else if (cmd == "CLEAR") {
      if (sdAvailable) {
        SD.remove("/log.txt");
        Serial.println("[INTELLIGUARD] SD log file cleared successfully");
      } else if (fsAvailable) {
        LittleFS.remove(BLACKBOX_FILE);
        Serial.println("[INTELLIGUARD] Black-box log (LittleFS) cleared successfully");
      } else {
        Serial.println("[INTELLIGUARD] No log storage available");
      }
    } else if (cmd == "STATUS") {
      String stateStr = "";
      if (state == S_IDLE)         stateStr = "Idle — awaiting card scan";
      else if (state == S_PIN)     stateStr = "Awaiting PIN entry";
      else if (state == S_LOCKOUT) stateStr = "LOCKED OUT";
      else if (state == S_GRANTED) stateStr = "Access granted — door open";
      else                          stateStr = "Booting";
      Serial.println("============ INTELLIGUARD STATUS ============");
      Serial.println("  System   : " + stateStr);
      Serial.println("  Threat   : " + threatLabel);
      Serial.println("  Time     : " + getTimeNow());
      Serial.println("  WiFi     : " + String(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected"));
      Serial.println("  Server   : https://intelliguard-1.onrender.com");
      Serial.println("  SD Card  : " + String(sdAvailable ? "Ready" : "Not found"));
      Serial.println("  LittleFS : " + String(fsAvailable ? "Ready (fallback black-box + cloud queue)" : "Not found"));
      Serial.println("  Queued   : " + String(countQueuedEvents()) + " offline event(s) pending sync");
      Serial.println("  BB Queue : " + String(countQueuedBlackbox()) + " black-box entries pending cloud sync");
      Serial.println("  Tamper   : " + String(tamperActive ? "ALERT — Enclosure open" : "Secure"));
      Serial.println("  RFID     : " + String(rfidFail) + " fail(s)");
      Serial.println("  PIN      : " + String(pinFail) + " fail(s)");
      Serial.println("=============================================");
    } else if (cmd == "TESTHTTP") {
      Serial.println("[INTELLIGUARD] Sending test event to server...");
      sendEvent("Manual test event from serial console", "ok");
    } else if (cmd == "SYNCBB") {
      Serial.println("[INTELLIGUARD] Forcing black-box cloud sync...");
      syncBlackboxCloud();
    } else if (cmd == "HELP") {
      Serial.println("============ INTELLIGUARD COMMANDS ============");
      Serial.println("  DUMP     — View decrypted event log (SD card or LittleFS black-box)");
      Serial.println("  DUMPRAW  — View encrypted event log (SD card or LittleFS black-box)");
      Serial.println("  STATUS   — Show current system status");
      Serial.println("  CLEAR    — Erase event log (SD card or LittleFS black-box)");
      Serial.println("  TESTHTTP — Send a test event to the server");
      Serial.println("  SYNCBB   — Force black-box cloud sync now");
      Serial.println("  HELP     — Show this help menu");
      Serial.println("===============================================");
    } else {
      Serial.println("[INTELLIGUARD] Unknown command — type HELP for available commands");
    }
  }
}

// ================= SD/LITTLEFS LOG HTTP SERVER (for dashboard) =================
void handleSDLog() {
  String mode = sdServer.arg("mode");

  if (sdAvailable) {
    File f = SD.open("/log.txt", FILE_READ);
    if (!f) {
      sdServer.sendHeader("Access-Control-Allow-Origin", "*");
      sdServer.send(404, "application/json", "{\"error\":\"Log file not found or empty\"}");
      return;
    }
    String json = "[";
    bool first = true;
    int lineCount = 0;
    while (f.available()) {
      String line = f.readStringUntil('\n');
      line.trim();
      if (line.length() == 0) continue;
      if (!first) json += ",";
      first = false;
      String content = (mode == "decrypted") ? xorDecrypt(line) : line;
      content.replace("\"", "'");
      content.replace("\\", "/");
      json += "{\"line\":\"" + content + "\",\"index\":" + String(lineCount) + "}";
      lineCount++;
      if (json.length() > 8000) {
        if (!first) json += ",";
        json += "{\"line\":\"... log truncated — too large to display in full ...\",\"index\":" + String(lineCount) + "}";
        break;
      }
    }
    f.close();
    json += "]";
    sdServer.sendHeader("Access-Control-Allow-Origin", "*");
    sdServer.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    sdServer.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    sdServer.send(200, "application/json", json);
    systemPrint("SD log served via HTTP — mode: " + mode + " — " + String(lineCount) + " entries");
    return;
  }

  if (fsAvailable) {
    File f = LittleFS.open(BLACKBOX_FILE, FILE_READ);
    if (!f) {
      sdServer.sendHeader("Access-Control-Allow-Origin", "*");
      sdServer.send(404, "application/json", "{\"error\":\"No black-box log found\"}");
      return;
    }
    String json = "[";
    bool first = true;
    int lineCount = 0;
    while (f.available()) {
      String line = f.readStringUntil('\n');
      line.trim();
      if (line.length() == 0) continue;
      if (!first) json += ",";
      first = false;
      String content = (mode == "decrypted") ? xorDecrypt(line) : line;
      content.replace("\"", "'");
      content.replace("\\", "/");
      json += "{\"line\":\"" + content + "\",\"index\":" + String(lineCount) + "}";
      lineCount++;
      if (json.length() > 8000) {
        if (!first) json += ",";
        json += "{\"line\":\"... log truncated — too large to display in full ...\",\"index\":" + String(lineCount) + "}";
        break;
      }
    }
    f.close();
    json += "]";
    sdServer.sendHeader("Access-Control-Allow-Origin", "*");
    sdServer.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    sdServer.sendHeader("Access-Control-Allow-Headers", "Content-Type");
    sdServer.send(200, "application/json", json);
    systemPrint("Black-box log (LittleFS) served via HTTP — mode: " + mode + " — " + String(lineCount) + " entries");
    return;
  }

  sdServer.sendHeader("Access-Control-Allow-Origin", "*");
  sdServer.send(404, "application/json", "{\"error\":\"No log storage available\"}");
}

void handleSDStatus() {
  sdServer.sendHeader("Access-Control-Allow-Origin", "*");
  sdServer.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  sdServer.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  bool logAvailable = sdAvailable || fsAvailable;
  String json = "{\"available\":" + String(logAvailable ? "true" : "false") +
                ",\"source\":\"" + String(sdAvailable ? "sd" : (fsAvailable ? "littlefs" : "none")) + "\"" +
                ",\"ip\":\"" + WiFi.localIP().toString() + "\"" +
                ",\"entries\":" + String(logAvailable ? "true" : "false") + "}";
  sdServer.send(200, "application/json", json);
}

void handleOptions() {
  sdServer.sendHeader("Access-Control-Allow-Origin", "*");
  sdServer.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  sdServer.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  sdServer.send(204);
}

void setupSDServer() {
  if (logServerStarted) return;
  sdServer.on("/sdlog", HTTP_GET, handleSDLog);
  sdServer.on("/sdlog", HTTP_OPTIONS, handleOptions);
  sdServer.on("/sdstatus", HTTP_GET, handleSDStatus);
  sdServer.on("/sdstatus", HTTP_OPTIONS, handleOptions);
  sdServer.begin();
  logServerStarted = true;
  systemPrint("Log HTTP server running on port 4001 (source: " + String(sdAvailable ? "SD card" : "LittleFS black-box") + ")");
  systemPrint("Test: http://" + WiFi.localIP().toString() + ":4001/sdstatus");
}

// =========================================
//                 SETUP
// =========================================
void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(PIR_PIN,    INPUT);
  pinMode(TAMPER_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN,    OUTPUT);

  digitalWrite(LED_PIN,    LOW);
  digitalWrite(BUZZER_PIN, LOW);

  lockServo.attach(SERVO_PIN);
  lockServo.write(0);

  lcd.init();
  lcd.backlight();

  SPI.begin();
  rfid.PCD_Init();
  delay(50);

  Serial.println("=============================================");
  Serial.println("       INTELLIGUARD SECURITY SYSTEM         ");
  Serial.println("              Initialising...               ");
  Serial.println("=============================================");

  if (SD.begin(SD_CS)) {
    sdAvailable = true;
    Serial.println("[INTELLIGUARD] SD card ready");
  } else {
    sdAvailable = false;
    Serial.println("[INTELLIGUARD] WARNING — No SD card found, will use LittleFS black-box fallback");
  }

  if (LittleFS.begin(true)) {
    fsAvailable = true;
    Serial.println("[INTELLIGUARD] LittleFS ready (black-box fallback + offline cloud queue)");
    int pending = countQueuedEvents();
    if (pending > 0) {
      Serial.println("[INTELLIGUARD] " + String(pending) + " offline event(s) waiting from before reboot");
    }
    int pendingBB = countQueuedBlackbox();
    if (pendingBB > 0) {
      Serial.println("[INTELLIGUARD] " + String(pendingBB) + " black-box entries waiting to sync to cloud");
    }
  } else {
    fsAvailable = false;
    Serial.println("[INTELLIGUARD] ERROR — LittleFS mount failed");
  }

  Serial.println("[INTELLIGUARD] Type HELP in serial for available commands");

  showLCD("CONNECTING...", "PLEASE WAIT");
  WiFi.begin(ssid, pass);

  Serial.println("[INTELLIGUARD] Connecting to WiFi...");
  int tries = 0;
  while (WiFi.status() != WL_CONNECTED && tries < 60) {
    delay(300);
    tries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);
    Serial.println("[INTELLIGUARD] WiFi connected successfully");
    Serial.println("[INTELLIGUARD] Device IP  : " + WiFi.localIP().toString());
    Serial.println("[INTELLIGUARD] Gateway IP : " + WiFi.gatewayIP().toString());
    Serial.println("[INTELLIGUARD] Syncing time with NTP server...");

    int syncTries = 0;
    struct tm timeinfo;
    while (syncTries < 10) {
      if (getLocalTime(&timeinfo, 500) && timeinfo.tm_year + 1900 >= 2024) {
        timeSynced = true;
        Serial.println("[INTELLIGUARD] Time synced — " + String(timeinfo.tm_year + 1900));
        break;
      }
      syncTries++;
      delay(500);
    }
    if (!timeSynced) Serial.println("[INTELLIGUARD] WARNING — Time sync failed, will retry");

    if (sdAvailable || fsAvailable) setupSDServer();

    syncPendingEvents();
    syncBlackboxCloud();   // ---- NEW ----

  } else {
    Serial.println("[INTELLIGUARD] WARNING — WiFi connection failed, time unavailable");
  }

  // LCD stays silent about storage backend here — SD vs LittleFS is an
  // internal implementation detail, not a fault condition, so it never
  // interrupts the boot sequence with a warning screen.

  forceLCD("WELCOME", "SCAN YOUR CARD");

  eventTime = getTimeNow();
  logEvent("SYSTEM BOOT");
  sendEvent("INTELLIGUARD system online and monitoring", "ok");

  Serial.println("[INTELLIGUARD] System ready — type HELP for commands");
  Serial.println("=============================================");

  state = S_IDLE;
}

// =========================================
//                  LOOP
// =========================================
void loop() {

  sdServer.handleClient();

  updateLED();
  checkWifi();
  checkRFID();
  checkTamper();
  classifyThreat();
  checkSerialCommands();

  if (tamperActive) return;

  char key = keypad.getKey();

  // ================= MOTION =================
  if (digitalRead(PIR_PIN) == HIGH && state == S_IDLE) {
    if (millis() - lastMotion > 5000) {
      lastMotion     = millis();
      lastMotionTime = millis();
      eventTime      = getTimeNow();
      logEvent("MOTION DETECTED AT ENTRANCE");
      sendEvent("Movement detected at entrance — standing by", "warn");
    }
  }

  // ================= S_IDLE =================
  if (state == S_IDLE) {
    setLED(0);
    showLCD("WELCOME", "SCAN YOUR CARD");

    if (!rfid.PICC_IsNewCardPresent()) return;
    if (!rfid.PICC_ReadCardSerial()) return;

    eventTime = getTimeNow();
    String uid = readUID();
    logEvent("CARD PRESENTED - UID: " + uid);

    if (isValidCard(uid)) {
      rfidFail = 0;
      showLCD("CARD ACCEPTED", "ENTER PIN");
      logEvent("CARD AUTHORISED");
      sendEvent("Authorised card presented — awaiting PIN", "ok");
      setLED(3);
      beep(100);
      delay(1200);
      showLCD("ENTER PIN", "");
      pinTimer = millis();
      input    = "";
      state    = S_PIN;
    } else {
      rfidFail++;
      logEvent("CARD REJECTED - UID: " + uid);
      sendEvent("Unrecognised card presented — UID: " + uid, "warn");
      classifyThreat();
      showLCD("ACCESS DENIED", "");
      setLED(1);
      beep(300);
      delay(1500);
      setLED(0);
      if (rfidFail >= 2 && pinFail >= 1) {
        state = S_LOCKOUT;
        logEvent("INTRUSION PATTERN DETECTED");
        sendEvent("Intrusion pattern detected — system locked down", "danger");
      } else if (rfidFail >= 3) {
        state = S_LOCKOUT;
        logEvent("LOCKOUT — REPEATED INVALID CARDS");
        sendEvent("System locked — repeated unrecognised card attempts", "danger");
      }
    }

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }

  // ================= S_PIN =================
  if (state == S_PIN) {

    if (millis() < pinDelayUntil) {
      int secsLeft = (pinDelayUntil - millis()) / 1000 + 1;
      showLCD("WAIT", String(secsLeft) + " SECONDS...");
      return;
    }

    if (input.length() == 0) showLCD("ENTER PIN", "");

    if (millis() - pinTimer > PIN_TIMEOUT) {
      input    = "";
      pinTimer = 0;
      logEvent("PIN ENTRY TIMED OUT");
      sendEvent("PIN entry timed out — session cancelled", "warn");
      showLCD("TIMEOUT", "TRY AGAIN");
      setLED(0);
      beep(200);
      delay(1500);
      resetRFID();
      rfidFail = 0;
      pinFail  = 0;
      input    = "";
      forceLCD("WELCOME", "SCAN YOUR CARD");
      state    = S_IDLE;
      return;
    }

    if (key) {
      eventTime = getTimeNow();
      pinTimer  = millis();
      beep(50);

      if (key == '*') {
        if (input.length() > 0) { input.remove(input.length() - 1); beep(30); }
      }

      else if (key == '#') {
        beep(120); delay(80); beep(120);

        if (input == MASTER) {
          eventTime = getTimeNow();
          logEvent("MASTER CODE ACCEPTED — SYSTEM RESET");
          sendEvent("Master override used — system reset to normal", "ok");
          showLCD("SYSTEM RESET", "WELCOME");
          setLED(0);
          digitalWrite(BUZZER_PIN, LOW);
          rfidFail = 0; pinFail = 0; masterFail = 0;
          pinTimer = 0; pinDelayUntil = 0; input = "";
          currentThreat = THREAT_NORMAL; threatLabel = "NORMAL";
          logEvent("THREAT LEVEL RESET TO NORMAL");
          delay(1500);
          forceLCD("WELCOME", "SCAN YOUR CARD");
          resetRFID();
          state = S_IDLE;
          return;
        }

        if (input == PIN_CODE) {
          logEvent("ACCESS GRANTED");
          sendEvent("Access granted — door unlocked", "ok");
          setLED(3);
          showLCD("ACCESS GRANTED", "");
          delay(1200);
          logEvent("DOOR UNLOCKED");
          showLCD("DOOR UNLOCKED", "");
          lockServo.write(90);
          grantedTime   = millis();
          pinFail       = 0;
          pinDelayUntil = 0;
          state = S_GRANTED;
        } else {
          pinFail++;
          logEvent("INCORRECT PIN — ATTEMPT " + String(pinFail) + " OF 3");
          sendEvent("Incorrect PIN entered — attempt " + String(pinFail) + " of 3", "warn");
          classifyThreat();
          showLCD("WRONG PIN", String(3 - pinFail) + " ATTEMPTS LEFT");
          setLED(1);
          if (pinFail == 1) pinDelayUntil = millis() + 2000;
          else if (pinFail == 2) pinDelayUntil = millis() + 5000;
          beep(200);
          if (rfidFail >= 2 && pinFail >= 1) {
            state = S_LOCKOUT;
            logEvent("INTRUSION PATTERN DETECTED");
            sendEvent("Intrusion pattern detected — system locked down", "danger");
          } else if (pinFail >= 3) {
            state = S_LOCKOUT;
            logEvent("LOCKOUT — REPEATED INCORRECT PIN");
            sendEvent("System locked — too many incorrect PIN attempts", "danger");
          }
        }

        input    = "";
        pinTimer = millis();
      }

      else {
        if (input.length() < 4) input += key;
      }

      String mask = "";
      for (int i = 0; i < input.length(); i++) mask += "*";
      if (state == S_PIN) showLCD("ENTER PIN", mask);
    }
  }

  // ================= S_LOCKOUT =================
  if (state == S_LOCKOUT) {
    digitalWrite(BUZZER_PIN, HIGH);
    setLED(2);
    showLCD("SYSTEM LOCKED", "MASTER CODE");

    if (key) {
      beep(80);
      if (key == '*') {
        input = "";
      } else if (key == '#') {
        if (input == MASTER) {
          eventTime = getTimeNow();
          logEvent("MASTER CODE ACCEPTED — LOCKOUT CLEARED");
          sendEvent("Master override used — lockout cleared", "ok");
          masterFail = 0; rfidFail = 0; pinFail = 0; pinDelayUntil = 0;
          currentThreat = THREAT_NORMAL; threatLabel = "NORMAL";
          logEvent("THREAT LEVEL RESET TO NORMAL");
          digitalWrite(BUZZER_PIN, LOW);
          setLED(0);
          input = "";
          delay(1500);
          forceLCD("WELCOME", "SCAN YOUR CARD");
          resetRFID();
          state = S_IDLE;
        } else {
          masterFail++;
          eventTime = getTimeNow();
          logEvent("INCORRECT MASTER CODE — ATTEMPT " + String(masterFail));
          sendEvent("Incorrect master code entered — attempt " + String(masterFail), "danger");
          if (masterFail >= 3) {
            logEvent("SECURITY ALERT — MASTER CODE BRUTE FORCE DETECTED");
            sendEvent("ALERT — Repeated master code attempts detected", "danger");
          }
          input = "";
        }
      } else {
        if (input.length() < 8) input += key;
      }
    }
  }

  // ================= S_GRANTED =================
  if (state == S_GRANTED) {
    unsigned long elapsed   = millis() - grantedTime;
    unsigned long remaining = (DOOR_OPEN_MS - elapsed) / 1000 + 1;

    if (elapsed < DOOR_OPEN_MS) {
      setLED(3);
      showLCD("DOOR OPEN", String(remaining) + "s REMAINING");
    } else {
      lockServo.write(0);
      eventTime = getTimeNow();
      logEvent("DOOR LOCKED — SESSION ENDED");
      sendEvent("Door secured — access session ended", "ok");
      setLED(0);
      showLCD("DOOR LOCKED", "");
      delay(1500);
      forceLCD("WELCOME", "SCAN YOUR CARD");
      resetRFID();
      rfidFail = 0;
      pinFail  = 0;
      input    = "";
      state    = S_IDLE;
    }
  }
}
