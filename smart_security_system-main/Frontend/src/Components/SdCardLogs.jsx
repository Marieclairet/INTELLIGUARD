import axios from "axios";
import { useCallback, useState } from "react";
import { MdSdCard } from "react-icons/md";

const SD_CARD_IP = "http://172.20.10.3:4001";

const SdCardLogs = ({ setSdLogs, sdLogs }) => {
  const [sdMode, setSdMode] = useState("decrypted");
  const [sdLoading, setSdLoading] = useState(false);
  const [sdError, setSdError] = useState(null);
  const [sdLoaded, setSdLoaded] = useState(false);

  const fetchSDLogs = useCallback(
    async (mode) => {
      setSdLoading(true);
      setSdError(null);
      setSdLogs([]);
      try {
        const res = await axios.get(
          `${SD_CARD_IP}/sdlog?mode=${mode === "raw" ? "raw" : "decrypted"}`,
          { timeout: 10000 },
        );
        setSdLogs(res.data);
        setSdLoaded(true);
      } catch (error) {
        setSdError(
          "Could not reach ESP32 SD card server. Make sure the ESP32 is powered and on the same network.",
        );
        console.log("[fetchSDLogs]", error);
      } finally {
        setSdLoading(false);
      }
    },
    [setSdLogs],
  );
  return (
    <div>
      {/* encrypted / decrypted switcher */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="flex items-center gap-1 p-1 rounded-sm"
          style={{
            backgroundColor: "#0A1628",
            border: "1px solid #0F2644",
          }}
        >
          <button
            onClick={() => setSdMode("decrypted")}
            className="px-4 py-2 rounded-sm font-mono-ig text-xs font-bold tracking-widest transition-all"
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
          </button>
          <button
            onClick={() => setSdMode("raw")}
            className="px-4 py-2 rounded-sm font-mono-ig text-xs font-bold tracking-widest transition-all"
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
          </button>
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
              READING SD CARD...
            </>
          ) : (
            <>
              <MdSdCard size={13} />
              {sdLoaded ? "REFRESH" : "READ SD CARD"}
            </>
          )}
        </button>
      </div>

      {/* mode description */}
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-sm mb-4"
        style={{
          backgroundColor: sdMode === "raw" ? "#F59E0B08" : "#00C89608",
          border: `1px solid ${sdMode === "raw" ? "#F59E0B20" : "#00C89620"}`,
        }}
      >
        <div className="flex-1">
          {sdMode === "raw" ? (
            <>
              <p
                className="font-mono-ig text-xs font-bold tracking-wider mb-1"
                style={{ color: "#F59E0B" }}
              >
                ENCRYPTED RAW VIEW
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "#E8EDF250" }}
              >
                This is the exact data stored on the physical SD card — XOR
                encrypted with key INTELLIGUARD. Each log entry is stored as a
                hexadecimal string. Without the key, this data is unreadable.
                This proves that sensitive security events are not stored in
                plaintext on the hardware.
              </p>
            </>
          ) : (
            <>
              <p
                className="font-mono-ig text-xs font-bold tracking-wider mb-1"
                style={{ color: "#00C896" }}
              >
                DECRYPTED VIEW
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "#E8EDF250" }}
              >
                The same SD card data after XOR decryption using key
                INTELLIGUARD. This is the human-readable version of the
                encrypted log above. Both views come directly from the physical
                SD card on the ESP32 hardware.
              </p>
            </>
          )}
        </div>
      </div>

      {/* SD card log display */}
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
            {sdMode === "raw"
              ? "RAW ENCRYPTED HEX — /log.txt"
              : "DECRYPTED ENTRIES — /log.txt"}
          </span>
          <span className="font-mono-ig text-xs" style={{ color: "#E8EDF220" }}>
            ESP32 · {SD_CARD_IP}
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
              PRESS READ SD CARD TO LOAD
            </p>
            <p className="font-mono-ig text-xs" style={{ color: "#E8EDF220" }}>
              Data is fetched directly from the ESP32 hardware over WiFi
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
              READING FROM SD CARD...
            </p>
            <p className="font-mono-ig text-xs" style={{ color: "#E8EDF220" }}>
              Fetching via HTTP from ESP32 at {SD_CARD_IP}
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
              SD CARD LOG IS EMPTY
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

      {/* SD card summary */}
      {sdLoaded && !sdLoading && (
        <div className="flex items-center justify-between mt-3 px-1">
          <span
            className="font-mono-ig text-xs tracking-wider"
            style={{ color: "#E8EDF230" }}
          >
            {sdLogs.length} entr{sdLogs.length !== 1 ? "ies" : "y"} read from
            /log.txt
          </span>
          <span
            className="font-mono-ig text-xs tracking-widest"
            style={{ color: "#E8EDF215" }}
          >
            ESP32 SD CARD · XOR ENCRYPTED
          </span>
        </div>
      )}
    </div>
  );
};

export default SdCardLogs;
