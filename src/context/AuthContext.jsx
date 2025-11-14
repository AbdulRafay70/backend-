import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { setAuthToken } from "../utils/Api";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [accessToken, setAccessToken] = useState(localStorage.getItem("accessToken"));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("refreshToken"));
  const [userRole, setUserRole] = useState("admin");
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem("accessToken"));

  // Admin Login (keeping the original name)
  const adminLogin = async (access, refresh) => {
    try {
      const decoded = jwtDecode(access);
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      // set axios default Authorization header
      setAuthToken(access);
      setAccessToken(access);
      setRefreshToken(refresh);
      setUserRole("admin");
      setIsAuthenticated(true);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login error", err);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    // clear axios auth header
    setAuthToken(null);
    setAccessToken(null);
    setRefreshToken(null);
    setIsAuthenticated(false);
    setUserRole(null);
    navigate("/login");
  };

  // Idle Modal Setup
  const [showIdleModal, setShowIdleModal] = useState(false);
  const idleTimer = useRef(null);
  const logoutTimer = useRef(null);

  const resetIdleTimer = () => {
    clearTimeout(idleTimer.current);
    clearTimeout(logoutTimer.current);
    setShowIdleModal(false);

    idleTimer.current = setTimeout(() => {
      setShowIdleModal(true);
      logoutTimer.current = setTimeout(() => {
        logout();
        setShowIdleModal(false);
      }, 30 * 1000);
    }, 10 * 60 * 1000);
  };

  const handleUserAction = () => {
    if (isAuthenticated) resetIdleTimer();
  };

  const handleIdleModalConfirm = () => {
    resetIdleTimer();
    setShowIdleModal(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      resetIdleTimer();
      window.addEventListener("mousemove", handleUserAction);
      window.addEventListener("keydown", handleUserAction);
      window.addEventListener("click", handleUserAction);

      return () => {
        window.removeEventListener("mousemove", handleUserAction);
        window.removeEventListener("keydown", handleUserAction);
        window.removeEventListener("click", handleUserAction);
        clearTimeout(idleTimer.current);
        clearTimeout(logoutTimer.current);
      };
    }
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        isAuthenticated,
        userRole,
        adminLogin, 
        logout,
      }}
    >
      {children}

      <Modal show={showIdleModal} backdrop="static" keyboard={false} centered>
        <Modal.Header>
          <Modal.Title>Inactivity Warning</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          You have been inactive. Your session will expire in 30 seconds. Click OK to stay logged in.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleIdleModalConfirm}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </AuthContext.Provider>
  );
};