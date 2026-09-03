/* eslint-disable react-hooks/exhaustive-deps */
import { useCallback, useState } from "react";
import { MdInsertDriveFile, MdDelete, MdRefresh } from "react-icons/md";
import axios from "axios";
import { useNavigate } from "react-router";

const LogPageHeader = ({
  activeTab,
  setLoading,
  filter,
  sdLogs,
  filteredLogs,
}) => {
  const [clearing, setClearing] = useState(false);
  const [logs, setLogs] = useState([]);

  const navigate = useNavigate();
const API_URL = import.meta.env.VITE_API_URL;
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        filter === "all"
          ? `${API_URL}/api/event/logs`
          : `${API_URL}/api/event/logs?type=${filter}`;
      const res = await axios.get(url);
      setLogs(res.data);
    } catch (error) {
      console.log("[fetchLogs]", error);
    } finally {
      setLoading(false);
    }
  }, [filter, setLoading]);

  const handleClearLogs = async () => {
    if (
      !window.confirm(
        "Permanently delete all database logs? This cannot be undone.",
      )
    )
      return;
    setClearing(true);
    try {
      await axios.delete(`${API_URL}/api/event/logs`);
      setLogs([]);
    } catch (error) {
      console.log("[clearLogs]", error);
    } finally {
      setClearing(false);
    }
  };
  return (
    <div>
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
    </div>
  );
};

export default LogPageHeader;
