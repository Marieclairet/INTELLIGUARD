import { useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../useContext/userContext";
import { RiShieldKeyholeFill } from "react-icons/ri";
import { FaEye, FaRegEyeSlash } from "react-icons/fa";

const LoginPage = () => {
  const [visible, setVisible] = useState(false);
  const [eye, setEye] = useState(true);
  const navigate = useNavigate();
  const { handleLogin, pin, setPin } = useAuth();

  const handleInputType = () => {
    setVisible(!visible);
    setEye(!eye);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#020B18" }}
    >
      <div className="w-full max-w-sm">

        {/* Logo block */}
        <div className="flex flex-col items-center mb-10">
          <div
            className="p-4 rounded-sm mb-4"
            style={{
              backgroundColor: "#00D4FF10",
              border: "1px solid #00D4FF30",
            }}
          >
            <RiShieldKeyholeFill size={40} style={{ color: "#00D4FF" }} />
          </div>
          <h1
            className="font-mono-ig font-bold text-xl tracking-widest"
            style={{ color: "#00D4FF" }}
          >
            INTELLIGUARD
          </h1>
          <p
            className="font-mono-ig text-xs tracking-widest mt-1"
            style={{ color: "#E8EDF240" }}
          >
            ACCESS CONTROL SYSTEM
          </p>
        </div>

        {/* Login card */}
        <div
          className="rounded-sm p-6"
          style={{
            backgroundColor: "#0A1628",
            border: "1px solid #0F2644",
          }}
        >
          <p
            className="font-mono-ig text-xs tracking-widest mb-5"
            style={{ color: "#E8EDF240" }}
          >
            OPERATOR AUTHENTICATION
          </p>

          <div className="mb-4">
            <label
              className="font-mono-ig text-xs tracking-wider block mb-2"
              style={{ color: "#E8EDF260" }}
            >
              6-DIGIT ACCESS CODE
            </label>
            <div className="flex gap-2">
              <input
                type={visible ? "text" : "password"}
                className="flex-1 px-3 py-2.5 rounded-sm font-mono-ig text-sm outline-none transition-all"
                style={{
                  backgroundColor: "#020B18",
                  border: "1px solid #0F2644",
                  color: "#E8EDF2",
                  caretColor: "#00D4FF",
                }}
                placeholder="• • • • • •"
                maxLength={6}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                value={pin}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                onFocus={e => e.target.style.borderColor = "#00D4FF50"}
                onBlur={e => e.target.style.borderColor = "#0F2644"}
              />
              <button
                onClick={handleInputType}
                className="px-3 rounded-sm transition-all"
                style={{
                  backgroundColor: "#020B18",
                  border: "1px solid #0F2644",
                  color: "#E8EDF240",
                }}
              >
                {eye ? <FaRegEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
          </div>

          <button
            onClick={handleLogin}
            className="w-full py-2.5 rounded-sm font-mono-ig text-xs font-bold tracking-widest transition-all mb-3"
            style={{
              backgroundColor: "#00D4FF",
              color: "#020B18",
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = "#00BFEA"}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = "#00D4FF"}
          >
            AUTHENTICATE
          </button>

          <div
            className="text-center font-mono-ig text-xs mb-3"
            style={{ color: "#E8EDF220" }}
          >
            ——— OR ———
          </div>

          <button
            onClick={() => navigate("/change-code")}
            className="w-full py-2.5 rounded-sm font-mono-ig text-xs font-bold tracking-widest transition-all"
            style={{
              backgroundColor: "transparent",
              border: "1px solid #0F2644",
              color: "#E8EDF240",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "#E8EDF230";
              e.currentTarget.style.color = "#E8EDF270";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = "#0F2644";
              e.currentTarget.style.color = "#E8EDF240";
            }}
          >
            CHANGE ACCESS CODE
          </button>
        </div>

        <p
          className="font-mono-ig text-xs text-center mt-6 tracking-widest"
          style={{ color: "#E8EDF215" }}
        >
          INTELLIGUARD © 2026 — SECURE ACCESS
        </p>
      </div>
    </div>
  );
};

export default LoginPage;