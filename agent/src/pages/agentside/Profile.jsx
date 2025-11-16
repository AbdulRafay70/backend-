import React, { useEffect, useState } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { toast, ToastContainer } from "react-toastify";

const ProfileShimmer = () => {
  return (
    <div className=" rounded-4 p-3 mb-3 mt-5">
      <div className="row justify-content-center mb-5">
        <div className="col-md-8">
          <div className="card-body">
            <div className="text-center mt-5 mb-4">
              <div
                className="shimmer-line mx-auto mb-4"
                style={{
                  height: "40px",
                  width: "200px",
                  borderRadius: "8px",
                  backgroundColor: "#f0f0f0",
                }}
              ></div>
            </div>

            <div className="profile-content">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="row mb-3 align-items-center">
                  <div className="col-md-4">
                    <div
                      className="shimmer-line mb-2"
                      style={{
                        height: "20px",
                        width: "80%",
                        borderRadius: "4px",
                        backgroundColor: "#f0f0f0",
                      }}
                    ></div>
                  </div>
                  <div className="col-md-8">
                    <div
                      className="shimmer-line"
                      style={{
                        height: "38px",
                        width: "100%",
                        borderRadius: "4px",
                        backgroundColor: "#f0f0f0",
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Profile = () => {
  const [profileData, setProfileData] = useState({
    travelAgencyName: "",
    agentName: "",
    email: "",
    contactNo: "",
    address: "",
    branch: 0,
    logo: null,
  });

  const [flightIssueData, setFlightIssueData] = useState({
    daysBeforeIssue: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [agencyId, setAgencyId] = useState(null);

  const getOrgId = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;
    const orgData = JSON.parse(agentOrg);
    return orgData.ids[0];
  };
  const orgId = getOrgId();

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("agentAccessToken");
        const decoded = jwtDecode(token);
        const userId = decoded.user_id || decoded.id;
        localStorage.setItem("userId", JSON.stringify(userId));
        // Step 1: Get current user
        const userRes = await axios.get(
          `http://127.0.0.1:8000/api/users/${userId}/?organization=${orgId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const userData = userRes.data;

        // Step 2: Get agency ID from user
        const agency = userData.agency_details?.[0];
        if (!agency) {
          throw new Error("No agency associated with this user.");
        }

        const agencyId = agency.id;
        setAgencyId(agencyId);

        // Step 3: Get agency details
        const agencyRes = await axios.get(
          `http://127.0.0.1:8000/api/agencies/${agencyId}/?organization=${orgId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const agencyData = agencyRes.data;
        // localStorage.setItem("agencyId", JSON.stringify(agencyData));
        localStorage.setItem("agencyId", String(agencyData.id));
        localStorage.setItem("agencyName", String(agencyData.ageny_name));
        // console.log(agency.id)
        // console.log(agencyData.ageny_name)
        if (agencyData.branch) {
          localStorage.setItem("branchId", String(agencyData.branch));
          // console.log(agencyData.branch);
        }

        // Step 4: Set profile data
        setProfileData({
          travelAgencyName: agencyData.ageny_name || "",
          agentName: agencyData.name || "",
          email: agencyData.email || "",
          contactNo: agencyData.phone_number || "",
          address: agencyData.address || "",
          branch: agencyData.branch,
          logo:
            agencyData.files && agencyData.files.length > 0
              ? agencyData.files[0].file
              : null,
        });

        // If contacts exist, overwrite agent fields
        if (agencyData.contacts && agencyData.contacts.length > 0) {
          const contact = agencyData.contacts[0];
          setProfileData((prev) => ({
            ...prev,
            contactNo: contact.phone_number || prev.contactNo,
            email: contact.email || prev.email,
            agentName: contact.name || prev.agentName,
          }));
        }

        setLoading(false);
      } catch (err) {
        setError("Failed to fetch profile data");
        setLoading(false);
        console.error("Error fetching profile data:", err);
      }
    };

    fetchProfileData();
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFlightIssueChange = (e) => {
    setFlightIssueData({
      daysBeforeIssue: e.target.value,
    });
  };

  const handleProfileSave = async () => {
    const { travelAgencyName, agentName, email } = profileData;
    if (!travelAgencyName || !agentName || !email) {
      toast.error("Please fill in all required fields.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    const token = localStorage.getItem("agentAccessToken");

    try {
      const payload = {
        name: agentName,
        ageny_name: travelAgencyName,
        email: email,
        phone_number: profileData.contactNo,
        address: profileData.address,
        branch: profileData.branch,
        organization: orgId,
      };

      const response = await axios.put(
        `http://127.0.0.1:8000/api/agencies/${agencyId}/?organization=${orgId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Profile saved successfully!", {
        position: "top-center",
        autoClose: 3000,
      });
      console.log("Profile data saved:", response.data);
    } catch (err) {
      console.error("Error saving profile:", err);
      toast.error("Failed to save profile. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const handleFlightIssueSave = () => {
    if (!flightIssueData.daysBeforeIssue) {
      toast.error("Please enter how many days before to issue ticket.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    console.log("Flight issue data saved:", flightIssueData);
    toast.success("Flight issue settings saved successfully!", {
      position: "top-center",
      autoClose: 3000,
    });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const token = localStorage.getItem("agentAccessToken");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("file_type", "logo");
      formData.append("description", "Agency logo");

      const response = await axios.post(
        `http://127.0.0.1:8000/api/agencies/${agencyId}/files/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          },
        }
      );

      setProfileData((prev) => ({
        ...prev,
        logo: response.data.file,
      }));

      toast.success("Logo uploaded successfully!", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (err) {
      console.error("Error uploading logo:", err);
      toast.error("Failed to upload logo. Please try again.", {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="row g-0">
          {/* Sidebar */}
          <div className="col-12 col-lg-2">
            <AgentSidebar />
          </div>
          {/* Main Content */}
          <div className="col-12 col-lg-10">
            <div className="container">
              <AgentHeader />
              <ProfileShimmer />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="row">
          <div className="col-lg-2">
            <AgentSidebar />
          </div>
          <div className="col-lg-10">
            <div className="container">
              <AgentHeader />
              <div className="text-center py-5 text-danger">{error}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <AgentSidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10">
          <div className="container">
            <AgentHeader />
            <div className="px-3 mt-3 px-lg-4">
              {/* Profile Section */}
              <div className="row justify-content-center mb-5">
                <div className="col-md-8">
                  <div className="">
                    <div className="card-body">
                      <h2 className="text-center mb-4 mt-5">Profile Page</h2>

                      <div className="row mb-3">
                        <div className="col-md-4">
                          <label htmlFor="" className="">
                            Travel Agency Name
                          </label>
                          <input
                            type="text"
                            name="travelAgencyName"
                            value={profileData.travelAgencyName}
                            onChange={handleProfileChange}
                            className="form-control rounded shadow-none px-1 py-2"
                            placeholder="Type"
                          />
                        </div>
                        <div className="col-md-4">
                          <label htmlFor="" className="">
                            Agent Name
                          </label>
                          <input
                            type="text"
                            name="agentName"
                            value={profileData.agentName}
                            onChange={handleProfileChange}
                            className="form-control rounded shadow-none px-1 py-2"
                            placeholder="Type"
                          />
                        </div>
                        <div className="col-md-4">
                          <label htmlFor="" className="">
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            value={profileData.email}
                            onChange={handleProfileChange}
                            className="form-control rounded shadow-none px-1 py-2"
                            placeholder="Type"
                          />
                        </div>
                      </div>

                      <div className="row mb-4">
                        <div className="col-md-4">
                          <label htmlFor="" className="">
                            Contact No.
                          </label>
                          <input
                            type="text"
                            name="contactNo"
                            value={profileData.contactNo}
                            onChange={handleProfileChange}
                            className="form-control rounded shadow-none px-1 py-2"
                            placeholder="Type"
                          />
                        </div>
                        <div className="col-md-4">
                          <label htmlFor="" className="">
                            Address
                          </label>
                          <input
                            type="text"
                            name="address"
                            value={profileData.address}
                            onChange={handleProfileChange}
                            className="form-control rounded shadow-none px-1 py-2"
                            placeholder="Type"
                          />
                        </div>
                        <div className="col-md-4 d-flex align-items-end">
                          <div className="w-100">
                            <input
                              type="file"
                              className="d-none"
                              id="logoUpload"
                              accept="image/*"
                              onChange={handleLogoUpload}
                            />
                            <label
                              htmlFor="logoUpload"
                              className="btn btn-primary w-100"
                            >
                              Upload Logo
                            </label>
                            {profileData.logo && (
                              <div className="mt-2 text-center">
                                <img
                                  src={
                                    typeof profileData.logo === "string"
                                      ? `http://127.0.0.1:8000/${profileData.logo}`
                                      : URL.createObjectURL(profileData.logo)
                                  }
                                  alt="Logo Preview"
                                  className="img-thumbnail"
                                  style={{ maxHeight: "100px" }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-center">
                        <button
                          id="btn" className="btn px-4"
                          onClick={handleProfileSave}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Umrah Flight Issue Section */}
              <div className="row justify-content-center">
                <div className="col-md-6">
                  <div className="">
                    <div className="card-body">
                      <h2 className="text-center mb-4">Umrah Flight Issue</h2>
                      <div className="text-center mb-4">
                        <p className="text-muted mb-3">
                          How many days before to issue ticket immediately?
                        </p>

                        <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
                          <input
                            type="number"
                            className="form-control text-center"
                            style={{ width: "150px" }}
                            value={flightIssueData.daysBeforeIssue}
                            onChange={handleFlightIssueChange}
                            placeholder="Type in days"
                          />
                          <button
                            id="btn" className="btn"
                            onClick={handleFlightIssueSave}
                          >
                            Save
                          </button>
                        </div>

                        <div className="text-center">
                          <p className="text-muted small mb-0">
                            1. If travel date is{" "}
                            <span className="text-danger fw-bold">
                              {flightIssueData.daysBeforeIssue === ""
                                ? "12"
                                : flightIssueData.daysBeforeIssue}{" "}
                              days ago
                            </span>{" "}
                            then issue ticket immediately.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
