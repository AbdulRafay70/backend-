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
import axios from "axios";

const BranchesDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [branch, setBranch] = useState(null);
  const [agencies, setAgencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

 const tabs = [
    { name: "All Partners", path: "/partners" },
    { name: "Request", path: "/partners/request" },
    { name: "Group And Permissions", path: "/partners/role-permissions" },
    { name: "Discounts", path: "/partners/discounts" },
    { name: "Organizations", path: "/partners/organization" },
    { name: "Branches", path: "/partners/branche" },
    { name: "Agencies", path: "/partners/agencies" },
  ];

  // Fetch Branch + Agencies
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [agenciesRes, branchesRes] = await Promise.all([
          axios.get("http://127.0.0.1:8000/api/agencies"),
          axios.get("http://127.0.0.1:8000/api/branches"), // Assuming this is the endpoint
        ]);

        const branchData = branchesRes.data.find((b) => b.id === Number(id));
        const filteredAgencies = agenciesRes.data.filter(
          (agency) => agency.branch === Number(id)
        );

        setBranch(branchData);
        setAgencies(filteredAgencies);
      } catch (err) {
        setError("Failed to load branch or agencies data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
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
                      className={`nav-link btn btn-link text-decoration-none px-0 me-3 border-0 ${tab.name === "Branches"
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

              <div className="p-3 rounded-4 border">
                {/* Back Button */}
                <div className="d-flex align-items-center mb-4">
                  <Link to="/partners/branche" className="me-2">
                    <ArrowBigLeft />
                  </Link>
                </div>

                {/* Branch Details */}
                <h5 className="fw-semibold mb-3">Branch Information</h5>
                {/* {loading && <Spinner animation="border" />} */}
                {error && <Alert variant="danger">{error}</Alert>}
                {branch && (
                  <div className="mb-4 d-flex gap-5 justify-content-center">
                    <p><strong>ID:</strong> {branch.id}</p>
                    <p><strong>Name:</strong> {branch.name}</p>
                    <p><strong>Email:</strong> {branch.email || "N/A"}</p>
                    <p><strong>Address:</strong> {branch.address || "N/A"}</p>
                    <p><strong>Phone:</strong> {branch.contact_number || "N/A"}</p>
                    <p><strong>Organization:</strong> {branch.organization_name || "N/A"}</p>
                  </div>
                )}

                {/* Connected Agencies */}
                <h5 className="fw-semibold mt-4">Connected Agencies</h5>
                {!loading && agencies.length === 0 && (
                  <p className="text-muted">No agencies found for this branch.</p>
                )}
                {!loading && agencies.length > 0 && (
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Agency Name</th>
                        <th>Contact Person</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Address</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agencies.map((agency) => (
                        <tr key={agency.id}>
                          <td>{agency.id}</td>
                          <td>{agency.ageny_name}</td>
                          <td>{agency.name}</td>
                          <td>{agency.email}</td>
                          <td>{agency.phone_number}</td>
                          <td>{agency.address}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}

                {/* Close Button */}
                <div className="d-flex mt-5 flex-wrap gap-2 justify-content-end">
                  <Button
                    variant="outline-secondary"
                    as={Link}
                    to="/partners/branche"
                  >
                    Close
                  </Button>
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

export default BranchesDetails;
