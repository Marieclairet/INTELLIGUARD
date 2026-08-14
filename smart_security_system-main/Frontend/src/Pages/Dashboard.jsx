import { useAuth } from "../useContext/userContext";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { Navigate } from "react-router";
import Footer from "../Components/Footer";
import Navbar from "../Components/Navbar";
import Sensors from "../Components/Sensors";
import Status from "../Components/Status";
import SystemActions from "../Components/SystemActions";
import CameraPanel from "../Components/CameraPanel";

const Dashboard = ({ event, status, message, countEvent }) => {
  const { user } = useAuth();
  const [timeInMs, setTimeInMs] = useState(dayjs().valueOf());
  const [startTime] = useState(() => Date.now());
  const [now, setNow] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeInMs(dayjs().valueOf());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!user?.accessToken) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#020B18" }}>
      <Navbar timeInMs={timeInMs} />
      <Status event={event} status={status} message={message} />
      <CameraPanel status={status} />
      <Sensors status={status} />
      <SystemActions event={event} status={status} />
      <Footer now={now} countEvent={countEvent} />
    </div>
  );
};

export default Dashboard;