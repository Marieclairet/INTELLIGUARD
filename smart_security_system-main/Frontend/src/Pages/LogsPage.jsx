import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { useAuth } from "../useContext/userContext";
import {
  MdInsertDriveFile,
  MdDelete,
  MdRefresh,
  MdSdCard,
  MdCloud,
} from "react-icons/md";
import { RiShieldCheckFill } from "react-icons/ri";
import { TbAlertTriangle, TbAlertOctagon } from "react-icons/tb";

const SD_CARD_IP = "http://172.20.10.3:4001";

const LogsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── TAB STATE ──
  const [activeTab, setActiveTab] = useState("database"); // "database" | "sdcard"

  // ── DATABASE STATE ──
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [search, setSearch] = useState("");

  // ── SD CARD STATE ──
  const [sdMode, setSdMode] = useState("decrypted"); // "decrypted" | "raw"
  const [sdLogs, setSdLogs] = useState([]);
  const [sdLoading, setSdLoading] = useState(false);
  const [sdError, setSdError] = useState(null);
  const [sdLoaded, setSdLoaded] = useState(false);

  // ── AUTH GUARD ──
  useEffect(() => {
    if (!user?.accessToken) {
      navigate("/");
    }
  }, [user, navigate]);

  // ── FETCH DATABASE LOGS ──
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        filter === "all"
          ? "http://localhost:4000/api/event/logs"
          : `http://localhost:4000/api/event/logs?type=${filter}`;
      const res = await axios.get(url);
      setLogs(res.data);
    } catch (error) {
      console.log("[fetchLogs]", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (activeTab === "database") {
     // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchLogs();
    }
  }, [activeTab, fetchLogs]);

  // ── FETCH SD CARD LOGS ──
  const fetchSDLogs = useCallback(async (mode) => {
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
  }, []);

  // ── CLEAR DATABASE LOGS ──
  const handleClearLogs = async () => {
    if (
      !window.confirm(
        "Permanently delete all database logs? This cannot be undone.",
      )
    )
      return;
    setClearing(true);
    try {
      await axios.delete("http://localhost:4000/api/event/logs");
      setLogs([]);
    } catch (error) {
      console.log("[clearLogs]", error);
    } finally {
      setClearing(false);
    }
  };

  const typeConfig = {
    ok: {
      label: "CLEAR",
      color: "#00C896",
      bg: "#00C89615",
      border: "#00C89630",
      icon: <RiShieldCheckFill size={10} />,
    },
    warn: {
      label: "WARN",
      color: "#F59E0B",
      bg: "#F59E0B15",
      border: "#F59E0B30",
      icon: <TbAlertTriangle size={10} />,
    },
    danger: {
      label: "ALERT",
      color: "#EF4444",
      bg: "#EF444415",
      border: "#EF444430",
      icon: <TbAlertOctagon size={10} />,
    },
  };

  const dbFilters = [
    { key: "all", label: "ALL" },
    { key: "ok", label: "CLEAR" },
    { key: "warn", label: "WARN" },
    { key: "danger", label: "ALERT" },
  ];

  const filteredLogs = logs.filter((log) =>
    log.message.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#020B18" }}>
      {/* ── HEADER ── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 px-4 py-3"
        style={{
          backgroundColor: "#0A1628",
          borderBottom: "1px solid #0F2644",
        }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MdInsertDriveFile size={18} style={{ color: "#00D4FF" }} />
            <div>
              <span
                className="font-mono-ig font-bold text-sm tracking-widest"
                style={{ color: "#00D4FF" }}
              >
                SECURITY LOG VIEWER
              </span>
              <p
                className="font-mono-ig text-xs"
                style={{ color: "#E8EDF230" }}
              >
                {activeTab === "database"
                  ? `${filteredLogs.length} database record${filteredLogs.length !== 1 ? "s" : ""}`
                  : `${sdLogs.length} SD card entr${sdLogs.length !== 1 ? "ies" : "y"}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "database" && (
              <>
                <button
                  onClick={fetchLogs}
                  className="p-1.5 rounded-sm transition-all"
                  style={{ border: "1px solid #0F2644", color: "#E8EDF240" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#00D4FF")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#E8EDF240")
                  }
                >
                  <MdRefresh size={16} />
                </button>
                <button
                  onClick={handleClearLogs}
                  disabled={clearing || logs.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono-ig text-xs font-bold tracking-wider"
                  style={{
                    border: "1px solid #EF444430",
                    color: "#EF444460",
                    backgroundColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!clearing && logs.length > 0)
                      e.currentTarget.style.color = "#EF4444";
                  }}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "#EF444460")
                  }
                >
                  <MdDelete size={13} />
                  CLEAR
                </button>
              </>
            )}
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-mono-ig text-xs font-bold tracking-wider transition-all"
              style={{
                backgroundColor: "#00D4FF15",
                border: "1px solid #00D4FF30",
                color: "#00D4FF",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#00D4FF25")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#00D4FF15")
              }
            >
              ← DASHBOARD
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-8">
        {/* ── TAB SWITCHER ── */}
        <div
          className="flex items-center gap-1 mb-5 p-1 rounded-sm"
          style={{ backgroundColor: "#0A1628", border: "1px solid #0F2644" }}
        >
          <button
            onClick={() => setActiveTab("database")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm font-mono-ig text-xs font-bold tracking-widest transition-all"
            style={{
              backgroundColor:
                activeTab === "database" ? "#00D4FF20" : "transparent",
              border:
                activeTab === "database"
                  ? "1px solid #00D4FF40"
                  : "1px solid transparent",
              color: activeTab === "database" ? "#00D4FF" : "#E8EDF240",
            }}
          >
            <MdCloud size={14} />
            DATABASE LOGS
            <span
              className="font-mono-ig text-xs px-1.5 py-0.5 rounded-sm"
              style={{
                backgroundColor:
                  activeTab === "database" ? "#00D4FF20" : "#E8EDF210",
                color: activeTab === "database" ? "#00D4FF" : "#E8EDF230",
              }}
            >
              MONGODB
            </span>
          </button>
          <button
            onClick={() => setActiveTab("sdcard")}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm font-mono-ig text-xs font-bold tracking-widest transition-all"
            style={{
              backgroundColor:
                activeTab === "sdcard" ? "#00D4FF20" : "transparent",
              border:
                activeTab === "sdcard"
                  ? "1px solid #00D4FF40"
                  : "1px solid transparent",
              color: activeTab === "sdcard" ? "#00D4FF" : "#E8EDF240",
            }}
          >
            <MdSdCard size={14} />
            SD CARD LOGS
            <span
              className="font-mono-ig text-xs px-1.5 py-0.5 rounded-sm"
              style={{
                backgroundColor:
                  activeTab === "sdcard" ? "#00D4FF20" : "#E8EDF210",
                color: activeTab === "sdcard" ? "#00D4FF" : "#E8EDF230",
              }}
            >
              HARDWARE
            </span>
          </button>
        </div>

        {/* ══════════════════════════════════════
            DATABASE LOGS TAB
        ══════════════════════════════════════ */}
        {activeTab === "database" && (
          <div>
            {/* search + filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 px-3 py-2 rounded-sm font-mono-ig text-xs outline-none"
                style={{
                  backgroundColor: "#0A1628",
                  border: "1px solid #0F2644",
                  color: "#E8EDF2",
                  caretColor: "#00D4FF",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#00D4FF50")}
                onBlur={(e) => (e.target.style.borderColor = "#0F2644")}
              />
              <div className="flex items-center gap-1">
                {dbFilters.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className="px-3 py-2 rounded-sm font-mono-ig text-xs font-bold tracking-wider transition-all"
                    style={{
                      backgroundColor:
                        filter === f.key ? "#00D4FF20" : "transparent",
                      border: `1px solid ${filter === f.key ? "#00D4FF50" : "#0F2644"}`,
                      color: filter === f.key ? "#00D4FF" : "#E8EDF240",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* table */}
            <div
              className="rounded-sm overflow-hidden"
              style={{ border: "1px solid #0F2644" }}
            >
              <div
                className="grid gap-3 px-4 py-2"
                style={{
                  gridTemplateColumns: "90px 1fr 80px",
                  backgroundColor: "#0A1628",
                  borderBottom: "1px solid #0F2644",
                }}
              >
                {["TIME", "EVENT", "STATUS"].map((h) => (
                  <span
                    key={h}
                    className="font-mono-ig text-xs font-bold tracking-widest"
                    style={{ color: "#E8EDF230" }}
                  >
                    {h}
                  </span>
                ))}
              </div>

              {loading ? (
                <div
                  className="flex items-center justify-center py-16"
                  style={{ backgroundColor: "#020B18" }}
                >
                  <div
                    className="w-6 h-6 rounded-full border-2 animate-spin"
                    style={{
                      borderColor: "#00D4FF40",
                      borderTopColor: "#00D4FF",
                    }}
                  />
                </div>
              ) : filteredLogs.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-16 gap-2"
                  style={{ backgroundColor: "#020B18" }}
                >
                  <MdCloud size={28} style={{ color: "#E8EDF215" }} />
                  <p
                    className="font-mono-ig text-xs tracking-widest"
                    style={{ color: "#E8EDF230" }}
                  >
                    NO DATABASE RECORDS FOUND
                  </p>
                </div>
              ) : (
                <div
                  className="divide-y max-h-[55vh] overflow-y-auto"
                  style={{
                    backgroundColor: "#020B18",
                    borderColor: "#0F264450",
                  }}
                >
                  {filteredLogs.map((log) => {
                    const tc = typeConfig[log.type] || typeConfig.ok;
                    return (
                      <div
                        key={log._id}
                        className="grid gap-3 px-4 py-2.5 transition-colors"
                        style={{ gridTemplateColumns: "90px 1fr 80px" }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.backgroundColor = "#0A162840")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.backgroundColor =
                            "transparent")
                        }
                      >
                        <div className="flex flex-col justify-center">
                          <span
                            className="font-mono-ig text-xs"
                            style={{ color: "#E8EDF250" }}
                          >
                            {new Date(log.date).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                          <span
                            className="font-mono-ig text-xs"
                            style={{ color: "#E8EDF225" }}
                          >
                            {new Date(log.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        </div>
                        <p
                          className="text-xs self-center leading-snug"
                          style={{ color: "#E8EDF280" }}
                        >
                          {log.message}
                        </p>
                        <div className="flex items-center justify-end">
                          <span
                            className="font-mono-ig text-xs font-bold px-2 py-0.5 rounded-sm flex items-center gap-1"
                            style={{
                              backgroundColor: tc.bg,
                              border: `1px solid ${tc.border}`,
                              color: tc.color,
                            }}
                          >
                            {tc.icon}
                            {tc.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* summary */}
            <div className="flex items-center justify-between mt-3 px-1">
              <div className="flex items-center gap-4">
                {[
                  { label: "CLEAR", color: "#00C896", type: "ok" },
                  { label: "WARN", color: "#F59E0B", type: "warn" },
                  { label: "ALERT", color: "#EF4444", type: "danger" },
                ].map((s) => (
                  <div key={s.label} className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full inline-block"
                      style={{ backgroundColor: s.color }}
                    />
                    <span
                      className="font-mono-ig text-xs tracking-wider"
                      style={{ color: "#E8EDF230" }}
                    >
                      {s.label}: {logs.filter((l) => l.type === s.type).length}
                    </span>
                  </div>
                ))}
              </div>
              <span
                className="font-mono-ig text-xs tracking-widest"
                style={{ color: "#E8EDF215" }}
              >
                MONGODB ATLAS
              </span>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════
            SD CARD LOGS TAB
        ══════════════════════════════════════ */}
        {activeTab === "sdcard" && (
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
                    backgroundColor:
                      sdMode === "raw" ? "#F59E0B20" : "transparent",
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
                      This is the exact data stored on the physical SD card —
                      XOR encrypted with key INTELLIGUARD. Each log entry is
                      stored as a hexadecimal string. Without the key, this data
                      is unreadable. This proves that sensitive security events
                      are not stored in plaintext on the hardware.
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
                      encrypted log above. Both views come directly from the
                      physical SD card on the ESP32 hardware.
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
                <span
                  className="font-mono-ig text-xs"
                  style={{ color: "#E8EDF220" }}
                >
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
                  <p
                    className="font-mono-ig text-xs"
                    style={{ color: "#E8EDF220" }}
                  >
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
                  <p
                    className="font-mono-ig text-xs"
                    style={{ color: "#E8EDF220" }}
                  >
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
                  {sdLogs.length} entr{sdLogs.length !== 1 ? "ies" : "y"} read
                  from /log.txt
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
        )}
      </div>
    </div>
  );
};

export default LogsPage;
