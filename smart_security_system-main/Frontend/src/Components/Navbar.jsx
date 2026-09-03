import { MdInsertDriveFile } from "react-icons/md";
import { RiShieldKeyholeFill } from "react-icons/ri";
import { useAuth } from "../useContext/userContext";
import { useNavigate } from "react-router";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";

dayjs.extend(advancedFormat);

const Navbar = ({ timeInMs }) => {
  const { handleLogout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="w-full mb-20">
      <div
        style={{ backgroundColor: "#0A1628", borderBottom: "1px solid #0F2644" }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

          {/* BRAND */}
          <div className="flex items-center gap-3">
            <div
              style={{ backgroundColor: "#00D4FF22", border: "1px solid #00D4FF44" }}
              className="p-1.5 rounded"
            >
              <RiShieldKeyholeFill size={20} style={{ color: "#00D4FF" }} />
            </div>
            <div>
              <span
                className="font-mono-ig font-bold tracking-widest text-sm"
                style={{ color: "#00D4FF" }}
              >
                INTELLIGUARD
              </span>
              <p
                className="font-mono-ig text-xs tracking-wider"
                style={{ color: "#E8EDF250" }}
              >
                ACCESS CONTROL SYSTEM
              </p>
            </div>
          </div>

          {/* CENTER — clock */}
          <div className="hidden md:flex flex-col items-center">
            <span
              className="font-mono-ig font-bold text-sm tracking-widest"
              style={{ color: "#E8EDF2" }}
            >
              {dayjs(timeInMs).format("HH:mm:ss")}
            </span>
            <span
              className="font-mono-ig text-xs tracking-wider"
              style={{ color: "#E8EDF250" }}
            >
              {dayjs(timeInMs).format("DD MMM YYYY [GMT]")}
            </span>
          </div>

          {/* RIGHT — actions */}
          <div className="flex items-center gap-2">
            <div
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded font-mono-ig text-xs font-bold tracking-widest"
              style={{
                backgroundColor: "#00C89620",
                border: "1px solid #00C89640",
                color: "#00C896",
              }}
            >
              <span
                className="pulse-dot w-1.5 h-1.5 rounded-full inline-block"
                style={{ backgroundColor: "#00C896" }}
              ></span>
              LIVE
            </div>
            <button
              onClick={() => navigate("/logs")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded font-mono-ig text-xs font-bold tracking-wider transition-all"
              style={{
                backgroundColor: "#00D4FF15",
                border: "1px solid #00D4FF30",
                color: "#00D4FF",
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "#00D4FF25"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "#00D4FF15"}
            >
              <MdInsertDriveFile size={14} />
              LOGS
            </button>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded font-mono-ig text-xs font-bold tracking-wider transition-all"
              style={{
                backgroundColor: "transparent",
                border: "1px solid #E8EDF220",
                color: "#E8EDF270",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "#E8EDF250";
                e.currentTarget.style.color = "#E8EDF2";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "#E8EDF220";
                e.currentTarget.style.color = "#E8EDF270";
              }}
            >
              LOGOUT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;