import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

export const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const [agentAccessToken, setAgentAccessToken] = useState(localStorage.getItem("agentAccessToken"));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem("agentRefreshToken"));
  
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem("agentAccessToken") ? "agent" : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("agentAccessToken");
  });

  // Agent Login
  const agentLogin = async (access, refresh) => {
    try {
      const decoded = jwtDecode(access);
      const userId = decoded.user_id;

      const response = await fetch(`http://127.0.0.1:8000/api/users/${userId}/`, {
        headers: { Authorization: `Bearer ${access}` },
      });

      const userData = await response.json();
      const userType = userData.profile?.type;

      if (!["agent", "subagent"].includes(userType)) {
        throw new Error("Unauthorized agent access");
      }

      localStorage.setItem("agentAccessToken", access);
      localStorage.setItem("agentRefreshToken", refresh);
      setAgentAccessToken(access);
      setRefreshToken(refresh);
      setUserRole("agent");
      setIsAuthenticated(true);
      navigate("/packages");
    } catch (err) {
      console.error("Agent login error", err);
      logout();
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem("agentAccessToken");
    localStorage.removeItem("agentRefreshToken");
    setAgentAccessToken(null);
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
        setShowIdleModal(false); // Hide modal before logout
        logout();
      }, 30 * 1000); // 30 seconds
    }, 10 * 60 * 1000); // 10 minutes
  };

  const handleUserAction = () => {
    if (isAuthenticated) resetIdleTimer();
  };

  const handleIdleModalConfirm = () => {
    setShowIdleModal(false);
    resetIdleTimer();
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
        agentAccessToken,
        refreshToken,
        isAuthenticated,
        userRole,
        agentLogin, // Renamed from agentLogin to just login
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