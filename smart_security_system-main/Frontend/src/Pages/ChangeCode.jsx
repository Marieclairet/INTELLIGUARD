import { useAuth } from "../useContext/userContext";
import { useNavigate } from "react-router";

const ChangeCode = () => {
  const {
    handleUpdatePin,
    currentPin,
    setCurrentPin,
    newPin,
    setNewPin,
    confirmedPin,
    setConfirmedPin,
    isSaving,
  } = useAuth();
  const navigate = useNavigate();

  const inputStyle = {
    backgroundColor: "#020B18",
    border: "1px solid #0F2644",
    color: "#E8EDF2",
    caretColor: "#00D4FF",
  };

  const fields = [
    { label: "CURRENT ACCESS CODE", value: currentPin, setter: setCurrentPin },
    { label: "NEW ACCESS CODE", value: newPin, setter: setNewPin },
    { label: "CONFIRM NEW CODE", value: confirmedPin, setter: setConfirmedPin },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: "#020B18" }}
    >
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate("/")}
            className="font-mono-ig text-xs tracking-wider px-3 py-1.5 rounded-sm transition-all"
            style={{
              backgroundColor: "transparent",
              border: "1px solid #0F2644",
              color: "#E8EDF240",
            }}
            onMouseEnter={e => e.currentTarget.style.color = "#E8EDF2"}
            onMouseLeave={e => e.currentTarget.style.color = "#E8EDF240"}
          >
            ← BACK
          </button>
          <div>
            <h1
              className="font-mono-ig font-bold text-sm tracking-widest"
              style={{ color: "#00D4FF" }}
            >
              INTELLIGUARD
            </h1>
            <p
              className="font-mono-ig text-xs tracking-widest"
              style={{ color: "#E8EDF240" }}
            >
              CHANGE ACCESS CODE
            </p>
          </div>
        </div>

        <div
          className="rounded-sm p-6"
          style={{ backgroundColor: "#0A1628", border: "1px solid #0F2644" }}
        >
          <p
            className="font-mono-ig text-xs tracking-widest mb-5"
            style={{ color: "#E8EDF240" }}
          >
            OPERATOR CODE MANAGEMENT
          </p>

          {fields.map((field) => (
            <div key={field.label} className="mb-4">
              <label
                className="font-mono-ig text-xs tracking-wider block mb-2"
                style={{ color: "#E8EDF260" }}
              >
                {field.label}
              </label>
              <input
                type="password"
                className="w-full px-3 py-2.5 rounded-sm font-mono-ig text-sm outline-none transition-all"
                style={inputStyle}
                placeholder="• • • • • •"
                maxLength={6}
                onChange={(e) => field.setter(e.target.value.replace(/\D/g, ""))}
                value={field.value}
                onFocus={e => e.target.style.borderColor = "#00D4FF50"}
                onBlur={e => e.target.style.borderColor = "#0F2644"}
              />
            </div>
          ))}

          <button
            onClick={handleUpdatePin}
            disabled={isSaving}
            className="w-full py-2.5 rounded-sm font-mono-ig text-xs font-bold tracking-widest transition-all mt-2"
            style={{
              backgroundColor: isSaving ? "#00D4FF50" : "#00D4FF",
              color: "#020B18",
              cursor: isSaving ? "not-allowed" : "pointer",
            }}
          >
            {isSaving ? "UPDATING..." : "UPDATE ACCESS CODE"}
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

export default ChangeCode;