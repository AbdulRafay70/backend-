import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Search, Plus, Trash2 } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const EditHotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [availableCities, setAvailableCities] = useState([]);

  const token = localStorage.getItem("accessToken");
  const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
  const organizationId = orgData?.id;

  const [hotelDetails, setHotelDetails] = useState({
    city: "",
    name: "",
    address: "",
    google_location: "",
    google_drive_link: "",
    contact_number: "",
    category: "ECO",
    distance: "",
    is_active: true,
    available_start_date: "",
    available_end_date: "",
    contact_details: [],
  });

  const [showNewContactRow, setShowNewContactRow] = useState(false);
  const [newContactDetail, setNewContactDetail] = useState({
    contact_person: "",
    contact_number: "",
  });

  const [cities, setCities] = useState([]);


  const handleContactDetailChange = (index, key, value) => {
    const updatedContacts = [...hotelDetails.contact_details];
    updatedContacts[index][key] = value;
    setHotelDetails((prev) => ({
      ...prev,
      contact_details: updatedContacts,
    }));
  };

  const handleNewContactChange = (key, value) => {
    setNewContactDetail((prev) => ({ ...prev, [key]: value }));
  };

  const addContactDetail = () => {
    if (newContactDetail.contact_person && newContactDetail.contact_number) {
      setHotelDetails((prev) => ({
        ...prev,
        contact_details: [...prev.contact_details, { ...newContactDetail, id: 0 }],
      }));
      setNewContactDetail({ contact_person: "", contact_number: "" });
      setShowNewContactRow(false); // Hide input row again
    }
  };


  const handleHotelChange = (field, value) => {
    setHotelDetails((prev) => ({
      ...prev,
      [field]: value,
    }));
  };


  const removeContactDetail = (index) => {
    const updatedContactDetails = [...hotelDetails.contact_details];
    updatedContactDetails.splice(index, 1);
    setHotelDetails((prev) => ({
      ...prev,
      contact_details: updatedContactDetails,
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const hotelResponse = await axios.get(`https://api.saer.pk/api/hotels/${id}/`, {
          params: { organization: organizationId },
          headers: { Authorization: `Bearer ${token}` },
        });

        const allHotelsResponse = await axios.get("https://api.saer.pk/api/hotels/", {
          params: { organization: organizationId },
          headers: { Authorization: `Bearer ${token}` },
        });

        const cities = [...new Set(allHotelsResponse.data.map((hotel) => hotel.city))];
        setAvailableCities(cities);

        const formatDate = (dateString) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          return date.toISOString().split("T")[0];
        };

        setHotelDetails({
          city: hotelResponse.data.city || "",
          name: hotelResponse.data.name || "",
          address: hotelResponse.data.address || "",
          google_location: hotelResponse.data.google_location || "",
          google_drive_link: hotelResponse.data.google_drive_link || "",
          contact_number: hotelResponse.data.contact_number || "",
          category: hotelResponse.data.category || "ECO",
          distance: hotelResponse.data.distance?.toString() || "",
          contact_details: hotelResponse.data.contact_details || [],
        });

        setIsLoading(false);
      } catch (error) {
        setError("Failed to load data: " + (error.response?.data?.detail || error.message));
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get(
          `https://api.saer.pk/api/cities/?organization=${organizationId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCities(response.data);
      } catch (error) {
        console.error("Error fetching cities:", error.response?.data || error);
        toast.error(
          "Failed to load cities: " +
          (error.response?.data?.detail || "Unknown error.")
        );
      } finally {

      }
    };
    fetchCities()
  }, [])


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("accessToken");
      const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
      const organizationId = orgData?.id;

      const patchData = {
        city: hotelDetails.city,
        name: hotelDetails.name,
        address: hotelDetails.address,
        google_location: hotelDetails.google_location,
        google_drive_link: hotelDetails.google_drive_link,
        contact_number: hotelDetails.contact_number,
        category: hotelDetails.category,
        distance: parseFloat(hotelDetails.distance) || 0,
        contact_details: hotelDetails.contact_details.map(cd => ({
          id: cd.id || 0,
          contact_person: cd.contact_person,
          contact_number: cd.contact_number
        })),
        organization: organizationId,
      };

      await axios.patch(`https://api.saer.pk/api/hotels/${id}/`, patchData, {
        params: { organization: organizationId },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      setSuccess("Hotel details updated successfully!");
      setTimeout(() => navigate("/hotels"), 2000);
    } catch (error) {
      let errorMsg = "Failed to update hotel";
      if (error.response?.data) {
        if (typeof error.response.data === "object") {
          errorMsg = Object.values(error.response.data).flat().join("\n");
        } else {
          errorMsg = error.response.data.detail || JSON.stringify(error.response.data);
        }
      }
      setError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
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
                {/* Header Controls */}
                <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <div
                      className="input-group g-white"
                      style={{ maxWidth: "250px" }}
                    >
                      <span className="input-group-text">
                        <Search />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search name, address, job, etc"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="d-flex flex-wrap align-items-center gap-2">
                    <Link
                      to="/hotels"
                      className="btn text-white"
                      style={{ background: "#1B78CE" }}
                    >
                      Back to Hotels
                    </Link>
                    <button
                      className="btn text-white"
                      style={{ background: "#1B78CE" }}
                    >
                      Download Hotel Sheet
                    </button>
                  </div>
                </div>

                {/* Error and Success Messages */}
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="alert alert-success" role="alert">
                    {success}
                  </div>
                )}

                {isLoading ? (
                  <div className="text-center p-5">Loading hotel details...</div>
                ) : (
                  <div className="bg-white rounded-4 shadow-sm p-3">
                    <form onSubmit={handleSubmit}>
                      <div className="p-4">
                        <div className="row">
                          <h4 className="fw-bold mb-3">Edit Hotel (Details)</h4>
                          <div className="col-12 d-flex flex-wrap gap-5">
                            {/* City Field */}
                            <div>
                              <label htmlFor="" className="">
                                City
                              </label>
                              <select
                                value={hotelDetails.city}
                                onChange={(e) =>
                                  handleHotelChange("city", e.target.value)
                                }
                                className="form-select"
                                required
                              >
                                {cities.map((city) => (
                                  <option key={city.id} value={city.id}>
                                    {city.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Hotel Name Field */}
                            <div>
                              <label htmlFor="" className="">
                                Hotel Name
                              </label>
                              <input
                                type="text"
                                value={hotelDetails.name}
                                onChange={(e) =>
                                  handleHotelChange("name", e.target.value)
                                }
                                className="form-control rounded shadow-none  px-1 py-2"
                                required
                                placeholder="Hotel Name"
                              />
                            </div>

                            {/* Address Field */}
                            <div>
                              <label htmlFor="" className="">
                                Address
                              </label>
                              <input
                                type="text"
                                value={hotelDetails.address}
                                onChange={(e) =>
                                  handleHotelChange("address", e.target.value)
                                }
                                className="form-control rounded shadow-none  px-1 py-2"
                                required
                                placeholder="Street Address"
                              />
                            </div>

                            {/* Google Location Field */}
                            <div>
                              <label htmlFor="" className="">
                                Google Location
                              </label>
                              <input
                                type="text"
                                value={hotelDetails.google_location}
                                onChange={(e) =>
                                  handleHotelChange(
                                    "google_location",
                                    e.target.value
                                  )
                                }
                                className="form-control rounded shadow-none  px-1 py-2"
                                placeholder="Google Maps URL"
                              />
                            </div>

                            {/* Google Drive Link Field */}
                            <div>
                              <label htmlFor="" className="">
                                Google Drive Link
                              </label>
                              <input
                                type="text"
                                value={hotelDetails.google_drive_link}
                                onChange={(e) =>
                                  handleHotelChange(
                                    "google_drive_link",
                                    e.target.value
                                  )
                                }
                                className="form-control rounded shadow-none  px-1 py-2"
                                placeholder="Drive Folder URL"
                              />
                            </div>

                            {/* Phone Field */}
                            <div>
                              <label htmlFor="" className="">
                                Phone
                              </label>
                              <input
                                type="text"
                                value={hotelDetails.contact_number}
                                onChange={(e) =>
                                  handleHotelChange(
                                    "contact_number",
                                    e.target.value
                                  )
                                }
                                className="form-control rounded shadow-none  px-1 py-2"
                                required
                                placeholder="+966 1234567"
                              />
                            </div>

                            {/* Category Field */}
                            <div>
                              <label htmlFor="" className="">
                                Category
                              </label>
                              <select
                                value={hotelDetails.category}
                                onChange={(e) =>
                                  handleHotelChange("category", e.target.value)
                                }
                                className="form-select"
                              >
                                <option value="ECO">ECO</option>
                                <option value="1 Star">1 Star</option>
                                <option value="2 Star">2 Star</option>
                                <option value="3 Star">3 Star</option>
                                <option value="4 Star">4 Star</option>
                                <option value="5 Star">5 Star</option>
                              </select>
                            </div>

                            {/* Distance Field */}
                            <div>
                              <label htmlFor="" className="">
                                Distance
                              </label>
                              <input
                                type="text"
                                value={hotelDetails.distance}
                                onChange={(e) =>
                                  handleHotelChange("distance", e.target.value)
                                }
                                className="form-control rounded shadow-none  px-1 py-2"
                                required
                                placeholder="600M"
                              />
                            </div>
                          </div>

                          {/* Contact Details Section */}
                          <h4 className="fw-bold mb-3 mt-3">Contact Details</h4>
                          {hotelDetails.contact_details?.map((contact, index) => (
                            <div key={index} className="row mb-3">
                              <div className="col-md-3">
                                <label htmlFor="" className="">Contact Person</label>
                                <input
                                  type="text"
                                  className="form-control form-control rounded shadow-none  px-1 py-2"
                                  placeholder="Contact Person"
                                  value={contact.contact_person}
                                  onChange={(e) =>
                                    handleContactDetailChange(index, "contact_person", e.target.value)
                                  }
                                />
                              </div>
                              <div className="col-md-3">
                                <label htmlFor="" className="">Contact Number</label>
                                <input
                                  type="text"
                                  className="form-control form-control rounded shadow-none  px-1 py-2"
                                  placeholder="Contact Number"
                                  value={contact.contact_number}
                                  onChange={(e) =>
                                    handleContactDetailChange(index, "contact_number", e.target.value)
                                  }
                                />
                              </div>
                            </div>
                          ))}

                          {/* Show new contact row when button clicked */}
                          {showNewContactRow && (
                            <div className="row mb-3">
                              <div className="col-md-3">
                                <label htmlFor="" className="">Contact Person</label>
                                <input
                                  type="text"
                                  className="form-control form-control rounded shadow-none  px-1 py-2"
                                  placeholder="Contact Person"
                                  value={newContactDetail.contact_person}
                                  onChange={(e) =>
                                    handleNewContactChange("contact_person", e.target.value)
                                  }
                                />
                              </div>
                              <div className="col-md-3">
                                <label htmlFor="" className="">Contact Number</label>
                                <input
                                  type="text"
                                  className="form-control form-control rounded shadow-none  px-1 py-2"
                                  placeholder="Contact Number"
                                  value={newContactDetail.contact_number}
                                  onChange={(e) =>
                                    handleNewContactChange("contact_number", e.target.value)
                                  }
                                />
                              </div>
                              <div className="col-md-1">
                                <button
                                  type="button"
                                  className="btn btn-success"
                                  onClick={addContactDetail}
                                  disabled={
                                    !newContactDetail.contact_person ||
                                    !newContactDetail.contact_number
                                  }
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* "+" button to show new contact row */}
                          {!showNewContactRow && (
                            <div className="row mb-3">
                              <div className="col-md-1">
                                <button
                                  type="button"
                                  className="btn btn-success"
                                  onClick={() => setShowNewContactRow(true)}
                                >
                                  <Plus size={16} />
                                </button>
                              </div>
                            </div>
                          )}


                          <div className="mt-4">
                            <button type="submit" className="btn btn-primary">
                              {isLoading ? "Saving..." : "Save Changes"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary ms-2"
                              onClick={() => navigate("/hotels")}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default EditHotelDetail;
