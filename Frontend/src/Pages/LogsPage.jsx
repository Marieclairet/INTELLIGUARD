/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router";
import { useAuth } from "../useContext/userContext";
import LogPageHeader from "../Components/LogPageHeader";
import LogPageTabSwitch from "../Components/LogPageTabSwitch";
import DatabaseLogs from "../Components/DatabaseLogs";
import SdCardLogs from "../Components/SdCardLogs";

const LogsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  // ── TAB STATE ──
  const [activeTab, setActiveTab] = useState("database");

  // ── DATABASE STATE ──
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [clearing, setClearing] = useState(false);

  // ── SD CARD STATE ──
  const [sdLogs, setSdLogs] = useState([]);

  // Tracks whether this is the very first fetch for the current
  // tab/filter combo, so the spinner only shows on first load —
  // background polling refreshes silently without flicker.
  const isFirstLoad = useRef(true);

  // ── AUTH GUARD ──
  useEffect(() => {
    if (!user?.accessToken) {
      navigate("/");
    }
  }, [user, navigate]);

  // ── FETCH DATABASE LOGS ──
  // This is the single source of truth for "logs" — LogPageHeader no
  // longer keeps its own copy, so the CLEAR button and record counts
  // always reflect what's actually loaded here.
  const fetchLogs = useCallback(async () => {
    if (isFirstLoad.current) setLoading(true);
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
      isFirstLoad.current = false;
    }
  }, [filter]);

  // Fetch immediately when the database tab is opened or the filter
  // changes, then poll every 3s while the tab stays active — same
  // pattern App.jsx already uses for the Dashboard.
  useEffect(() => {
    if (activeTab !== "database") return;

    isFirstLoad.current = true;
    fetchLogs();

    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [activeTab, fetchLogs]);

  // ── CLEAR LOGS ──
  const handleClearLogs = useCallback(async () => {
    if (
      !window.confirm(
        "Permanently delete all database logs? This cannot be undone.",
      )
    )
      return;
    setClearing(true);
    try {
      await axios.delete(`${API_URL}/api/event/logs`);
      setLogs([]);
    } catch (error) {
      console.log("[clearLogs]", error);
    } finally {
      setClearing(false);
    }
  }, [API_URL]);

  const filteredLogs = logs.filter((log) =>
    log.message.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#020B18" }}>
      {/* ── HEADER ── */}
      <LogPageHeader
        activeTab={activeTab}
        sdLogs={sdLogs}
        filteredLogs={filteredLogs}
        logs={logs}
        onRefresh={fetchLogs}
        onClear={handleClearLogs}
        clearing={clearing}
      />
      {/* CONTENT */}
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-8">
        <LogPageTabSwitch setActiveTab={setActiveTab} activeTab={activeTab} />
        {/* 
            DATABASE LOGS TAB
        */}
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

        {/*
            SD CARD LOGS TAB
         */}
        {activeTab === "sdcard" && (
          <SdCardLogs setSdLogs={setSdLogs} sdLogs={sdLogs} />
        )}
      </div>
    </div>
  );
};

export default LogsPage;
