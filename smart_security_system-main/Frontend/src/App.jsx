/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Dashboard from "./Pages/Dashboard";
import LoginPage from "./Pages/LoginPage";
import ChangeCode from "./Pages/ChangeCode";
import LogsPage from "./Pages/LogsPage";
import { Routes, Route } from "react-router";
import { AuthProvider } from "./useContext/userContext";
import "./App.css";

function App() {
  const [event, setEvent] = useState(null);
  const [status, setStatus] = useState("normal");
  const [message, setMessage] = useState(
    "All sensors clear — no threats detected",
  );
  const [countEvent, setCountEvent] = useState({ count: 0 });

  const getCount = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/event/count");
      setCountEvent(res.data);
    } catch (error) {
      console.log("[getCount]", error);
    }
  }, []);

  useEffect(() => {
    getCount();
    const interval = setInterval(getCount, 3000);
    return () => clearInterval(interval);
  }, [getCount]);

  const getEventLogs = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:4000/api/event");
      const data = res.data;
      setEvent(data);

      if (data.length > 0) {
        const latest = data[0];
        if (latest.type === "warn") {
          setStatus("suspicious");
          setMessage("Motion or access attempt detected — monitoring elevated");
        } else if (latest.type === "danger") {
          setStatus("intrution");
          setMessage("Unauthorised access confirmed — immediate action required");
        } else {
          setStatus("normal");
          setMessage("All sensors clear — no threats detected");
        }
      }
    } catch (error) {
      console.log("[getEventLogs]", error);
    }
  }, []);

  useEffect(() => {
    getEventLogs();
    const interval = setInterval(getEventLogs, 3000);
    return () => clearInterval(interval);
  }, [getEventLogs]);

  return (
    <div className="relative min-h-screen w-full h-full">
      <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_55%,#63e_120%)]"></div>

      <AuthProvider>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <Dashboard
                event={event}
                status={status}
                message={message}
                countEvent={countEvent}
              />
            }
          />
          <Route path="/change-code" element={<ChangeCode />} />
          <Route path="/logs" element={<LogsPage />} />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;