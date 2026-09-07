import axios from "axios";
import { useCallback, useState, useEffect } from "react";
import { MdSdCard, MdInfoOutline, MdEdit, MdCheck } from "react-icons/md";

const IP_STORAGE_KEY = "intelliguard_sd_ip";
const DEFAULT_IP = "http://192.168.148.132:4001";

const MODE_INFO = {
  decrypted:
    "The same on-device log data after XOR decryption using key INTELLIGUARD. This is the human-readable version of the encrypted log — both views come directly from the ESP32 (SD card if present, otherwise its internal LittleFS black-box).",
  raw: "The exact data stored on the ESP32 — XOR encrypted with key INTELLIGUARD. Each entry is a hexadecimal string; without the key it's unreadable. This proves security events aren't stored in plaintext on the hardware.",
};

const SdCardLogs = ({ setSdLogs, sdLogs }) => {
  const [sdMode, setSdMode] = useState("decrypted");
  const [sdLoading, setSdLoading] = useState(false);
  const [sdError, setSdError] = useState(null);
  const [sdLoaded, setSdLoaded] = useState(false);
  const [hoveredInfo, setHoveredInfo] = useState(null);

  const [sdIp, setSdIp] = useState(
    () => localStorage.getItem(IP_STORAGE_KEY) || DEFAULT_IP,
  );
  const [editingIp, setEditingIp] = useState(false);
  const [ipDraft, setIpDraft] = useState(sdIp);

  useEffect(() => {
    localStorage.setItem(IP_STORAGE_KEY, sdIp);
  }, [sdIp]);

  const saveIp = () => {
    let val = ipDraft.trim();
    if (val && !val.startsWith("http")) val = "http://" + val;
    if (val) setSdIp(val);
    setEditingIp(false);
  };

  const fetchSDLogs = useCallback(
    async (mode) => {
      setSdLoading(true);
      setSdError(null);
      setSdLogs([]);
      try {
        const res = await axios.get(
          `${sdIp}/sdlog?mode=${mode === "raw" ? "raw" : "decrypted"}`,
          { timeout: 10000 },
        );
        setSdLogs(res.data);
        setSdLoaded(true);
      } catch (error) {
        setSdError(
          "Could not reach the ESP32 log server. Check that the ESP32 is powered, on the same network, and that the IP address below is correct — it changes whenever the WiFi network changes.",
        );
        console.log("[fetchSDLogs]", error);
      } finally {
        setSdLoading(false);
      }
    },
    [setSdLogs, sdIp],
  );

  return (
    <div>
      {/* IP address (editable — this changes whenever the ESP32 joins a new WiFi network) */}
      <div className="flex items-center gap-2 mb-3">
        <MdSdCard size={13} style={{ color: "#E8EDF230" }} />
        {editingIp ? (
          <>
            <input
              autoFocus
              value={ipDraft}
              onChange={(e) => setIpDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveIp()}
              placeholder="http://192.168.x.x:4001"
              className="font-mono-ig text-xs px-2 py-1 rounded-sm flex-1 max-w-xs"
              style={{
                backgroundColor: "#0A1628",
                border: "1px solid #00D4FF40",
                color: "#E8EDF2",
                outline: "none",
              }}
            />
            <button
              onClick={saveIp}
              className="p-1 rounded-sm"
              style={{ color: "#00C896" }}
            >
              <MdCheck size={15} />
            </button>
          </>
        ) : (
          <>
            <span
              className="font-mono-ig text-xs"
              style={{ color: "#E8EDF230" }}
            >
              ESP32 · {sdIp}
            </span>
            <button
              onClick={() => {
                setIpDraft(sdIp);
                setEditingIp(true);
              }}
              className="p-0.5 rounded-sm"
              style={{ color: "#E8EDF230" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#00D4FF")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#E8EDF230")}
              title="Edit ESP32 IP address"
            >
              <MdEdit size={12} />
            </button>
          </>
        )}
      </div>

      {/* encrypted / decrypted switcher */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center gap-1 p-1 rounded-sm"
          style={{
            backgroundColor: "#0A1628",
            border: "1px solid #0F2644",
          }}
        >
          <div className="relative">
            <button
              onClick={() => setSdMode("decrypted")}
              onMouseEnter={() => setHoveredInfo("decrypted")}
              onMouseLeave={() => setHoveredInfo(null)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-sm font-mono-ig text-xs font-bold tracking-widest transition-all"
              style={{
                backgroundColor:
                  sdMode === "decrypted" ? "#00C89620" : "transparent",
                border:
                  sdMode === "decrypted"
                    ? "1px solid #00C89640"
                    : "1px solid transparent",
                color: sdMode === "decrypted" ? "#00C896" : "#E8EDF240",
              }}
            >
              DECRYPTED VIEW
              <MdInfoOutline size={12} style={{ opacity: 0.6 }} />
            </button>
            {hoveredInfo === "decrypted" && (
              <div
                className="absolute z-10 top-full left-0 mt-2 w-64 px-3 py-2 rounded-sm text-xs leading-relaxed"
                style={{
                  backgroundColor: "#0A1628",
                  border: "1px solid #00C89640",
                  color: "#E8EDF270",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                }}
              >
                {MODE_INFO.decrypted}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setSdMode("raw")}
              onMouseEnter={() => setHoveredInfo("raw")}
              onMouseLeave={() => setHoveredInfo(null)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-sm font-mono-ig text-xs font-bold tracking-widest transition-all"
              style={{
                backgroundColor: sdMode === "raw" ? "#F59E0B20" : "transparent",
                border:
                  sdMode === "raw"
                    ? "1px solid #F59E0B40"
                    : "1px solid transparent",
                color: sdMode === "raw" ? "#F59E0B" : "#E8EDF240",
              }}
            >
              ENCRYPTED RAW
              <MdInfoOutline size={12} style={{ opacity: 0.6 }} />
            </button>
            {hoveredInfo === "raw" && (
              <div
                className="absolute z-10 top-full left-0 mt-2 w-64 px-3 py-2 rounded-sm text-xs leading-relaxed"
                style={{
                  backgroundColor: "#0A1628",
                  border: "1px solid #F59E0B40",
                  color: "#E8EDF270",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
                }}
              >
                {MODE_INFO.raw}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => fetchSDLogs(sdMode)}
          disabled={sdLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-sm font-mono-ig text-xs font-bold tracking-widest transition-all"
          style={{
            backgroundColor: "#00D4FF15",
            border: "1px solid #00D4FF30",
            color: sdLoading ? "#00D4FF50" : "#00D4FF",
            cursor: sdLoading ? "not-allowed" : "pointer",
          }}
        >
          {sdLoading ? (
            <>
              <div
                className="w-3 h-3 rounded-full border animate-spin"
                style={{
                  borderColor: "#00D4FF40",
                  borderTopColor: "#00D4FF",
                }}
              />
              READING LOG...
            </>
          ) : (
            <>
              <MdSdCard size={13} />
              {sdLoaded ? "REFRESH" : "READ LOG"}
            </>
          )}
        </button>
      </div>

      {/* log display */}
      <div
        className="rounded-sm overflow-hidden"
        style={{ border: "1px solid #0F2644" }}
      >
        <div
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{ backgroundColor: "#0A1628", borderColor: "#0F2644" }}
        >
          <span
            className="font-mono-ig text-xs font-bold tracking-widest"
            style={{ color: "#E8EDF230" }}
          >
            {sdMode === "raw" ? "RAW ENCRYPTED HEX" : "DECRYPTED ENTRIES"}
          </span>
          <span className="font-mono-ig text-xs" style={{ color: "#E8EDF220" }}>
            SD card or LittleFS black-box
          </span>
        </div>

        {!sdLoaded && !sdLoading && !sdError && (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3"
            style={{ backgroundColor: "#020B18" }}
          >
            <MdSdCard size={32} style={{ color: "#E8EDF215" }} />
            <p
              className="font-mono-ig text-xs tracking-widest"
              style={{ color: "#E8EDF230" }}
            >
              PRESS READ LOG TO LOAD
            </p>
            <p className="font-mono-ig text-xs" style={{ color: "#E8EDF220" }}>
              Data is fetched directly from the ESP32 over WiFi
            </p>
          </div>
        )}

        {sdLoading && (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3"
            style={{ backgroundColor: "#020B18" }}
          >
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{
                borderColor: "#00D4FF20",
                borderTopColor: "#00D4FF",
              }}
            />
            <p
              className="font-mono-ig text-xs tracking-widest"
              style={{ color: "#E8EDF230" }}
            >
              READING FROM ESP32...
            </p>
            <p className="font-mono-ig text-xs" style={{ color: "#E8EDF220" }}>
              Fetching via HTTP from {sdIp}
            </p>
          </div>
        )}

        {sdError && !sdLoading && (
          <div
            className="flex flex-col items-center justify-center py-16 gap-3"
            style={{ backgroundColor: "#020B18" }}
          >
            <MdSdCard size={32} style={{ color: "#EF444430" }} />
            <p
              className="font-mono-ig text-xs tracking-widest"
              style={{ color: "#EF4444" }}
            >
              CONNECTION FAILED
            </p>
            <p
              className="font-mono-ig text-xs text-center max-w-sm"
              style={{ color: "#E8EDF240" }}
            >
              {sdError}
            </p>
            <button
              onClick={() => fetchSDLogs(sdMode)}
              className="mt-2 px-4 py-1.5 rounded-sm font-mono-ig text-xs font-bold tracking-wider"
              style={{
                backgroundColor: "#00D4FF15",
                border: "1px solid #00D4FF30",
                color: "#00D4FF",
              }}
            >
              RETRY
            </button>
          </div>
        )}

        {sdLoaded && !sdLoading && sdLogs.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-16 gap-2"
            style={{ backgroundColor: "#020B18" }}
          >
            <MdSdCard size={28} style={{ color: "#E8EDF215" }} />
            <p
              className="font-mono-ig text-xs tracking-widest"
              style={{ color: "#E8EDF230" }}
            >
              LOG IS EMPTY
            </p>
          </div>
        )}

        {sdLoaded && !sdLoading && sdLogs.length > 0 && (
          <div
            className="max-h-[55vh] overflow-y-auto"
            style={{ backgroundColor: "#020B18" }}
          >
            {sdLogs.map((entry, i) => (
              <div
                key={i}
                className="flex items-start gap-4 px-4 py-2 border-b transition-colors"
                style={{ borderColor: "#0F264430" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = "#0A162840")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = "transparent")
                }
              >
                <span
                  className="font-mono-ig text-xs w-8 shrink-0 pt-0.5"
                  style={{ color: "#E8EDF220" }}
                >
                  {String(entry.index + 1).padStart(3, "0")}
                </span>
                <p
                  className="font-mono-ig text-xs flex-1 leading-relaxed break-all"
                  style={{
                    color: sdMode === "raw" ? "#F59E0B80" : "#E8EDF270",
                    letterSpacing: sdMode === "raw" ? "0.05em" : "normal",
                  }}
                >
                  {entry.line}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* summary */}
      {sdLoaded && !sdLoading && (
        <div className="flex items-center justify-between mt-3 px-1">
          <span
            className="font-mono-ig text-xs tracking-wider"
            style={{ color: "#E8EDF230" }}
          >
            {sdLogs.length} entr{sdLogs.length !== 1 ? "ies" : "y"} read
          </span>
          <span
            className="font-mono-ig text-xs tracking-widest"
            style={{ color: "#E8EDF215" }}
          >
            ESP32 · XOR ENCRYPTED
          </span>
        </div>
      )}
    </div>
  );
};

export default SdCardLogs;

