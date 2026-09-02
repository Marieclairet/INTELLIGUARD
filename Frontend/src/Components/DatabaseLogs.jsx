import { MdCloud } from "react-icons/md";
import { RiShieldCheckFill } from "react-icons/ri";
import { TbAlertTriangle, TbAlertOctagon } from "react-icons/tb";

const DatabaseLogs = ({
  search,
  setSearch,
  setFilter,
  filter,
  loading,
  filteredLogs,
  logs,
}) => {
  const dbFilters = [
    { key: "all", label: "ALL" },
    { key: "ok", label: "CLEAR" },
    { key: "warn", label: "WARN" },
    { key: "danger", label: "ALERT" },
  ];
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
  return (
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
                backgroundColor: filter === f.key ? "#00D4FF20" : "transparent",
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
                    (e.currentTarget.style.backgroundColor = "transparent")
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
  );
};

export default DatabaseLogs;
