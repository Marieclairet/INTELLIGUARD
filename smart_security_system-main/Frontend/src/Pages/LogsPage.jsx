```jsx
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { useAuth } from "../useContext/userContext";
import LogPageHeader from "../Components/LogPageHeader";
import LogPageTabSwitch from "../Components/LogPageTabSwitch";
import DatabaseLogs from "../Components/DatabaseLogs";
import SdCardLogs from "../Components/SdCardLogs";

const API_URL = import.meta.env.VITE_API_URL;

const LogsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // ── TAB STATE ──
  const [activeTab, setActiveTab] = useState("database");

  // ── DATABASE STATE ──
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // ── SD CARD STATE ──
  const [sdLogs, setSdLogs] = useState([]);

  // ── AUTH GUARD ──
  useEffect(() => {
    if (!user?.accessToken) {
      navigate("/");
    }
  }, [user, navigate]);

  // ── FETCH DATABASE LOGS ──
  const fetchLogs = useCallback(async () => {
    setLoading(true);

    try {
      const url =
        filter === "all"
          ? `${API_URL}/api/event/logs`
          : `${API_URL}/api/event/logs?type=${filter}`;

      const res = await axios.get(url);
      setLogs(res.data);
    } catch (error) {
      console.log("[fetchLogs]", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (activeTab === "database") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchLogs();
    }
  }, [activeTab, fetchLogs]);

  const filteredLogs = logs.filter((log) =>
    log.message.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#020B18" }}>
      {/* ── HEADER ── */}
      <LogPageHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sdLogs={sdLogs}
        filter={filter}
        setLoading={setLoading}
        search={search}
        filteredLogs={filteredLogs}
      />

      {/* CONTENT */}
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-8">
        <LogPageTabSwitch
          setActiveTab={setActiveTab}
          activeTab={activeTab}
        />

        {/* DATABASE LOGS TAB */}
        {activeTab === "database" && (
          <DatabaseLogs
            setSearch={setSearch}
            search={search}
            filter={filter}
            setFilter={setFilter}
            loading={loading}
            filteredLogs={filteredLogs}
            logs={logs}
          />
        )}

        {/* SD CARD LOGS TAB */}
        {activeTab === "sdcard" && (
          <SdCardLogs setSdLogs={setSdLogs} sdLogs={sdLogs} />
        )}
      </div>
    </div>
  );
};

export default LogsPage;
```
