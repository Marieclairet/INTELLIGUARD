import { MdCloud, MdSdCard } from "react-icons/md";

const LogPageTabSwitch = ({ activeTab, setActiveTab }) => {
  return (
    <div
      className="flex items-center gap-1 mb-5 p-1 rounded-sm"
      style={{ backgroundColor: "#0A1628", border: "1px solid #0F2644" }}
    >
      <button
        onClick={() => setActiveTab("database")}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm font-mono-ig text-xs font-bold tracking-widest transition-all"
        style={{
          backgroundColor:
            activeTab === "database" ? "#00D4FF20" : "transparent",
          border:
            activeTab === "database"
              ? "1px solid #00D4FF40"
              : "1px solid transparent",
          color: activeTab === "database" ? "#00D4FF" : "#E8EDF240",
        }}
      >
        <MdCloud size={14} />
        DATABASE LOGS
        <span
          className="font-mono-ig text-xs px-1.5 py-0.5 rounded-sm"
          style={{
            backgroundColor:
              activeTab === "database" ? "#00D4FF20" : "#E8EDF210",
            color: activeTab === "database" ? "#00D4FF" : "#E8EDF230",
          }}
        >
          MONGODB
        </span>
      </button>
      <button
        onClick={() => setActiveTab("sdcard")}
        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm font-mono-ig text-xs font-bold tracking-widest transition-all"
        style={{
          backgroundColor: activeTab === "sdcard" ? "#00D4FF20" : "transparent",
          border:
            activeTab === "sdcard"
              ? "1px solid #00D4FF40"
              : "1px solid transparent",
          color: activeTab === "sdcard" ? "#00D4FF" : "#E8EDF240",
        }}
      >
        <MdSdCard size={14} />
        SD CARD LOGS
        <span
          className="font-mono-ig text-xs px-1.5 py-0.5 rounded-sm"
          style={{
            backgroundColor: activeTab === "sdcard" ? "#00D4FF20" : "#E8EDF210",
            color: activeTab === "sdcard" ? "#00D4FF" : "#E8EDF230",
          }}
        >
          HARDWARE
        </span>
      </button>
    </div>
  );
};

export default LogPageTabSwitch;
