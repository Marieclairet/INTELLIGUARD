import { useState } from "react";
import { MdVideocam, MdVideocamOff, MdFiberManualRecord } from "react-icons/md";
import { TbAlertTriangle } from "react-icons/tb";

const CAMERA_URL = "http://172.20.10.2";
const STREAM_URL = `${CAMERA_URL}:81/stream`;

const CameraPanel = ({ status }) => {
  const [streamError, setStreamError] = useState(false);
  const [streamLoaded, setStreamLoaded] = useState(false);

  const motionActive = status === "suspicious" || status === "intrution";

  const borderColor = {
    normal: "#0F2644",
    suspicious: "#F59E0B",
    intrution: "#EF4444",
  };

  const border = borderColor[status] || "#0F2644";

  return (
    <div className="max-w-5xl mx-auto px-4 py-2">
      <div
        className="rounded-sm overflow-hidden transition-all duration-500"
        style={{
          border: `1px solid ${border}`,
          backgroundColor: "#0A1628",
          boxShadow: motionActive ? `0 0 20px ${border}40` : "none",
        }}
      >
        {/* HEADER */}
        <div
          className="flex items-center justify-between px-4 py-2 border-b"
          style={{ borderColor: "#0F2644" }}
        >
          <div className="flex items-center gap-2">
            <MdVideocam size={16} style={{ color: "#00D4FF" }} />
            <span
              className="font-mono-ig text-xs font-bold tracking-widest"
              style={{ color: "#E8EDF240" }}
            >
              DOOR CAMERA
            </span>
            {motionActive && (
              <div
                className="flex items-center gap-1 px-2 py-0.5 rounded-sm"
                style={{
                  backgroundColor: `${border}20`,
                  border: `1px solid ${border}40`,
                }}
              >
                <TbAlertTriangle size={10} style={{ color: border }} />
                <span
                  className="font-mono-ig text-xs font-bold tracking-widest"
                  style={{ color: border }}
                >
                  {status === "suspicious" ? "MOTION DETECTED" : "INTRUSION ALERT"}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span
              className="font-mono-ig text-xs tracking-wider"
              style={{ color: "#E8EDF230" }}
            >
              OV2640 · {CAMERA_URL}
            </span>
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-sm"
              style={{
                backgroundColor: streamError ? "#EF444420" : "#00C89620",
                border: `1px solid ${streamError ? "#EF444440" : "#00C89640"}`,
              }}
            >
              <MdFiberManualRecord
                size={8}
                className={streamError ? "" : "pulse-dot"}
                style={{ color: streamError ? "#EF4444" : "#00C896" }}
              />
              <span
                className="font-mono-ig text-xs font-bold tracking-widest"
                style={{ color: streamError ? "#EF4444" : "#00C896" }}
              >
                {streamError ? "OFFLINE" : streamLoaded ? "LIVE" : "CONNECTING"}
              </span>
            </div>
          </div>
        </div>

        {/* CAMERA FEED */}
        <div
          className="relative flex items-center justify-center"
          style={{
            backgroundColor: "#020B18",
            minHeight: "280px",
          }}
        >
          {motionActive && !streamError && (
            <div
              className="scan-line absolute top-0 bottom-0 w-12 pointer-events-none z-10"
              style={{
                background: `linear-gradient(90deg, transparent, ${border}15, transparent)`,
              }}
            />
          )}

          {streamError ? (
            <div className="flex flex-col items-center gap-3 py-16">
              <MdVideocamOff size={40} style={{ color: "#E8EDF215" }} />
              <p
                className="font-mono-ig text-xs tracking-widest"
                style={{ color: "#E8EDF230" }}
              >
                CAMERA OFFLINE
              </p>
              <p
                className="font-mono-ig text-xs"
                style={{ color: "#E8EDF220" }}
              >
                Check ESP32-CAM is powered and on network
              </p>
              <button
                onClick={() => {
                  setStreamError(false);
                  setStreamLoaded(false);
                }}
                className="px-4 py-1.5 rounded-sm font-mono-ig text-xs font-bold tracking-wider mt-2"
                style={{
                  backgroundColor: "#00D4FF15",
                  border: "1px solid #00D4FF30",
                  color: "#00D4FF",
                }}
              >
                RETRY CONNECTION
              </button>
            </div>
          ) : (
            <img
              src={STREAM_URL}
              alt="Door Camera Live Feed"
              className="w-full"
              style={{
                maxHeight: "360px",
                objectFit: "contain",
                display: streamLoaded ? "block" : "none",
              }}
              onLoad={() => setStreamLoaded(true)}
              onError={() => {
                setStreamError(true);
                setStreamLoaded(false);
              }}
            />
          )}

          {!streamLoaded && !streamError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
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
                CONNECTING TO CAMERA...
              </p>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t"
          style={{ borderColor: "#0F2644" }}
        >
          <span
            className="font-mono-ig text-xs tracking-wider"
            style={{ color: "#E8EDF220" }}
          >
            STREAM: {STREAM_URL}
          </span>
          
          <a
            href={CAMERA_URL}
            target="_blank"
            rel="noreferrer"
            className="font-mono-ig text-xs tracking-wider transition-all"
            style={{ color: "#00D4FF50" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#00D4FF")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#00D4FF50")}
          >
            OPEN FULL STREAM →
          </a>
        </div>
      </div>
    </div>
  );
};

export default CameraPanel;