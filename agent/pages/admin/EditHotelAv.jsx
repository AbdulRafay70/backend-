import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const EditHotelAvailability = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [hotelData, setHotelData] = useState({
    is_active: true,
    available_start_date: "",
    available_end_date: "",
  });

  // Fetch hotel data on component mount
  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("accessToken");
        const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
        const organizationId = orgData?.id;

        const response = await axios.get(
          `https://api.saer.pk/api/hotels/${id}/`,
          {
            params: { organization: organizationId },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setHotelData({
          is_active: response.data.is_active,
          available_start_date: response.data.available_start_date || "",
          available_end_date: response.data.available_end_date || "",
        });
      } catch (error) {
        setError("Failed to fetch hotel data. Please try again.");
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotelData();
  }, [id]);

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    if (!hotelData.available_start_date) {
      errors.available_start_date = "Start date is required";
      isValid = false;
    }

    if (!hotelData.available_end_date) {
      errors.available_end_date = "End date is required";
      isValid = false;
    }

    // Validate date range if both dates exist
    if (hotelData.available_start_date && hotelData.available_end_date) {
      const startDate = new Date(hotelData.available_start_date);
      const endDate = new Date(hotelData.available_end_date);

      if (startDate > endDate) {
        errors.dateRange = "End date must be after start date";
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setHotelData({
      ...hotelData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("accessToken");
      const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
      const organizationId = orgData?.id;

      const updateData = {
        is_active: hotelData.is_active,
        available_start_date: hotelData.available_start_date,
        available_end_date: hotelData.available_end_date,
      };

      await axios.patch(
        `https://api.saer.pk/api/hotels/${id}/`,
        updateData,
        {
          params: { organization: organizationId },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setSuccess("Hotel availability updated successfully!");
      setTimeout(() => {
        navigate("/admin/hotels");
      }, 1500);
    } catch (error) {
      let errorMessage = "Failed to update hotel availability.";
      
      if (error.response) {
        if (error.response.status === 403) {
          errorMessage = "You don't have permission to update this hotel.";
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data) {
          const fieldErrors = Object.values(error.response.data).flat();
          errorMessage = fieldErrors.join(" ");
        }
      }
      
      setError(errorMessage);
      console.error("Update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="container-fluid"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      <div className="row">
        <div className="col-lg-2 mb-3">
          <Sidebar />
        </div>
        <div className="col-lg-10" style={{ background: "#F2F3F4" }}>
          <Header />
          <div className="container-fluid p-4 mt-2">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
              <div className="d-flex flex-wrap align-items-center justify-content-end gap-2">
                <Link
                  to="/admin/hotels"
                  className="btn text-white"
                  style={{ background: "#1B78CE" }}
                >
                  Back to Hotels
                </Link>
              </div>
            </div>

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

            {isLoading && !hotelData ? (
              <div className="text-center">Loading hotel data...</div>
            ) : (
              <div className="p-3 bg-white rounded-3">
                <h4 className="fw-bold">Edit Hotel Availability</h4>

                <form onSubmit={handleSubmit}>
                  <div className="p-3 d-flex flex-wrap gap-5">
                    <div className="mb-3" style={{ width: "300px" }}>
                      <label className="form-label">Available Start Date*</label>
                      <input
                        type="date"
                        name="available_start_date"
                        value={hotelData.available_start_date}
                        onChange={handleInputChange}
                        className={`form-control ${
                          formErrors.available_start_date ? "is-invalid" : ""
                        }`}
                        required
                      />
                      {formErrors.available_start_date && (
                        <div className="invalid-feedback">
                          {formErrors.available_start_date}
                        </div>
                      )}
                    </div>

                    <div className="mb-3" style={{ width: "300px" }}>
                      <label className="form-label">Available End Date*</label>
                      <input
                        type="date"
                        name="available_end_date"
                        value={hotelData.available_end_date}
                        onChange={handleInputChange}
                        className={`form-control ${
                          formErrors.available_end_date ? "is-invalid" : ""
                        }`}
                        required
                      />
                      {formErrors.available_end_date && (
                        <div className="invalid-feedback">
                          {formErrors.available_end_date}
                        </div>
                      )}
                    </div>
                  </div>

                  {formErrors.dateRange && (
                    <div className="alert alert-danger mx-3">
                      {formErrors.dateRange}
                    </div>
                  )}

                  <div className="p-3">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="is_active"
                        id="is_active"
                        checked={hotelData.is_active}
                        onChange={handleInputChange}
                        style={{ width: "3rem", height: "1.5rem" }}
                      />
                      <label
                        className="form-check-label ms-2"
                        htmlFor="is_active"
                      >
                        {hotelData.is_active ? "Active" : "Inactive"}
                      </label>
                    </div>
                  </div>

                  <div className="d-flex flex-wrap gap-2 justify-content-end p-3">
                    <button
                      type="submit"
                      className="btn text-white"
                      style={{ background: "#1B78CE" }}
                      disabled={isLoading}
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                    <Link
                      to="/admin/hotels"
                      className="btn btn-outline-secondary"
                    >
                      Cancel
                    </Link>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditHotelAvailability;