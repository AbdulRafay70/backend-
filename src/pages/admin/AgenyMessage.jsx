import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import {
  Link,
  NavLink,
  useParams,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowBigLeft,
  UploadCloudIcon,
  Edit,
  Trash2,
  Plus,
} from "lucide-react";
import {
  Dropdown,
  Table,
  Button,
  Form,
  Modal,
  Spinner,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import document from "../../assets/document.jpg";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const ShimmerLoader = ({ count = 1 }) => {
  return (
    <div className="shimmer-container">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="shimmer-line mb-3">
          <div className="shimmer-animation"></div>
        </div>
      ))}
    </div>
  );
};

const AgencyDetails = () => {

  const getOrgId = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;
    const orgData = JSON.parse(agentOrg);
    return orgData.ids[0];
  };
  const orgId = getOrgId();

  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [showModalSub, setShowModalSub] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [agencyData, setAgencyData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subAgents, setSubAgents] = useState([]);
  const [mainAgents, setMainAgents] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allGroups, setAllGroups] = useState([]);
  const [selectedSubAgent, setSelectedSubAgent] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingContact, setEditingContact] = useState(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [fileForm, setFileForm] = useState({
    file_type: "",
    description: "",
  });
  const [contactForm, setContactForm] = useState({
    name: "",
    phone_number: "",
    email: "",
    remarks: "",
  });

  const [showContentModal, setShowContentModal] = useState(false);

  const [contentForm, setContentForm] = useState({
    contacts: [
      {
        name: "",
        phone_number: "",
        email: "",
        remarks: "",
      },
    ],
  });

  // Handle content form changes
  const handleContentChange = (e, index) => {
    const { name, value } = e.target;
    const updatedContacts = [...contentForm.contacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [name]: value,
    };
    setContentForm({
      contacts: updatedContacts,
    });
  };

  // Add new contact
  const addNewContact = () => {
    setContentForm((prev) => ({
      contacts: [
        ...prev.contacts,
        { name: "", phone_number: "", email: "", remarks: "" },
      ],
    }));
  };

  // Remove contact
  const removeContact = (index) => {
    const updatedContacts = [...contentForm.contacts];
    updatedContacts.splice(index, 1);
    setContentForm({
      contacts: updatedContacts,
    });
  };

  // Handle content form submission
  const handleContentSubmit = async () => {
    setIsSubmitting(true);
    try {
      await axios.patch(
        `http://127.0.0.1:8000/api/agencies/${currentAgencyId}/?organization=${orgId}`,
        { contacts: contentForm.contacts },
        axiosConfig
      );

      localStorage.removeItem(AGENCIES_CACHE_KEY);
      localStorage.removeItem(`${AGENCIES_CACHE_KEY}_timestamp`);
      setRefreshTrigger((prev) => prev + 1);
      setShowContentModal(false);
    } catch (error) {
      console.error("Error saving content:", error);
      alert(
        `Error: ${error.response?.data?.detail ||
        JSON.stringify(error.response?.data) ||
        error.message
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const accessToken = localStorage.getItem("accessToken");
  const axiosConfig = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  };

  // Sub-agent form state
  const [subAgentForm, setSubAgentForm] = useState({
    name: "",
    email: "",
    password: "",
    permissions: "",
    is_active: false,
  });

  // Reset states when agency ID changes
  useEffect(() => {
    setAgencyData(null);
    setSubAgents([]);
    setMainAgents([]);
    setAllGroups([]);
    setIsLoading(true);
  }, [id]);

  // Fetch all data when ID or location changes
  useEffect(() => {
    if (id) {
      const fetchData = async () => {
        try {
          await Promise.all([
            fetchAgencyData(),
            fetchMainAgents(),
            fetchSubAgents(),
            fetchGroups(),
          ]);
        } catch (error) {
          console.error("Error fetching data:", error);
          setError("Failed to fetch agency data");
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }
  }, [id, location.state]);

  // Fetch agency data
  const fetchAgencyData = async () => {
    try {
      let agencyDataResponse;
      if (location.state?.agencyData) {
        agencyDataResponse = location.state.agencyData;
        setAgencyData(agencyDataResponse);
      } else {
        const response = await axios.get(
          `http://127.0.0.1:8000/api/agencies/${id}/?organization=${orgId}`,
          axiosConfig
        );
        agencyDataResponse = response.data;
        setAgencyData(response.data);
      }
      return agencyDataResponse;
    } catch (error) {
      console.error("Error fetching agency data:", error);
      throw error;
    }
  };

  // Fetch all main agents for this agency
  const fetchMainAgents = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/users/`,
        {
          ...axiosConfig,
          params: {
            agency_details: id,  // API filter
            organization: orgId,
          },
        }
      );

      const agents = response.data.filter(
        (user) =>
          user.profile?.type?.toLowerCase() === "agent" &&
          Array.isArray(user.agency_details) &&
          user.agency_details.some((agency) => String(agency.id) === String(id))
      );

      setMainAgents(agents);
      return agents;
    } catch (error) {
      console.error("Error fetching agents:", error);
      throw error;
    }
  };

  const fetchSubAgents = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/users/`,
        {
          ...axiosConfig,
          params: {
            agency_details: id,
            organization: orgId,
          },
        }
      );

      const subAgents = response.data.filter(
        (user) =>
          user.profile?.type?.toLowerCase() === "subagent" &&
          Array.isArray(user.agency_details) &&
          user.agency_details.some((agency) => String(agency.id) === String(id))
      );

      setSubAgents(subAgents);
      return subAgents;
    } catch (error) {
      console.error("Error fetching sub-agents:", error);
      throw error;
    }
  };



  // Fetch all groups
  const fetchGroups = async () => {
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/api/groups/?organization=${orgId}`,
        axiosConfig
      );

      const agentGroups = response.data.filter(
        (group) => group.extended?.type === "agents"
      );

      setAllGroups(agentGroups);
      return agentGroups;
    } catch (error) {
      console.error("Failed to fetch groups", error);
      throw error;
    }
  };

  // File upload handling
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("files[0].file", selectedFile);
      formData.append("files[0].file_type", fileForm.file_type);
      formData.append("files[0].description", fileForm.description);

      if (agencyData.files?.length > 0) {
        agencyData.files.forEach((file, index) => {
          formData.append(`files[${index}].file`, file.file);
          formData.append(`files[${index}].file_type`, file.file_type);
          formData.append(`files[${index}].description`, file.description);
        });
      }

      const response = await axios.patch(
        `http://127.0.0.1:8000/api/agencies/${id}/?organization=${orgId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      setAgencyData(response.data);
      setSuccess("File uploaded successfully!");
      setShowFileModal(false);
      setSelectedFile(null);
      setFilePreview("");
      setFileForm({
        file_type: "",
        description: "",
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      setError(
        error.response?.data?.files?.[0]?.file?.[0] ||
        error.response?.data?.detail ||
        "Failed to upload file"
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteFile = async (fileIndex) => {
    try {
      setIsUploading(true);
      const updatedFiles = [...agencyData.files];
      updatedFiles.splice(fileIndex, 1);

      const response = await axios.patch(
        `http://127.0.0.1:8000/api/agencies/${id}/?organization=${orgId}`,
        {
          files: updatedFiles,
        },
        axiosConfig
      );

      setAgencyData(response.data);
      setSuccess("File deleted successfully!");
    } catch (error) {
      console.error("Error deleting file:", error);
      setError("Failed to delete file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddContact = async () => {
    try {
      setIsSubmitting(true);
      const newContact = {
        name: contactForm.name,
        phone_number: contactForm.phone_number,
        email: contactForm.email,
        remarks: contactForm.remarks,
      };

      const response = await axios.patch(
        `http://127.0.0.1:8000/api/agencies/${id}/?organization=${orgId}`,
        {
          contacts: [...(agencyData.contacts || []), newContact],
        },
        axiosConfig
      );

      setAgencyData(response.data);
      setSuccess("Contact added successfully!");
      setShowContactModal(false);
      setContactForm({
        name: "",
        phone_number: "",
        email: "",
        remarks: "",
      });
    } catch (error) {
      console.error("Error adding contact:", error);
      setError("Failed to add contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactIndex) => {
    try {
      setIsSubmitting(true);
      const updatedContacts = [...agencyData.contacts];
      updatedContacts.splice(contactIndex, 1);

      const response = await axios.patch(
        `http://127.0.0.1:8000/api/agencies/${id}/?organization=${orgId}`,
        {
          contacts: updatedContacts,
        },
        axiosConfig
      );

      setAgencyData(response.data);
      setSuccess("Contact deleted successfully!");
    } catch (error) {
      console.error("Error deleting contact:", error);
      setError("Failed to delete contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sub-agent form handlers
  const handleShowSub = () => setShowModalSub(true);

  const handleCloseSub = () => {
    setShowModalSub(false);
    setSelectedSubAgent(null);
    setSubAgentForm({
      name: "",
      email: "",
      password: "",
      permissions: "",
    });
    setError(null);
    setSuccess(null);
  };

  const handleSubAgentChange = (e) => {
    const { name, value } = e.target;
    setSubAgentForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Edit sub-agent
  const handleEditSubAgent = (subAgent) => {
    setSelectedSubAgent(subAgent);
    setSubAgentForm({
      name: subAgent.first_name,
      email: subAgent.email,
      password: "",
      permissions: subAgent.group_details?.[0]?.id || "", 
      is_active: subAgent.is_active, 
    });
    setShowModalSub(true);
  };

  // // Delete sub-agent confirmation
  // const handleDeleteConfirmation = (subAgent) => {
  //   setSelectedSubAgent(subAgent);
  //   setShowDeleteModal(true);
  // };

  // // Delete sub-agent
  // const handleDeleteSubAgent = async () => {
  //   try {
  //     setIsSubmitting(true);
  //     await axios.delete(
  //       `http://127.0.0.1:8000/api/users/${selectedSubAgent.id}/?organization=${orgId}`,
  //       axiosConfig
  //     );
  //     setSuccess("Sub-agent deleted successfully");
  //     fetchSubAgents(); // Refresh the sub-agents list
  //   } catch (error) {
  //     console.error("Error deleting sub-agent:", error);
  //     setError("Failed to delete sub-agent");
  //   } finally {
  //     setIsSubmitting(false);
  //     setShowDeleteModal(false);
  //     setSelectedSubAgent(null);
  //   }
  // };

  // Save/Update sub-agent
  const handleSubAgentSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      if (!subAgentForm.name || !subAgentForm.email) {
        setError("Please fill all required fields");
        return;
      }

      if (!selectedSubAgent && !subAgentForm.password) {
        setError("Password is required for new sub-agent");
        return;
      }

      // Get the first main agent associated with this agency
      const mainAgent = mainAgents.length > 0 ? mainAgents[0] : null;

      if (selectedSubAgent) {
        // Update existing sub-agent
        const updateData = {
          first_name: subAgentForm.name,
          email: subAgentForm.email,
          profile: {
            type: "subagent",
            agency: id,
          },
          groups: [subAgentForm.permissions],
          is_active: subAgentForm.is_active,
        };

        if (subAgentForm.password) {
          updateData.password = subAgentForm.password;
        }

        await axios.patch(
          `http://127.0.0.1:8000/api/users/${selectedSubAgent.id}/?organization=${orgId}`,
          updateData,
          axiosConfig
        );
        setSuccess("Sub-agent updated successfully");
      } else {
        // Create new sub-agent
        const subAgentData = {
          first_name: subAgentForm.name,
          email: subAgentForm.email,
          username: subAgentForm.email,
          password: subAgentForm.password,
          is_active: subAgentForm.active,
          profile: {
            type: "subagent",
            agency: id,
            agreement_status: false,
          },
          groups: [subAgentForm.permissions],
        };

        // If there's a main agent, inherit their organizations and branches
        if (mainAgent) {
          // Fetch full details of the main agent to get organizations and branches
          const mainAgentDetails = await axios.get(
            `http://127.0.0.1:8000/api/users/${mainAgent.id}/?organization=${orgId}`,
            axiosConfig
          );

          subAgentData.organizations =
            mainAgentDetails.data.organization_details?.map((org) => org.id) ||
            [];
          subAgentData.branches =
            mainAgentDetails.data.branch_details?.map((branch) => branch.id) ||
            [];
          subAgentData.agencies =
            mainAgentDetails.data.agency_details?.map((agency) => agency.id) ||
            [];

          // Ensure this agency is included
          if (!subAgentData.agencies.includes(parseInt(id))) {
            subAgentData.agencies.push(parseInt(id));
          }
        } else {
          // If no main agent, just assign to this agency
          subAgentData.agencies = [parseInt(id)];
        }

        await axios.post(
          `http://127.0.0.1:8000/api/users/?organization=${orgId}`,
          subAgentData,
          axiosConfig
        );
        setSuccess("Sub-agent created successfully");
      }

      fetchSubAgents(); // Refresh the sub-agents list
      handleCloseSub(); // Close the modal
    } catch (error) {
      console.error("Error in sub-agent operation:", error);
      setError(
        error.response?.data?.detail ||
        Object.values(error.response?.data).flat().join(", ") ||
        "Failed to perform operation"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add to your existing state
  const [selectedMainAgent, setSelectedMainAgent] = useState(null);
  const [showMainAgentModal, setShowMainAgentModal] = useState(false);
  const [mainAgentForm, setMainAgentForm] = useState({
    name: "",
    email: "",
    password: "",
    is_active: false,
  });

  // Add these handler functions
  const handleEditMainAgent = (agent) => {
    setSelectedMainAgent(agent);
    setMainAgentForm({
      name: agent.first_name,
      email: agent.email,
      password: "",
      is_active: agent.is_active,
    });
    setShowMainAgentModal(true);
  };

  const handleMainAgentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMainAgentForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleMainAgentSubmit = async () => {
    try {
      setIsSubmitting(true);

      const updateData = {
        first_name: mainAgentForm.name,
        email: mainAgentForm.email,
        is_active: mainAgentForm.is_active,
      };

      if (mainAgentForm.password) {
        updateData.password = mainAgentForm.password;
      }

      await axios.patch(
        `http://127.0.0.1:8000/api/users/${selectedMainAgent.id}/?organization=${orgId}`,
        updateData,
        axiosConfig
      );

      setSuccess("Main agent updated successfully");
      fetchMainAgents(); // Refresh the list
      setShowMainAgentModal(false);
    } catch (error) {
      console.error("Error updating main agent:", error);
      setError(
        error.response?.data?.detail ||
        "Failed to update main agent. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update the delete confirmation handler
  const handleDeleteConfirmation = (agent, type) => {
    if (type === 'main') {
      setSelectedMainAgent(agent);
    } else {
      setSelectedSubAgent(agent);
    }
    setShowDeleteModal(true);
    setDeleteType(type); // Add this state: const [deleteType, setDeleteType] = useState('');
  };

  // Update the delete handler
  const handleDeleteSubAgent = async () => {
    try {
      setIsSubmitting(true);
      const agentId = deleteType === 'main' ? selectedMainAgent.id : selectedSubAgent.id;

      await axios.delete(
        `http://127.0.0.1:8000/api/users/${agentId}/?organization=${orgId}`,
        axiosConfig
      );

      setSuccess(`${deleteType === 'main' ? 'Main agent' : 'Sub-agent'} deleted successfully`);

      if (deleteType === 'main') {
        fetchMainAgents();
      } else {
        fetchSubAgents();
      }
    } catch (error) {
      console.error("Error deleting agent:", error);
      setError("Failed to delete agent");
    } finally {
      setIsSubmitting(false);
      setShowDeleteModal(false);
      setSelectedMainAgent(null);
      setSelectedSubAgent(null);
    }
  };

  const [deleteType, setDeleteType] = useState('');


  const tabs = [
    { name: "All Partners", path: "/partners" },
    { name: "Request", path: "/partners/request" },
    { name: "Group And Permissions", path: "/partners/role-permissions" },
    { name: "Discounts", path: "/partners/discounts" },
    { name: "Organizations", path: "/partners/organization" },
    { name: "Branches", path: "/partners/branche" },
    { name: "Agencies", path: "/partners/agencies" },
  ];
  if (isLoading) {
    return (
      <div className="container-fluid" style={{ fontFamily: "Poppins, sans-serif" }}>
        <div className="row">
          <div className="col-lg-2 mb-3">
            <Sidebar />
          </div>
          <div className="col-lg-10">
            <div className="container">
              {/* Header Shimmer */}
              <div className="shimmer-line" style={{ height: "60px", marginBottom: "20px" }}></div>

              {/* Tabs Shimmer */}
              <div className="d-flex gap-3 mb-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="shimmer-line" style={{ width: "100px", height: "30px" }}></div>
                ))}
              </div>

              {/* Agency Details Shimmer */}
              <div className="p-3 bg-white rounded-3">
                <div className="shimmer-line" style={{ width: "150px", height: "20px", marginBottom: "30px" }}></div>

                <div className="d-flex flex-wrap mt-2 gap-3 mb-5">
                  {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div key={item} className="flex-grow-1">
                      <div className="shimmer-line" style={{ width: "100px", height: "15px", marginBottom: "5px" }}></div>
                      <div className="shimmer-line" style={{ width: "150px", height: "20px" }}></div>
                    </div>
                  ))}
                </div>

                {/* Main Agents Shimmer */}
                <div className="mb-5">
                  <div className="shimmer-line" style={{ width: "150px", height: "20px", marginBottom: "20px" }}></div>
                  <div className="shimmer-table-row">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="shimmer-table-cell"></div>
                    ))}
                  </div>
                  <ShimmerLoader count={3} />
                </div>

                {/* Sub-Agents Shimmer */}
                <div className="mb-5">
                  <div className="d-flex justify-content-between mb-3">
                    <div className="shimmer-line" style={{ width: "150px", height: "20px" }}></div>
                    <div className="shimmer-line" style={{ width: "150px", height: "40px" }}></div>
                  </div>
                  <div className="shimmer-table-row">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div key={item} className="shimmer-table-cell"></div>
                    ))}
                  </div>
                  <ShimmerLoader count={5} />
                </div>

                {/* Contacts Shimmer */}
                <div className="mb-5">
                  <div className="d-flex justify-content-between mb-3">
                    <div className="shimmer-line" style={{ width: "150px", height: "20px" }}></div>
                    <div className="shimmer-line" style={{ width: "150px", height: "40px" }}></div>
                  </div>
                  <div className="shimmer-table-row">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <div key={item} className="shimmer-table-cell"></div>
                    ))}
                  </div>
                  <ShimmerLoader count={5} />
                </div>

                {/* Files Shimmer */}
                <div className="mb-5">
                  <div className="d-flex justify-content-between mb-3">
                    <div className="shimmer-line" style={{ width: "150px", height: "20px" }}></div>
                    <div className="shimmer-line" style={{ width: "150px", height: "40px" }}></div>
                  </div>
                  <div className="row">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="col-md-4 mb-4">
                        <div className="shimmer-card"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!agencyData) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <p>Agency not found</p>
          <Link to="/partners/agencies" className="btn btn-primary">
            Back to Agencies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>
        {`
    @keyframes shimmer {
      0% { background-position: -468px 0 }
      100% { background-position: 468px 0 }
    }
    
    .shimmer-container {
      width: 100%;
    }
    
    .shimmer-line {
      height: 20px;
      background: #f6f7f8;
      background-image: linear-gradient(
        to right,
        #f6f7f8 0%,
        #edeef1 20%,
        #f6f7f8 40%,
        #f6f7f8 100%
      );
      background-size: 800px 104px;
      animation: shimmer 1.5s infinite linear;
      border-radius: 4px;
      margin-bottom: 10px;
    }
    
    /* Specific shimmer styles for different sections */
    .shimmer-card {
      height: 150px;
      background: #f6f7f8;
      background-image: linear-gradient(
        to right,
        #f6f7f8 0%,
        #edeef1 20%,
        #f6f7f8 40%,
        #f6f7f8 100%
      );
      background-size: 800px 104px;
      animation: shimmer 1.5s infinite linear;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    
    .shimmer-table-row {
      display: flex;
      margin-bottom: 10px;
    }
    
    .shimmer-table-cell {
      height: 40px;
      flex: 1;
      margin-right: 10px;
      background: #f6f7f8;
      background-image: linear-gradient(
        to right,
        #f6f7f8 0%,
        #edeef1 20%,
        #f6f7f8 40%,
        #f6f7f8 100%
      );
      background-size: 800px 104px;
      animation: shimmer 1.5s infinite linear;
      border-radius: 4px;
    }
    
    .shimmer-table-cell:last-child {
      margin-right: 0;
    }
  `}
      </style>
              <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>

        {/* Add this near the top of your main component JSX */}
        {error && (
          <Alert
            variant="danger"
            onClose={() => setError(null)}
            dismissible
            className="mt-3"
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            variant="success"
            onClose={() => setSuccess(null)}
            dismissible
            className="mt-3"
          >
            {success}
          </Alert>
        )}
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
              {/* Navigation Tabs */}
              <div className="row ">
                <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
                  <nav className="nav flex-wrap gap-2">
                    {tabs.map((tab, index) => (
                      <NavLink
                        key={index}
                        to={tab.path}
                        className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Agencies"
                          ? "text-primary fw-semibold"
                          : "text-muted"
                          }`}
                        style={{ backgroundColor: "transparent" }}
                      >
                        {tab.name}
                      </NavLink>
                    ))}
                  </nav>
                </div>
                <div className="p-3 border rounded-4">
                  <div>
                    <div className="d-flex align-items-center mb-4">
                      <Link
                        to="/partners/agencies"
                        style={{ cursor: "pointer" }}
                        className="me-2"
                      >
                        <ArrowBigLeft />
                      </Link>
                    </div>


                    <h6 className="fw-bold">Agency Detail</h6>
                    <div className="d-flex flex-wrap mt-2 gap-3">
                      <div className="flex-grow-1">
                        <h6>Agency Name:</h6>
                        <div>{agencyData.ageny_name || "N/A"}</div>
                      </div>
                      <div className="flex-grow-1">
                        <h6>Contact:</h6>
                        <div>{agencyData.phone_number || "N/A"}</div>
                      </div>
                      <div className="flex-grow-1">
                        <h6>Email</h6>
                        <div>{agencyData.email || "N/A"}</div>
                      </div>
                      <div className="flex-grow-1">
                        <h6>Address</h6>
                        <div>{agencyData.address || "N/A"}</div>
                      </div>
                      <div className="flex-grow-1">
                        <h6>Branch</h6>
                        <div>{agencyData.branch_name || "N/A"}</div>
                      </div>
                      <div className="flex-grow-1">
                        <h6>Agreement Status</h6>
                        <div
                          className={`fw-bold ${agencyData.agreement_status
                            ? "text-success"
                            : "text-danger"
                            }`}
                        >
                          {agencyData.agreement_status ? "Active" : "Inactive"}
                        </div>
                      </div>
                    </div>

                    {/* Agents Section */}
                    <div className="mt-5">
                      <h6 className="fw-bold">Main Agents</h6>
                      {mainAgents.length > 0 ? (
                        <Table striped bordered hover className="mt-3">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mainAgents.map((agent) => (
                              <tr key={`agent-${agent.id}-${id}`}>
                                <td>{agent.first_name || "N/A"}</td>
                                <td>{agent.email || "N/A"}</td>
                                <td>
                                  <span
                                    className={`badge ${agent.is_active
                                      ? "bg-success"
                                      : "bg-secondary"
                                      }`}
                                  >
                                    {agent.is_active ? "Active" : "Inactive"}
                                  </span>
                                </td>
                                <td>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => handleEditMainAgent(agent)}
                                  >
                                    <Edit size={16} className="me-1" /> Edit
                                  </Button>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="text-danger"
                                    onClick={() => handleDeleteConfirmation(agent, 'main')}
                                  >
                                    <Trash2 size={16} className="me-1" /> Delete
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <div className="text-muted mt-3">
                          No main agents found for this agency
                        </div>
                      )}
                    </div>

                    <div className="mt-5">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold">Sub-Agents</h6>
                        <Button variant="primary" onClick={handleShowSub}>
                          Add Sub-Agent
                        </Button>
                      </div>

                      {subAgents.length > 0 ? (
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Email</th>
                              <th>Type</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subAgents.map((subAgent) => (
                              <tr key={`subagent-${subAgent.id}-${id}`}>
                                <td>{subAgent.first_name || "N/A"}</td>
                                <td>{subAgent.email || "N/A"}</td>
                                <td>{subAgent.profile?.type || "N/A"}</td>
                                <td>
                                  <span
                                    className={`badge ${subAgent.is_active
                                      ? "bg-success"
                                      : "bg-secondary"
                                      }`}
                                  >
                                    {subAgent.is_active ? "Active" : "Inactive"}
                                  </span>
                                </td>
                                <td>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => handleEditSubAgent(subAgent)}
                                  >
                                    <Edit size={16} className="me-1" /> Edit
                                  </Button>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="text-danger"
                                    onClick={() =>
                                      handleDeleteConfirmation(subAgent)
                                    }
                                  >
                                    <Trash2 size={16} className="me-1" /> Delete
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <div className="text-muted mt-3">No sub-agents found</div>
                      )}
                    </div>

                    {/* Contacts Section */}
                    <div className="mt-5">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold">Contacts</h6>
                        <Button
                          variant="primary"
                          onClick={() => {
                            // Initialize the content form with existing contacts
                            setContentForm({
                              contacts: agencyData.contacts || [],
                            });
                            setShowContactModal(true);
                          }}
                        >
                          Add Contact
                        </Button>
                      </div>

                      {agencyData.contacts?.length > 0 ? (
                        <Table striped bordered hover>
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Phone</th>
                              <th>Email</th>
                              <th>Remarks</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {agencyData.contacts.map((contact, index) => (
                              <tr key={`contact-${index}-${id}`}>
                                <td>{contact.name || "N/A"}</td>
                                <td>{contact.phone_number || "N/A"}</td>
                                <td>{contact.email || "N/A"}</td>
                                <td>{contact.remarks || "N/A"}</td>
                                <td>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => {
                                      setEditingContact(index);
                                      setContactForm({
                                        name: contact.name,
                                        phone_number: contact.phone_number,
                                        email: contact.email,
                                        remarks: contact.remarks,
                                      });
                                      setShowContactModal(true);
                                    }}
                                  >
                                    <Edit size={16} className="me-1" /> Edit
                                  </Button>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="text-danger"
                                    onClick={() => handleDeleteContact(index)}
                                  >
                                    <Trash2 size={16} className="me-1" /> Delete
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      ) : (
                        <div className="text-muted mt-3">No contacts added</div>
                      )}
                    </div>

                    {/* Agreement Documents */}
                    <div className="mt-5">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h6 className="fw-bold">Files</h6>
                        <Button
                          variant="primary"
                          onClick={() => setShowFileModal(true)}
                        >
                          <Plus size={16} className="me-1" /> Add File
                        </Button>
                      </div>

                      <Row>
                        {agencyData.files?.length > 0 ? (
                          agencyData.files.map((file, index) => (
                            <Col
                              key={`file-${index}-${id}`}
                              md={4}
                              className="mb-4"
                            >
                              <div className="border rounded p-3 h-100">
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <div>
                                    <strong>{file.file_type || "Document"}</strong>
                                    <p className="text-muted small mb-1">
                                      {file.description}
                                    </p>
                                  </div>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="text-danger p-0"
                                    onClick={() => handleDeleteFile(index)}
                                  >
                                    <Trash2 size={16} />
                                  </Button>
                                </div>
                                <div className="text-center">
                                  <a
                                    href={file.file}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img
                                      src={file.file}
                                      alt={file.file_type || "Document"}
                                      className="img-fluid border rounded"
                                      style={{ maxHeight: "150px" }}
                                    />
                                  </a>
                                </div>
                              </div>
                            </Col>
                          ))
                        ) : (
                          <Col>
                            <div className="text-muted mt-3">No files uploaded</div>
                          </Col>
                        )}
                      </Row>
                    </div>
                  </div>

                  {/* Close Button */}
                  <div className="d-flex mt-5 flex-wrap gap-2 justify-content-end">
                    <Button
                      variant="outline-secondary"
                      as={Link}
                      to="/partners/agencies"
                    >
                      Close
                    </Button>
                  </div>

                  {/* File Upload Modal */}
                  <Modal
                    show={showFileModal}
                    onHide={() => setShowFileModal(false)}
                    centered
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>Upload New File</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <Form>
                        <Form.Group className="mb-3">
                          <Form.Label>File Type</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Enter file type (e.g., Agreement, License)"
                            value={fileForm.file_type}
                            onChange={(e) =>
                              setFileForm({
                                ...fileForm,
                                file_type: e.target.value,
                              })
                            }
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>Description</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Enter file description"
                            value={fileForm.description}
                            onChange={(e) =>
                              setFileForm({
                                ...fileForm,
                                description: e.target.value,
                              })
                            }
                          />
                        </Form.Group>
                        <Form.Group className="mb-3">
                          <Form.Label>File</Form.Label>
                          <div
                            className="rounded d-flex flex-column justify-content-center align-items-center p-4"
                            style={{
                              border: "3px dashed #ccc",
                            }}
                          >
                            {filePreview ? (
                              <img
                                src={filePreview}
                                alt="Preview"
                                className="img-fluid mb-3"
                                style={{ maxHeight: "200px" }}
                              />
                            ) : (
                              <UploadCloudIcon
                                size={"40px"}
                                className="text-primary"
                              />
                            )}
                            <input
                              type="file"
                              id="file-upload"
                              onChange={handleFileChange}
                              className="d-none"
                              accept=".pdf,.jpg,.jpeg,.png"
                            />
                            <label
                              htmlFor="file-upload"
                              className="btn btn-outline-primary mb-2"
                            >
                              Choose File
                            </label>
                            <p style={{ color: "#898989", fontSize: "0.8rem" }}>
                              <span className="text-primary fw-bold">
                                Click to upload
                              </span>{" "}
                              or drag and drop PDF, JPG, or PNG (Max Size: 5MB)
                            </p>
                          </div>
                        </Form.Group>
                      </Form>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        variant="secondary"
                        onClick={() => setShowFileModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleFileUpload}
                        disabled={!selectedFile || isUploading}
                      >
                        {isUploading ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          "Upload File"
                        )}
                      </Button>
                    </Modal.Footer>
                  </Modal>

                  {/* Sub-Agent Modal */}
                  <Modal
                    show={showModalSub}
                    onHide={handleCloseSub}
                    centered
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>
                        {selectedSubAgent ? "Edit Sub-Agent" : "Add Sub-Agent"}
                      </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      {error && (
                        <Alert
                          variant="danger"
                          onClose={() => setError(null)}
                          dismissible
                        >
                          {error}
                        </Alert>
                      )}
                      {success && (
                        <Alert
                          variant="success"
                          onClose={() => setSuccess(null)}
                          dismissible
                        >
                          {success}
                        </Alert>
                      )}
                      <Form>
                        <Form.Group className="mb-3">
                          <Form.Label>Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={subAgentForm.name}
                            onChange={handleSubAgentChange}
                            placeholder="Enter name"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={subAgentForm.email}
                            onChange={handleSubAgentChange}
                            placeholder="Enter email"
                            disabled={!!selectedSubAgent}
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Password</Form.Label>
                          <Form.Control
                            type="password"
                            name="password"
                            value={subAgentForm.password}
                            onChange={handleSubAgentChange}
                            placeholder={
                              selectedSubAgent
                                ? "Leave blank to keep current"
                                : "Enter password"
                            }
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Permissions Group</Form.Label>
                          <Form.Select
                            name="permissions"
                            value={subAgentForm.permissions}
                            onChange={handleSubAgentChange}
                            required
                          >
                            <option value="">Select group</option>
                            {allGroups.length > 0 ? (
                              allGroups.map((group) => (
                                <option key={group.id} value={group.id}>
                                  {group.name}
                                </option>
                              ))
                            ) : (
                              <option disabled>No agent groups available</option>
                            )}
                          </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Check
                            type="switch"
                            id="sub-agent-active"
                            label="Active Status"
                            name="is_active"
                            checked={subAgentForm.is_active || false}
                            onChange={(e) => setSubAgentForm({
                              ...subAgentForm,
                              is_active: e.target.checked
                            })}
                          />
                        </Form.Group>
                      </Form>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button variant="secondary" onClick={handleCloseSub}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleSubAgentSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Spinner size="sm" animation="border" />
                        ) : selectedSubAgent ? (
                          "Update"
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </Modal.Footer>
                  </Modal>

                  {/* Delete Confirmation Modal */}
                  {/* <Modal
                    show={showDeleteModal}
                    onHide={() => setShowDeleteModal(false)}
                    centered
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>Confirm Deletion</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      Are you sure you want to delete this sub-agent?
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        variant="secondary"
                        onClick={() => setShowDeleteModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        onClick={handleDeleteSubAgent}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          "Delete"
                        )}
                      </Button>
                    </Modal.Footer>
                  </Modal> */}

                  {/* Contact Modal */}
                  <Modal
                    show={showContactModal}
                    onHide={() => {
                      setShowContactModal(false);
                      setEditingContact(null);
                      setContactForm({
                        name: "",
                        phone_number: "",
                        email: "",
                        remarks: "",
                      });
                    }}
                    centered
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>
                        {editingContact !== null ? "Edit Contact" : "Add Contact"}
                      </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <Form>
                        <Form.Group className="mb-3">
                          <Form.Label>Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={contactForm.name}
                            onChange={(e) =>
                              setContactForm({
                                ...contactForm,
                                name: e.target.value,
                              })
                            }
                            placeholder="Enter name"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Phone Number</Form.Label>
                          <Form.Control
                            type="text"
                            name="phone_number"
                            value={contactForm.phone_number}
                            onChange={(e) =>
                              setContactForm({
                                ...contactForm,
                                phone_number: e.target.value,
                              })
                            }
                            placeholder="Enter phone number"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={contactForm.email}
                            onChange={(e) =>
                              setContactForm({
                                ...contactForm,
                                email: e.target.value,
                              })
                            }
                            placeholder="Enter email"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Remarks</Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            name="remarks"
                            value={contactForm.remarks}
                            onChange={(e) =>
                              setContactForm({
                                ...contactForm,
                                remarks: e.target.value,
                              })
                            }
                            placeholder="Enter remarks"
                          />
                        </Form.Group>
                      </Form>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setShowContactModal(false);
                          setEditingContact(null);
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={async () => {
                          setIsSubmitting(true);
                          try {
                            let updatedContacts = [...(agencyData.contacts || [])];

                            if (editingContact !== null) {
                              // Update existing contact
                              updatedContacts[editingContact] = { ...contactForm };
                            } else {
                              // Add new contact
                              updatedContacts.push({ ...contactForm });
                            }

                            const response = await axios.patch(
                              `http://127.0.0.1:8000/api/agencies/${id}/`,
                              { contacts: updatedContacts },
                              axiosConfig
                            );

                            setAgencyData(response.data);
                            setShowContactModal(false);
                            setEditingContact(null);
                            setContactForm({
                              name: "",
                              phone_number: "",
                              email: "",
                              remarks: "",
                            });
                          } catch (error) {
                            console.error("Error saving contact:", error);
                            setError(
                              error.response?.data?.detail ||
                              "Failed to save contact. Please try again."
                            );
                          } finally {
                            setIsSubmitting(false);
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          "Save Contact"
                        )}
                      </Button>
                    </Modal.Footer>
                  </Modal>


                  {/* Main Agent Edit Modal */}
                  <Modal
                    show={showMainAgentModal}
                    onHide={() => {
                      setShowMainAgentModal(false);
                      setSelectedMainAgent(null);
                      setMainAgentForm({
                        name: "",
                        email: "",
                        password: "",
                        is_active: false,
                      });
                    }}
                    centered
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>Edit Main Agent</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <Form>
                        <Form.Group className="mb-3">
                          <Form.Label>Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={mainAgentForm.name}
                            onChange={handleMainAgentChange}
                            placeholder="Enter name"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={mainAgentForm.email}
                            onChange={handleMainAgentChange}
                            placeholder="Enter email"
                            disabled
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Label>Password</Form.Label>
                          <Form.Control
                            type="password"
                            name="password"
                            value={mainAgentForm.password}
                            onChange={handleMainAgentChange}
                            placeholder="Leave blank to keep current"
                          />
                        </Form.Group>

                        <Form.Group className="mb-3">
                          <Form.Check
                            type="switch"
                            id="main-agent-active"
                            label="Active Status"
                            name="is_active"
                            checked={mainAgentForm.is_active}
                            onChange={handleMainAgentChange}
                          />
                        </Form.Group>
                      </Form>
                    </Modal.Body>
                    <Modal.Footer>
                      <Button variant="secondary" onClick={() => setShowMainAgentModal(false)}>
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleMainAgentSubmit}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          "Update"
                        )}
                      </Button>
                    </Modal.Footer>
                  </Modal>

                  {/* Delete Confirmation Modal */}
                  <Modal
                    show={showDeleteModal}
                    onHide={() => setShowDeleteModal(false)}
                    centered
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>Confirm Deletion</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      Are you sure you want to delete this {deleteType === 'main' ? 'main agent' : 'sub-agent'}?
                    </Modal.Body>
                    <Modal.Footer>
                      <Button
                        variant="secondary"
                        onClick={() => setShowDeleteModal(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="danger"
                        onClick={handleDeleteSubAgent}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          "Delete"
                        )}
                      </Button>
                    </Modal.Footer>
                  </Modal>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgencyDetails;
