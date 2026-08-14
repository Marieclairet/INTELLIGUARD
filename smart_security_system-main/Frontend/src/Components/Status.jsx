import { RiShieldCheckFill } from "react-icons/ri";
import { TbAlertTriangle, TbAlertOctagon } from "react-icons/tb";

const Status = ({ status, message }) => {
  const config = {
    normal: {
      label: "ALL CLEAR",
      desc: "All sensors nominal — no threats detected",
      color: "#00C896",
      bg: "#00C89610",
      border: "#00C89630",
      icon: <RiShieldCheckFill size={36} />,
    },
    suspicious: {
      label: "SUSPICIOUS ACTIVITY",
      desc: "Elevated monitoring — access attempt or motion detected",
      color: "#F59E0B",
      bg: "#F59E0B10",
      border: "#F59E0B30",
      icon: <TbAlertTriangle size={36} />,
    },
    intrution: {
      label: "INTRUSION DETECTED",
      desc: "Unauthorised access confirmed — immediate action required",
      color: "#EF4444",
      bg: "#EF444410",
      border: "#EF444430",
      icon: <TbAlertOctagon size={36} />,
    },
  };

  const c = config[status] || config.normal;

  return (
    <div className="max-w-5xl mx-auto px-4 py-2">
      <div
        className="relative overflow-hidden rounded-sm"
        style={{
          backgroundColor: c.bg,
          border: `1px solid ${c.border}`,
        }}
      >
        {/* scan line — only on normal */}
        {status === "normal" && (
          <div
            className="scan-line absolute top-0 bottom-0 w-8 pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${c.color}20, transparent)`,
            }}
          />
        )}

        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p
              className="font-mono-ig text-xs tracking-widest mb-1"
              style={{ color: `${c.color}90` }}
            >
              SYSTEM STATUS
            </p>
            <h1
              className="font-mono-ig font-bold text-2xl tracking-wider mb-1"
              style={{ color: c.color }}
            >
              {c.label}
            </h1>
            <p
              className="text-sm"
              style={{ color: "#E8EDF270" }}
            >
              {message || c.desc}
            </p>
          </div>
          <div style={{ color: c.color, opacity: 0.8 }}>
            {c.icon}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Status;