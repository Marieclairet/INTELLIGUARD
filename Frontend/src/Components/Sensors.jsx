const Sensors = ({ status }) => {
  const indicators = [
    {
      label: "GREEN",
      sub: "Secure",
      active: status === "normal",
      color: "#00C896",
    },
    {
      label: "AMBER",
      sub: "Caution",
      active: status === "suspicious",
      color: "#F59E0B",
    },
    {
      label: "RED",
      sub: "Alert",
      active: status === "intrution",
      color: "#EF4444",
    },
    {
      label: "BUZZER",
      sub: "Alarm",
      active: status === "intrution",
      color: "#EF4444",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-2">
      <div className="flex items-center gap-2 flex-wrap">
        {indicators.map((ind) => (
          <div
            key={ind.label}
            className="flex-1 min-w-[100px] flex flex-col items-center py-3 rounded-sm"
            style={{
              backgroundColor: ind.active ? `${ind.color}15` : "#0A162840",
              border: `1px solid ${ind.active ? `${ind.color}40` : "#0F264480"}`,
            }}
          >
            <div
              className="w-3 h-3 rounded-full mb-2"
              style={{
                backgroundColor: ind.active ? ind.color : "#E8EDF215",
                boxShadow: ind.active ? `0 0 8px ${ind.color}` : "none",
              }}
            />
            <span
              className="font-mono-ig text-xs font-bold tracking-widest"
              style={{ color: ind.active ? ind.color : "#E8EDF230" }}
            >
              {ind.label}
            </span>
            <span
              className="font-mono-ig text-xs mt-0.5"
              style={{ color: ind.active ? `${ind.color}80` : "#E8EDF220" }}
            >
              {ind.active ? "ACTIVE" : "OFF"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sensors;
