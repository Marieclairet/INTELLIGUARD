/* eslint-disable react-refresh/only-export-components */
import { useContext, createContext, useState, useEffect } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [pin, setPin] = useState("");
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("userData")) || null,
  );
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmedPin, setConfirmedPin] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pinId, setPinId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("userData", JSON.stringify(user));
  }, [user]);

  const handleLogin = async () => {
    if (!pin.trim()) {
      return toast.error(
        "Sorry! PIN should not be empty. Enter the PIN to login",
      );
    }
    try {
      const res = await axios.post(
        "http://localhost:4000/api/user/login",
        { pin },
        { withCredentials: true },
      );
      if (res?.status === 200) {
        setUser({
          ...res.data.safeUser,
          accessToken: res.data.accessToken,
        });
        navigate("/dashboard");
        setPin("");
      }
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error("User not found or Incorrect PIN");
      }
      console.log({ error });
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    try {
      await axios.post(
        "http://localhost:4000/api/user/logout",
        {},
        { withCredentials: true },
      );
      toast.success("Logged out successfully");
      setUser(null);
      localStorage.clear();
      navigate("/");
    } catch (error) {
      console.log({ error });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:4000/api/user");
        setPinId(res.data);
      } catch (error) {
        console.log("[fetchPinId]", error);
      }
    };
    fetchData();
  }, []);

  const handleUpdatePin = async () => {
    if (!window.confirm("Are you sure you want to change your PIN?")) return;
    if (!pinId) return toast.error("Something went wrong!");
    if (!currentPin.trim() || !newPin.trim() || !confirmedPin.trim()) {
      return toast.error("All fields are required!");
    }
    if (newPin !== confirmedPin) {
      return toast.error("Confirm your new Pin correctly!");
    }
    setIsSaving(true);
    try {
      const res = await axios.put(
        `http://localhost:4000/api/user/update/${pinId.getPin._id}`,
        { currentPin, confirmedPin },
      );
      if (res.status === 200) {
        toast.success("PIN has been changed successfully!");
        setCurrentPin("");
        setNewPin("");
        setConfirmedPin("");
        navigate("/");
      }
    } catch (error) {
      if (error.response?.status === 400) {
        return toast.error("Sorry, user not found!");
      }
      if (error.response?.status === 401) {
        return toast.error("Sorry, your current PIN is wrong. Try again!");
      }
      if (error.response?.status === 404) {
        return toast.error("PIN has failed to update!");
      }
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const checkRefresh = async () => {
      try {
        const res = await axios.post(
          "http://localhost:4000/api/user/refresh_token",
          {},
          { withCredentials: true },
        );
        if (res.data.accessToken) {
          setUser({
            ...res.data.safeUser,
            accessToken: res.data.accessToken,
          });
        }
      } catch (error) {
        console.log("[refreshToken]", error);
      }
    };
    checkRefresh();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        handleLogin,
        pin,
        setPin,
        user,
        handleLogout,
        handleUpdatePin,
        currentPin,
        setCurrentPin,
        newPin,
        setNewPin,
        confirmedPin,
        setConfirmedPin,
        isSaving,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};