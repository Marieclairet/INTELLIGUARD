const SystemActions = ({ event, status }) => {
  const typeConfig = {
    ok:     { label: "CLEAR",   color: "#00C896", bg: "#00C89615", border: "#00C89630" },
    warn:   { label: "WARN",    color: "#F59E0B", bg: "#F59E0B15", border: "#F59E0B30" },
    danger: { label: "ALERT",   color: "#EF4444", bg: "#EF444415", border: "#EF444430" },
  };

  const sensorRows = [
    {
      label: "PIR MOTION",
      values: { normal: "No motion", suspicious: "Motion detected", intrution: "Triggered" },
    },
    {
      label: "ENTRY POINT",
      values: { normal: "Secured", suspicious: "Activity detected", intrution: "Breach detected" },
    },
    {
      label: "TAMPER SW",
      values: { normal: "Enclosure secure", suspicious: "Enclosure secure", intrution: "Enclosure opened" },
    },
    {
      label: "NETWORK",
      values: { normal: "Online", suspicious: "Online", intrution: "Online — alerting" },
    },
  ];

  const statusColor = {
    normal: "#00C896",
    suspicious: "#F59E0B",
    intrution: "#EF4444",
  };

  const col = statusColor[status] || "#00D4FF";

  return (
    <div className="max-w-5xl mx-auto px-4 py-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

        {/* SENSOR MATRIX */}
        <div
          className="rounded-sm"
          style={{ backgroundColor: "#0A1628", border: "1px solid #0F2644" }}
        >
          <div
            className="px-4 py-2 border-b"
            style={{ borderColor: "#0F2644" }}
          >
            <span
              className="font-mono-ig text-xs font-bold tracking-widest"
              style={{ color: "#E8EDF240" }}
            >
              SENSOR MATRIX
            </span>
          </div>
          <div className="px-4 py-2 divide-y" style={{ borderColor: "#0F264450" }}>
            {sensorRows.map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between py-2"
              >
                <span
                  className="font-mono-ig text-xs tracking-wider"
                  style={{ color: "#E8EDF250" }}
                >
                  {row.label}
                </span>
                <span
                  className="font-mono-ig text-xs font-bold"
                  style={{ color: col }}
                >
                  {row.values[status] || row.values.normal}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT EVENTS */}
        <div
          className="rounded-sm"
          style={{ backgroundColor: "#0A1628", border: "1px solid #0F2644" }}
        >
          <div
            className="px-4 py-2 border-b flex items-center justify-between"
            style={{ borderColor: "#0F2644" }}
          >
            <span
              className="font-mono-ig text-xs font-bold tracking-widest"
              style={{ color: "#E8EDF240" }}
            >
              RECENT EVENTS
            </span>
            <span
              className="font-mono-ig text-xs"
              style={{ color: "#E8EDF220" }}
            >
              LAST {event?.length || 0}
            </span>
          </div>
          <div className="px-4 py-2 divide-y" style={{ borderColor: "#0F264450" }}>
            {event && event.length > 0 ? (
              event.map((item) => {
                const tc = typeConfig[item.type] || typeConfig.ok;
                return (
                  <div
                    key={item._id}
                    className="flex items-center gap-3 py-2"
                  >
                    <span
                      className="font-mono-ig text-xs w-14 shrink-0"
                      style={{ color: "#E8EDF230" }}
                    >
                      {new Date(item.date).toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                    <p
                      className="text-xs flex-1 leading-snug"
                      style={{ color: "#E8EDF280" }}
                    >
                      {item.message}
                    </p>
                    <span
                      className="font-mono-ig text-xs font-bold px-2 py-0.5 rounded-sm shrink-0"
                      style={{
                        backgroundColor: tc.bg,
                        border: `1px solid ${tc.border}`,
                        color: tc.color,
                      }}
                    >
                      {tc.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <p
                className="font-mono-ig text-xs py-6 text-center"
                style={{ color: "#E8EDF220" }}
              >
                NO EVENTS RECORDED
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemActions;