import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import cloud from "../../assets/cloud.png";
import cloud1 from "../../assets/cloud1.png";
import cloud2 from "../../assets/cloud2.png";
import logo from "../../assets/logo.png";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";

const AdminLogin = () => {
  const { adminLogin } = useAuth(); // Changed from login to adminLogin

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("https://api.saer.pk/api/token/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: email,
          password: password,
        }),
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Invalid credentials"
            : "Login failed. Please try again."
        );
      }

      const data = await response.json();
      const decoded = JSON.parse(atob(data.access.split(".")[1]));
      const userId = decoded.user_id;

      // Check user profile type
      const userResponse = await fetch(
        `https://api.saer.pk/api/users/${userId}/`,
        {
          headers: { Authorization: `Bearer ${data.access}` },
        }
      );

      const userData = await userResponse.json();
      const userType = userData?.profile?.type;

      if (["agent", "subagent"].includes(userType)) {
        throw new Error(
          "Agents and Subagents are not allowed to log in from Admin Panel."
        );
      }

      await adminLogin(data.access, data.refresh);

      setSuccess("Login successful!");
      setEmail("");
      setPassword("");
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="p-3 bg-light"
      style={{
        fontFamily: "Poppins, sans-serif",
        backgroundImage: `url(${cloud2}), url(${cloud1}), url(${cloud})`,
        backgroundSize: "cover",
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat, no-repeat, no-repeat",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div className="p-3">
          <img src={logo} alt="SAER PK Logo" style={{height:"40px", width:"150px"}} />
        </div>
        <div className="d-flex justify-content-center align-items-center">
          <div
            className="card border-0 shadow-sm"
            style={{ maxWidth: "420px", width: "100%" }}
          >
            <div className="card-body p-4">
              <h1
                className="card-title text-center mb-2"
                style={{ fontFamily: "Nunito Sans, sans-serif" }}
              >
                Welcome
              </h1>
              <h2
                className="card-title text-center mb-4"
                style={{ fontFamily: "Nunito Sans, sans-serif" }}
              >
                Login to continue
              </h2>

              <div className="mb-3 d-flex justify-content-center">
                <button className="btn btn-primary">Sign as Admin</button>
              </div>

              {error && (
                <div className="alert alert-danger text-center">{error}</div>
              )}
              {success && (
                <div className="alert alert-success text-center">{success}</div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="" className="form-label">
                      Email address
                    </label>
                    <input
                      type="email"
                      className="form-control rounded shadow-none  px-1 py-2"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="bhullar@gmail.com"
                      disabled={isLoading} // Disable during loading
                    />
                </div>

                <div className="mb-3 position-relative">
                  <label htmlFor="" className="form-label">
                  
                      Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control rounded shadow-none  px-2 py-2"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="********"
                      disabled={isLoading} // Disable during loading
                    />
                    <span
                      className="position-absolute top-50 end-0 translate-middle-y pe-3"
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        !isLoading && setShowPassword(!showPassword)
                      }
                    >
                      {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                    </span>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="rememberMe"
                      disabled={isLoading} // Disable during loading
                    />
                    <label className="form-check-label" htmlFor="rememberMe">
                      Remember me
                    </label>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-decoration-none fw-semibold"
                    style={{ color: "#1B78CE" }}
                  >
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  className="btn w-100 rounded py-2 mt-2 d-flex justify-content-center align-items-center"
                  style={{
                    background: "#1B78CE",
                    color: "white",
                    height: "45px",
                  }}
                  disabled={isLoading} // Disable during loading
                >
                  {isLoading ? (
                    <div className="d-flex align-items-center">
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Logging in...
                    </div>
                  ) : (
                    "Login"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-auto">
        <Footer />
      </div>
    </div>
  );
};

export default AdminLogin;
