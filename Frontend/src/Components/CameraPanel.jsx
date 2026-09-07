import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { MdVideocam, MdVideocamOff, MdFiberManualRecord } from "react-icons/md";
import { TbAlertTriangle } from "react-icons/tb";

const API_URL = import.meta.env.VITE_API_URL;
const POLL_MS = 1500; // matches the ESP32-CAM's push interval

const CameraPanel = ({ status }) => {
  const [online, setOnline] = useState(false);
  const [frameUrl, setFrameUrl] = useState(null);
  const [checkedOnce, setCheckedOnce] = useState(false);
  const objectUrlRef = useRef(null);

  const motionActive = status === "suspicious" || status === "intrusion";

  const borderColor = {
    normal: "#0F2644",
    suspicious: "#F59E0B",
    intrusion: "#EF4444",
  };
  const border = borderColor[status] || "#0F2644";

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const statusRes = await axios.get(`${API_URL}/api/camera/status`);
        if (cancelled) return;
        setOnline(Boolean(statusRes.data.online));

        if (statusRes.data.online) {
          const frameRes = await axios.get(
            `${API_URL}/api/camera/frame?t=${Date.now()}`,
            { responseType: "blob" },
          );
          if (cancelled) return;

          const url = URL.createObjectURL(frameRes.data);
          if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = url;
          setFrameUrl(url);
        }
      } catch (error) {
        if (!cancelled) setOnline(false);
        console.log("[camera poll]", error);
      } finally {
        if (!cancelled) setCheckedOnce(true);
      }
    };

    poll();
    const interval = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

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
              OV2640 · cloud synced
            </span>
            <div
              className="flex items-center gap-1 px-2 py-0.5 rounded-sm"
              style={{
                backgroundColor: online ? "#00C89620" : "#EF444420",
                border: `1px solid ${online ? "#00C89640" : "#EF444440"}`,
              }}
            >
              <MdFiberManualRecord
                size={8}
                className={online ? "pulse-dot" : ""}
                style={{ color: online ? "#00C896" : "#EF4444" }}
              />
              <span
                className="font-mono-ig text-xs font-bold tracking-widest"
                style={{ color: online ? "#00C896" : "#EF4444" }}
              >
                {!checkedOnce ? "CHECKING" : online ? "LIVE" : "OFFLINE"}
              </span>
            </div>
          </div>
        </div>

        {/* CAMERA FEED */}
        <div
          className="relative flex items-center justify-center"
          style={{ backgroundColor: "#020B18", minHeight: "280px" }}
        >
          {motionActive && online && (
            <div
              className="scan-line absolute top-0 bottom-0 w-12 pointer-events-none z-10"
              style={{
                background: `linear-gradient(90deg, transparent, ${border}15, transparent)`,
              }}
            />
          )}

          {!online && checkedOnce && (
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
                No frame received from the ESP32-CAM in the last 10 seconds
              </p>
            </div>
          )}

          {!checkedOnce && (
            <div className="flex flex-col items-center gap-3 py-16">
              <div
                className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: "#00D4FF20", borderTopColor: "#00D4FF" }}
              />
              <p
                className="font-mono-ig text-xs tracking-widest"
                style={{ color: "#E8EDF230" }}
              >
                CONNECTING...
              </p>
            </div>
          )}

          {online && frameUrl && (
            <img
              src={frameUrl}
              alt="Door Camera Live Feed"
              className="w-full"
              style={{ maxHeight: "360px", objectFit: "contain" }}
            />
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
            Frames pushed by ESP32-CAM every ~1.5s over HTTPS
          </span>
        </div>
      </div>
    </div>
  );
};

export default CameraPanel;
