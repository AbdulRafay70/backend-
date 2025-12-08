import React, { useState, useEffect } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Plus } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const bedTypes = [
  { id: "double", label: "Double Bed" },
  { id: "triple", label: "Triple Bed" },
  { id: "quad", label: "Quad Bed" },
  { id: "quint", label: "Quint Bed" },
];

for (let i = 7; i <= 100; i++) {
  bedTypes.push({ id: `${i}Bed`, label: `${i} Bed` });
}


const EditHotelAvailabilityAndPrices = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // Hotel data state
  const [hotelData, setHotelData] = useState({
    is_active: true,
    available_start_date: "",
    available_end_date: "",
    prices: [
      {
        id: 0,
        start_date: "",
        end_date: "",
        only_room_price: "",
        bed_prices: [],
      },
    ],
  });
  const [hotelOwnerId, setHotelOwnerId] = useState(null);

  // Fetch hotel data on component mount
  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem("accessToken");
        const orgData = JSON.parse(
          localStorage.getItem("selectedOrganization")
        );
        const organizationId = orgData?.id;

        const response = await axios.get(
          `http://127.0.0.1:8000/api/hotels/${id}/`,
          {
            params: { organization: organizationId },
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Transform the API data to match our new structure
        const transformedPrices = transformPrices(response.data.prices);

        setHotelData({
          is_active: response.data.is_active,
          available_start_date: response.data.available_start_date || "",
          available_end_date: response.data.available_end_date || "",
          prices: transformedPrices.length > 0
            ? transformedPrices
            : [
              {
                id: 0,
                start_date: "",
                end_date: "",
                only_room_price: "",
                bed_prices: [],
              },
            ],
        });
        // store owning organization id for permission checks
        const respOrg = response.data.organization;
        const ownerId = respOrg && typeof respOrg === 'object' ? (respOrg.id ?? respOrg) : respOrg;
        setHotelOwnerId(ownerId);
      } catch (error) {
        setError("Failed to fetch hotel data. Please try again.");
        console.error("Fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotelData();
  }, [id]);

  // Transform API prices data to our new structure
  const transformPrices = (apiPrices) => {
    if (!apiPrices || apiPrices.length === 0) return [];

    // Group prices by date range
    const groupedPrices = {};

    apiPrices.forEach(price => {
      const key = `${price.start_date}-${price.end_date}`;
      if (!groupedPrices[key]) {
        groupedPrices[key] = {
          id: Object.keys(groupedPrices).length,
          start_date: price.start_date,
          end_date: price.end_date,
          only_room_price: "",
          bed_prices: []
        };
      }

      // Check if this is a room-only price
      if (price.room_type === "Only-Room") {
        groupedPrices[key].only_room_price = price.price;
      }
      // Check if this is a bed type price (including sharing)
      else {
        const bedType = bedTypes.find(bt => bt.label === price.room_type) ||
          (price.room_type === "Sharing" ? { id: "sharing", label: "Sharing" } : null);
        if (bedType) {
          groupedPrices[key].bed_prices.push({
            type: bedType.id,
            price: price.price
          });
        }
      }
    });

    return Object.values(groupedPrices);
  };

  // Handle availability date changes
  const handleAvailabilityChange = (e) => {
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

  // Handle price section changes
  const handlePriceSectionChange = (id, field, value) => {
    setHotelData({
      ...hotelData,
      prices: hotelData.prices.map((section) =>
        section.id === id ? { ...section, [field]: value } : section
      ),
    });
  };

  // Add new bed price to a section
  const addBedPrice = (sectionId, type = null) => {
    setHotelData(prevData => ({
      ...prevData,
      prices: prevData.prices.map(section => {
        if (section.id === sectionId) {
          // If type is specified (like when adding sharing), add that type
          if (type) {
            return {
              ...section,
              bed_prices: [
                ...section.bed_prices,
                {
                  type: type,
                  price: ""
                }
              ]
            };
          }

          // Otherwise find the next available bed type
          const existingBedTypes = section.bed_prices.map(bp => bp.type);
          const nextBedType = bedTypes.find(bt => !existingBedTypes.includes(bt.id));

          if (!nextBedType) {
            setError("All bed types already added");
            return section;
          }

          return {
            ...section,
            bed_prices: [
              ...section.bed_prices,
              {
                type: nextBedType.id,
                price: ""
              }
            ]
          };
        }
        return section;
      })
    }));
  };

  // Add sharing as a bed type
  const addSharing = (sectionId) => {
    addBedPrice(sectionId, "sharing");
  };

  // Handle bed price change
  const handleBedPriceChange = (sectionId, bedType, value) => {
    setHotelData(prevData => ({
      ...prevData,
      prices: prevData.prices.map(section => {
        if (section.id === sectionId) {
          const updatedBedPrices = section.bed_prices.map(bp =>
            bp.type === bedType ? { ...bp, price: value } : bp
          );
          return { ...section, bed_prices: updatedBedPrices };
        }
        return section;
      })
    }));
  };

  // Handle only room price change
  const handleOnlyRoomPriceChange = (sectionId, value) => {
    setHotelData(prevData => ({
      ...prevData,
      prices: prevData.prices.map(section =>
        section.id === sectionId ? { ...section, only_room_price: value } : section
      )
    }));
  };

  // Remove bed price
  const removeBedPrice = (sectionId, bedType) => {
    setHotelData(prevData => ({
      ...prevData,
      prices: prevData.prices.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            bed_prices: section.bed_prices.filter(bp => bp.type !== bedType)
          };
        }
        return section;
      })
    }));
  };

  // Add new price section
  const addPriceSection = () => {
    const newId =
      hotelData.prices.length > 0
        ? Math.max(...hotelData.prices.map((s) => s.id)) + 1
        : 0;

    setHotelData({
      ...hotelData,
      prices: [
        ...hotelData.prices,
        {
          id: newId,
          start_date: "",
          end_date: "",
          only_room_price: "",
          bed_prices: [],
        },
      ],
    });
  };

  // Remove price section
  const removePriceSection = (id) => {
    if (hotelData.prices.length <= 1) {
      setError("At least one price section is required");
      return;
    }
    setHotelData({
      ...hotelData,
      prices: hotelData.prices.filter((section) => section.id !== id),
    });
  };

  // Validate that price date ranges cover availability without gaps
  const validateDateRanges = () => {
    const errors = {};
    let isValid = true;

    // 1. Validate availability dates
    if (!hotelData.available_start_date) {
      errors.available_start_date = "Start date is required";
      isValid = false;
    }

    if (!hotelData.available_end_date) {
      errors.available_end_date = "End date is required";
      isValid = false;
    }

    if (hotelData.available_start_date && hotelData.available_end_date) {
      const availStart = new Date(hotelData.available_start_date);
      const availEnd = new Date(hotelData.available_end_date);

      if (availStart > availEnd) {
        errors.dateRange = "Availability end date must be after start date";
        isValid = false;
      }
    }

    // 2. Validate price sections
    for (const section of hotelData.prices) {
      if (!section.start_date || !section.end_date || !section.only_room_price) {
        errors.priceSections =
          "Please fill all required fields in price sections";
        isValid = false;
        break;
      }

      const priceStart = new Date(section.start_date);
      const priceEnd = new Date(section.end_date);

      if (priceStart > priceEnd) {
        errors.priceSections = "Price end date must be after start date";
        isValid = false;
        break;
      }

      for (const bedPrice of section.bed_prices) {
        if (!bedPrice.price) {
          errors.priceSections = `Price is required for ${bedPrice.type === "sharing" ? "Sharing" : bedPrice.type}`;
          isValid = false;
          break;
        }
      }
    }

    // 3. Validate coverage of availability by price ranges
    if (
      hotelData.available_start_date &&
      hotelData.available_end_date &&
      hotelData.prices.every((p) => p.start_date && p.end_date)
    ) {
      const availStart = new Date(hotelData.available_start_date);
      const availEnd = new Date(hotelData.available_end_date);

      // Sort price sections by start date
      const sortedPrices = [...hotelData.prices].sort(
        (a, b) => new Date(a.start_date) - new Date(b.start_date)
      );

      // Check if first price starts on or before availability start
      const firstPriceStart = new Date(sortedPrices[0].start_date);
      if (firstPriceStart > availStart) {
        errors.coverage =
          "First price section must start on or before availability start date";
        isValid = false;
      }

      // Check if last price ends on or after availability end
      const lastPriceEnd = new Date(
        sortedPrices[sortedPrices.length - 1].end_date
      );
      if (lastPriceEnd < availEnd) {
        errors.coverage =
          "Last price section must end on or after availability end date";
        isValid = false;
      }

      // Check for gaps or overlaps between price sections
      for (let i = 0; i < sortedPrices.length - 1; i++) {
        const currentEnd = new Date(sortedPrices[i].end_date);
        const nextStart = new Date(sortedPrices[i + 1].start_date);

        // Add one day to current end date for comparison
        const nextDay = new Date(currentEnd);
        nextDay.setDate(nextDay.getDate() + 1);

        if (nextStart.getTime() !== nextDay.getTime()) {
          errors.coverage =
            "Price sections must have continuous date coverage with no gaps";
          isValid = false;
          break;
        }
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  // Prepare data for API submission
  const preparePriceDataForAPI = () => {
    const allPriceEntries = [];

    hotelData.prices.forEach((section) => {
      // Add the Only-Room price entry
      allPriceEntries.push({
        start_date: section.start_date,
        end_date: section.end_date,
        room_type: "Only-Room",
        price: parseFloat(section.only_room_price) || 0,
        is_sharing_allowed: section.bed_prices.some(bp => bp.type === "sharing")
      });

      // Add all bed prices (including sharing if present)
      section.bed_prices.forEach((bedPrice) => {
        const isSharing = bedPrice.type === "sharing";
        const roomType = isSharing ? "Sharing" :
          bedTypes.find(bt => bt.id === bedPrice.type)?.label || bedPrice.type;

        allPriceEntries.push({
          start_date: section.start_date,
          end_date: section.end_date,
          room_type: roomType,
          price: parseFloat(bedPrice.price) || 0,
          is_sharing_allowed: isSharing
        });
      });
    });

    return allPriceEntries;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!validateDateRanges()) {
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
      const organizationId = orgData?.id;

      // Prevent non-owning organizations from attempting to change rates
      if (hotelOwnerId && organizationId && String(hotelOwnerId) !== String(organizationId)) {
        setError("You are not the owning organization and cannot update this hotel's prices.");
        setIsLoading(false);
        return;
      }

      const data = {
        is_active: hotelData.is_active,
        available_start_date: hotelData.available_start_date,
        available_end_date: hotelData.available_end_date,
        prices: preparePriceDataForAPI(),
      };

      await axios.patch(`http://127.0.0.1:8000/api/hotels/${id}/`, data, {
        params: { organization: organizationId },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Hotel availability and prices updated successfully!");
      setTimeout(() => {
        navigate("/hotels");
      }, 1000);
    } catch (err) {
      console.error("API Error:", err.response?.data);
      setError(
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to update hotel. Please check your data and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !hotelData.prices) {
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
            <div className="mt-2">
              <div className="text-center">Loading hotel data...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              {/* Header Controls */}
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
                <h4>Edit Hotel Availability & Prices</h4>
                <div className="d-flex flex-wrap align-items-center justify-content-end gap-2">
                  <Link
                    to="/hotels"
                    className="btn text-white"
                    style={{ background: "#1B78CE" }}
                  >
                    Back to Hotels
                  </Link>
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

              <div className="bg-white rounded-4 shadow-sm p-4 mb-4">
                <h4 className="fw-bold mb-3">Availability</h4>

                <div className="row">
                  <div className="col-md-3 mb-3">
                    <label htmlFor="" className="">
                      {" "}
                      Start Date*
                    </label>
                    <input
                      type="date"
                      name="available_start_date"
                      value={hotelData.available_start_date}
                      onChange={handleAvailabilityChange}
                      className={`form-control  ${formErrors.available_start_date ? "is-invalid" : ""
                        }`}
                      required
                    />
                    {formErrors.available_start_date && (
                      <div className="invalid-feedback d-block">
                        {formErrors.available_start_date}
                      </div>
                    )}
                  </div>

                  <div className="col-md-3 mb-3">
                    <label htmlFor="" className="">
                      {" "}
                      End Date*
                    </label>
                    <input
                      type="date"
                      name="available_end_date"
                      value={hotelData.available_end_date}
                      onChange={handleAvailabilityChange}
                      className={`form-control  ${formErrors.available_end_date ? "is-invalid" : ""
                        }`}
                      required
                    />
                    {formErrors.available_end_date && (
                      <div className="invalid-feedback d-block">
                        {formErrors.available_end_date}
                      </div>
                    )}
                  </div>
                </div>

                {formErrors.dateRange && (
                  <div className="alert alert-danger">{formErrors.dateRange}</div>
                )}

                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    name="is_active"
                    id="is_active"
                    checked={hotelData.is_active}
                    onChange={handleAvailabilityChange}
                    style={{ width: "3rem", height: "1.5rem" }}
                  />
                  <label className="form-check-label ms-2" htmlFor="is_active">
                    {hotelData.is_active ? "Active" : "Inactive"}
                  </label>
                </div>

                <h4 className="fw-bold mt-5">Price</h4>

                {formErrors.coverage && (
                  <div className="alert alert-danger mb-3">
                    {formErrors.coverage}
                  </div>
                )}

                {formErrors.priceSections && (
                  <div className="alert alert-danger mb-3">
                    {formErrors.priceSections}
                  </div>
                )}

                {hotelData.prices.map((section) => (
                  <div key={section.id} className="p-4 mb-3 position-relative">
                    {hotelData.prices.length > 1 && (
                      <div className="d-flex justify-content-end">
                        <button
                          className="btn btn-sm btn-danger mb-3"
                          style={{ top: "10px", right: "10px" }}
                          onClick={() => removePriceSection(section.id)}
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    <div className="row">
                      <div className="col-12 d-flex flex-wrap gap-4">
                        {/* Date fields */}
                        <div>
                          <label htmlFor="" className="">
                            Start Date*
                          </label>
                          <input
                            type="date"
                            value={section.start_date}
                            onChange={(e) =>
                              handlePriceSectionChange(
                                section.id,
                                "start_date",
                                e.target.value
                              )
                            }
                            className="form-control "
                            required
                          />
                        </div>

                        <div>
                          <label htmlFor="" className="">
                            End Date*
                          </label>
                          <input
                            type="date"
                            value={section.end_date}
                            onChange={(e) =>
                              handlePriceSectionChange(
                                section.id,
                                "end_date",
                                e.target.value
                              )
                            }
                            className="form-control "
                            required
                          />
                        </div>

                        {/* Only-Room price */}
                        <div>
                          <label htmlFor="" className="">
                            Only-Room Price*
                          </label>
                          <input
                            type="number"
                            value={section.only_room_price}
                            onChange={(e) =>
                              handleOnlyRoomPriceChange(section.id, e.target.value)
                            }
                            className="form-control "
                            placeholder="SAR 30"
                            required
                          />
                        </div>

                        {/* Bed prices (including sharing if added) */}
                        {section.bed_prices.map((bedPrice) => {
                          const bedTypeLabel = bedPrice.type === "sharing"
                            ? "Sharing"
                            : bedTypes.find(bt => bt.id === bedPrice.type)?.label || bedPrice.type;

                          return (
                            <label key={bedPrice.type} className="rounded position-relative" style={{ width: "200px" }}>
                              <button
                                type="button"
                                className="btn btn-danger position-absolute"
                                style={{ top: "-10px", right: "-10px", padding: "0.25rem 0.5rem" }}
                                onClick={() => removeBedPrice(section.id, bedPrice.type)}
                              >
                                ×
                              </button>
                              <label>
                                {bedTypeLabel}
                              </label>
                              <input
                                type="number"
                                value={bedPrice.price}
                                onChange={(e) =>
                                  handleBedPriceChange(
                                    section.id,
                                    bedPrice.type,
                                    e.target.value
                                  )
                                }
                                className="form-control "
                                required
                                placeholder="SAR 30"
                              />
                            </label>
                          );
                        })}

                        <div className="d-flex gap-3">
                          {/* Add Sharing button (only shown if sharing not already added) */}
                          {!section.bed_prices.some(bp => bp.type === "sharing") && (
                            <div className="p-3 cursor-pointer d-flex align-items-center" onClick={() => addSharing(section.id)}>
                              <Plus size={24} style={{ color: "#0869FB" }} />
                              <span className="ms-2">Add Sharing</span>
                            </div>
                          )}

                          {/* Add Bed Type button */}
                          {section.bed_prices.length < bedTypes.length && (
                            <div className="p-3 cursor-pointer d-flex align-items-center" onClick={() => addBedPrice(section.id)}>
                              <Plus size={24} style={{ color: "#0869FB" }} />
                              <span className="ms-2">Add Bed Type</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="p-3 cursor-pointer" onClick={addPriceSection}>
                  <Plus size={40} style={{ color: "#0869FB" }} />
                  <span className="ms-2">Add Another Price Section</span>
                </div>

                <div className="d-flex flex-wrap gap-2 justify-content-end mt-4">
                  <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </button>
                  <Link to="/hotels" className="btn btn-outline-secondary">
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditHotelAvailabilityAndPrices;