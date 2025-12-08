import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import cloud from "../../assets/cloud.png";
import cloud1 from "../../assets/cloud1.png";
import cloud2 from "../../assets/cloud2.png";
import logo from "../../assets/logo.png";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";

const AgentLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const { agentLogin } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("All fields are required");
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Invalid email format");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/token/", {
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

      console.log("🔑 Login Response:", data);
      console.log("🔑 Access Token:", data.access ? "✅ Received" : "❌ Missing");
      console.log("🔑 Refresh Token:", data.refresh ? "✅ Received" : "❌ Missing");

      if (!data.access) {
        throw new Error("No access token received from backend");
      }

      // Decode token to get user_id
      const decoded = JSON.parse(atob(data.access.split(".")[1]));
      const userId = decoded.user_id;
      
      console.log("👤 User ID from token:", userId);

      // Fetch user profile using token
      console.log("📞 Fetching user profile from: /api/users/" + userId + "/");
      const userResponse = await fetch(
        `http://127.0.0.1:8000/api/users/${userId}/`,
        {
          headers: {
            Authorization: `Bearer ${data.access}`,
          },
        }
      );

      console.log("📞 User API Response Status:", userResponse.status, userResponse.statusText);

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        console.error("❌ Failed to fetch user data:", errorText);
        throw new Error(`Failed to fetch user data: ${userResponse.status}`);
      }

      const userData = await userResponse.json();
      console.log("🔍 Full User Data:", JSON.stringify(userData, null, 2));
      console.log("🔍 Organization Details:", userData?.organization_details);
      console.log("🔍 Branch Details:", userData?.branch_details);
      console.log("🔍 Agency Details:", userData?.agency_details);
      console.log("🔍 Organizations (raw):", userData?.organizations);
      console.log("🔍 All Available Keys:", Object.keys(userData));
      
      const userType = userData?.profile?.type;

      if (!["agent", "subagent"].includes(userType)) {
        throw new Error(
          "Only agents and subagents are allowed to log in here."
        );
      }

      // Extract organization IDs from organization_details
      let organizationIds = [];
      
      if (userData?.organization_details && Array.isArray(userData.organization_details)) {
        organizationIds = userData.organization_details.map(org => org.id);
        console.log("✅ Found organizations:", userData.organization_details);
        console.log("✅ Organization IDs:", organizationIds);
      }

      // Extract agency ID from agency_details
      let agencyId = null;
      if (userData?.agency_details && Array.isArray(userData.agency_details) && userData.agency_details.length > 0) {
        agencyId = userData.agency_details[0].id;
        console.log("✅ Found agency ID:", agencyId);
      }

      // Extract branch ID from branch_details
      let branchId = null;
      if (userData?.branch_details && Array.isArray(userData.branch_details) && userData.branch_details.length > 0) {
        branchId = userData.branch_details[0].id;
        console.log("✅ Found branch ID:", branchId);
      }

      if (organizationIds.length > 0) {
        const agentOrgData = { 
          ids: organizationIds,
          user_id: userId,
          agency_id: agencyId,
          branch_id: branchId
        };
        console.log("✅ Saving organization data:", agentOrgData);
        localStorage.setItem("agentOrganization", JSON.stringify(agentOrgData));
      } else {
        console.error("❌ No organization data found!");
        console.error("💡 Please ensure this agent has an organization assigned in the backend database.");
      }

      // Proceed to agent login
      await agentLogin(data.access, data.refresh);

      // Verify what's stored
      console.log("📦 localStorage after login:");
      console.log("  - agentAccessToken:", localStorage.getItem("agentAccessToken") ? "✓ Present" : "✗ Missing");
      console.log("  - agentOrganization:", localStorage.getItem("agentOrganization"));

      setSuccess("Login successful! Redirecting...");
      setTimeout(() => {
        navigate("/packages");
      }, 1000);

      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Login error details:", error);
      setError(error.message || "An error occurred during login");
    } finally {
      setLoading(false);
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
      }}
    >
      <div >
        <img src={logo} alt="" style={{height:"40px", width:"150px"}} />
      </div>
      <div className="d-flex justify-content-center align-items-center mt-5">
        <div
          className="card border-0"
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

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="" className="form-label">
                    Email address
                  </label>
                  <input
                    type="email"
                    className="form-control rounded shadow-none px-1 py-2"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="bhullar@gmail.com"
                  />
              </div>

              <div className="mb-3 position-relative">
                <label htmlFor="" className="form-label">
                    Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control rounded shadow-none px-2 py-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="********"
                  />
                  <span
                    className="position-absolute top-50 pt-4 end-0 translate-middle-y pe-3"
                    style={{ cursor: "pointer" }}
                    onClick={() => setShowPassword(!showPassword)}
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
                className="btn w-100 rounded py-2 mt-2"
                style={{ background: "#1B78CE", color: "white" }}
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
              <div className="text-center mt-3">
                <span>Not a Partner?</span>
                <Link
                  to="/register"
                  className="fw-semibold text-decoration-none ms-2"
                  style={{ color: "#1B78CE" }}
                >
                  Become Partner
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="mt-5">
        <Footer />
      </div>
    </div>
  );
};

export default AgentLogin;
