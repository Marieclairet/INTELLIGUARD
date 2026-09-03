import { useState, useEffect } from "react";

const Footer = ({ now, countEvent }) => {
  const totalSeconds = Math.floor(now / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const uptime =
    hours > 0
      ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
      : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const stats = [
    { label: "SESSION UPTIME", value: uptime },
    { label: "ALERTS TODAY",   value: countEvent?.count ?? 0 },
    { label: "CONTROLLER",     value: "ESP32" },
    { label: "UNIT ID",        value: "SEC-0x4A2F" },
  ];

  return (
    <div
      className="mt-4"
      style={{ borderTop: "1px solid #0F2644" }}
    >
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <span
                className="font-mono-ig font-bold text-sm"
                style={{ color: "#00D4FF" }}
              >
                {s.value}
              </span>
              <span
                className="font-mono-ig text-xs tracking-widest mt-0.5"
                style={{ color: "#E8EDF230" }}
              >
                {s.label}
              </span>
            </div>
          ))}
          <div className="flex flex-col items-center">
            <span
              className="font-mono-ig text-xs tracking-widest"
              style={{ color: "#E8EDF215" }}
            >
              INTELLIGUARD © 2026
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Footer;