import React, { useEffect, useState } from "react";
import axios from "axios";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { jwtDecode } from "jwt-decode";

// Shimmer loader component for profile page
const ProfileShimmer = () => {
  return (
    <div className="p-4">
      <div className="text-center mt-5 mb-4">
        <div
          className="shimmer-line mx-auto mb-4"
          style={{
            height: "40px",
            width: "200px",
            borderRadius: "8px",
          }}
        ></div>
      </div>

      <div className="profile-content">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="row mb-3 align-items-center">
            <div className="col-sm-4">
              <div
                className="shimmer-line mb-2"
                style={{
                  height: "20px",
                  width: "80%",
                  borderRadius: "4px",
                }}
              ></div>
            </div>
            <div className="col-sm-8">
              <div
                className="shimmer-line"
                style={{
                  height: "38px",
                  width: "100%",
                  borderRadius: "4px",
                }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [organizationGroups, setOrganizationGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("accessToken");
        const decoded = jwtDecode(token);
        const userId = decoded.user_id || decoded.id;

        const response = await axios.get(
          `http://127.0.0.1:8000/api/users/${userId}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const profileData = response.data;
        setProfile(profileData);

        const orgs = Array.isArray(profileData.organization_details)
          ? profileData.organization_details
          : [];
        setAllOrganizations(orgs);

        const storedOrg = localStorage.getItem("selectedOrganization");
        if (storedOrg) {
          const parsed = JSON.parse(storedOrg);
          setSelectedOrganization(parsed);
        } else if (orgs.length > 0) {
          setSelectedOrganization(orgs[0]);
          localStorage.setItem("selectedOrganization", JSON.stringify(orgs[0]));
        }
      } catch (err) {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!selectedOrganization) {
        setBranches([]);
        setSelectedBranch(null);
        return;
      }
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`http://127.0.0.1:8000/api/branches/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const branchData = response.data.filter(
          (b) => b.organization === selectedOrganization.id
        );
        setBranches(branchData);

        const storedBranch = localStorage.getItem("selectedBranch");
        if (storedBranch) {
          const parsedBranch = JSON.parse(storedBranch);
          const match = branchData.find((b) => b.id === parsedBranch.id);
          if (match) {
            setSelectedBranch(match);
          } else {
            setSelectedBranch(branchData.length > 0 ? branchData[0] : null);
          }
        } else {
          setSelectedBranch(branchData.length > 0 ? branchData[0] : null);
        }
      } catch (err) {
        console.error("Failed to fetch branches", err);
        setBranches([]);
        setSelectedBranch(null);
      }
    };

    fetchBranches();
  }, [selectedOrganization]);

  useEffect(() => {
    const fetchGroups = async () => {
      if (!selectedOrganization) {
        setOrganizationGroups([]);
        return;
      }
      try {
        const token = localStorage.getItem("accessToken");
        const response = await axios.get(`http://127.0.0.1:8000/api/groups/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allGroups = response.data;
        const filteredGroups = allGroups.filter(
          (g) =>
            g.extended && g.extended.organization === selectedOrganization.id
        );
        setOrganizationGroups(filteredGroups);
      } catch (err) {
        console.error("Failed to fetch groups", err);
        setOrganizationGroups([]);
      }
    };

    fetchGroups();
  }, [selectedOrganization]);

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  const formatLabel = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  const hiddenKeys = ["id", "last_login"];

  const nestedProfile = profile?.profile || {};

  const handleOrganizationChange = (e) => {
    const selectedId = Number(e.target.value);
    const selectedOrg = allOrganizations.find((o) => o.id === selectedId);
    if (selectedOrg) {
      setSelectedOrganization(selectedOrg);
      localStorage.setItem("selectedOrganization", JSON.stringify(selectedOrg));
      setSelectedBranch(null);
      localStorage.removeItem("selectedBranch");
    }
  };

  const handleBranchChange = (e) => {
    const branchId = Number(e.target.value);
    const branch = branches.find((b) => b.id === branchId);
    setSelectedBranch(branch);
    if (branch) {
      localStorage.setItem("selectedBranch", JSON.stringify(branch));
      localStorage.setItem("selectedBranchId", branch.id); // Store just the ID
      window.dispatchEvent(new Event("branchChanged")); // Trigger event
    }
  };

  const renderEditableField = (section, key, value) => {
    if (key === "organization_details") {
      return (
        <select
          className="form-select shadow-none mb-2"
          value={selectedOrganization ? selectedOrganization.id : ""}
          onChange={handleOrganizationChange}
        >
          {allOrganizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>
      );
    }

    if (key === "branch_details") {
      return branches.length > 0 ? (
        <select
          className="form-select shadow-none"
          value={selectedBranch ? selectedBranch.id : ""}
          onChange={handleBranchChange}
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="text-muted">No branches available.</div>
      );
    }

    if (Array.isArray(value) && key === "group_details") {
      return (
        <input
          type="text"
          className="form-control"
          value={
            organizationGroups.length > 0
              ? organizationGroups.map((group) => group.name).join(", ")
              : "No groups for this organization"
          }
          readOnly
        />
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-muted">None</span>;
      return (
        <select className="form-select">
          {value.map((item, idx) => (
            <option key={idx}>{item.name || JSON.stringify(item)}</option>
          ))}
        </select>
      );
    }

    if (value && typeof value === "object") {
      return <span>{value.name || JSON.stringify(value)}</span>;
    }

    return (
      <span
        className={
          value === true
            ? "fw-bold bg-success text-white p-1 rounded"
            : value === false
              ? "bg-danger fw-bold text-white p-1 rounded"
              : ""
        }
      >
        {value === true
          ? "Active"
          : value === false
            ? "Inactive"
            : value === null || value === undefined
              ? ""
              : value}
      </span>
    );
  };

  return (
          <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>

      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          
          .shimmer-line {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 4px;
          }
        `}
      </style>

        <div className="row g-0">
          {/* Sidebar */}
          <div className="col-12 col-lg-2">
            <Sidebar />
          </div>
          {/* Main Content */}
          <div className="col-12 col-lg-10">
            <div className="container">
              <Header />
              <div className="px-3 px-lg-4 my-3">
                <div className="row d-flex justify-content-center align-items-center">
                  <div className="col-lg-8 col-md-10">
                    {loading || !profile || !selectedOrganization ? (
                      <ProfileShimmer />
                    ) : (
                      <div className="p-4">
                        <h2 className="text-center mt-5 mb-4 text-muted">
                          Profile Page
                        </h2>

                        <div className="profile-content">
                          {Object.entries(profile)
                            .filter(
                              ([key]) =>
                                !hiddenKeys.includes(key) && key !== "profile"
                            )
                            .map(([key, value]) => (
                              <div key={key} className="row mb-3 align-items-center">
                                <div className="col-sm-4">
                                  <strong className="text-dark">
                                    {formatLabel(key)}:
                                  </strong>
                                </div>
                                <div className="col-sm-8">
                                  {renderEditableField("main", key, value)}
                                </div>
                              </div>
                            ))}

                          {Object.keys(nestedProfile).length > 0 && (
                            <>
                              {Object.entries(nestedProfile).map(([key, value]) => (
                                <div
                                  key={key}
                                  className="row mb-3 align-items-center"
                                >
                                  <div className="col-sm-4">
                                    <strong className="text-dark">
                                      {formatLabel(key)}:
                                    </strong>
                                  </div>
                                  <div className="col-sm-8">
                                    {renderEditableField("nested", key, value)}
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ProfilePage;
