import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { useAuth } from "../useContext/userContext";
import LogPageHeader from "../Components/LogPageHeader";
import LogPageTabSwitch from "../Components/LogPageTabSwitch";
import DatabaseLogs from "../Components/DatabaseLogs";
import SdCardLogs from "../Components/SdCardLogs";

const API_URL =
  import.meta.env.VITE_API_URL || "https://intelliguard-1.onrender.com";

const LogsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("database");
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [sdLogs, setSdLogs] = useState([]);

  useEffect(() => {
    if (!user?.accessToken) {
      navigate("/");
    }
  }, [user, navigate]);

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
      fetchLogs();
    }
  }, [activeTab, fetchLogs]);

  const filteredLogs = logs.filter((log) =>
    log.message.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#020B18" }}>
      <LogPageHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sdLogs={sdLogs}
        filter={filter}
        setLoading={setLoading}
        search={search}
        filteredLogs={filteredLogs}
      />

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-8">
        <LogPageTabSwitch
          setActiveTab={setActiveTab}
          activeTab={activeTab}
        />

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

        {activeTab === "sdcard" && (
          <SdCardLogs
            setSdLogs={setSdLogs}
            sdLogs={sdLogs}
          />
        )}
      </div>
    </div>
  );
};

export default LogsPage;
