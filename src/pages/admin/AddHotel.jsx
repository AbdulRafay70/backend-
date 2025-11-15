import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { Plus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from 'react-toastify';

const bedTypes = [
  { id: "double", label: "Double Bed" },
  { id: "triple", label: "Triple Bed" },
  { id: "quad", label: "Quad Bed" },
  { id: "quint", label: "Quint Bed" },
];

for (let i = 7; i <= 100; i++) {
  bedTypes.push({ id: `${i}Bed`, label: `${i} Bed` });
}


const AddHotels = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState("active");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [cities, setCities] = useState([]);

  // Hotel details state
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
    organization: 1,
  });

  // Price sections state
  const [priceSections, setPriceSections] = useState([
    {
      id: 0,
      start_date: "",
      end_date: "",
      only_room_price: "",
      bed_prices: [],
    },
  ]);

  const [contactDetails, setContactDetails] = useState([
    {
      id: 0,
      contact_person: "",
      contact_number: ""
    },
  ]);

  const selectedOrg = JSON.parse(localStorage.getItem("selectedOrganization"));
  const token = localStorage.getItem("accessToken");

  // Allow overriding API base via env var in development; fall back to empty
  // so relative paths will work when frontend and backend are proxied.
  // use a safe check for `process` because some dev setups don't polyfill it
  const API_BASE = (typeof process !== 'undefined' && process?.env && process.env.REACT_APP_API_URL)
    ? process.env.REACT_APP_API_URL
    : (window.REACT_APP_API_URL || "");

  useEffect(() => {
    const fetchCities = async () => {
      const orgId = typeof selectedOrg === "object" ? selectedOrg?.id : selectedOrg;

      // Try organization-scoped list first (best UX). If it returns an empty
      // array, fall back to the global list so the select is never empty.
      const buildList = (payload) => {
        const p = payload;
        return Array.isArray(p) ? p : p?.results || p?.data || [];
      };

      try {
        const DIRECT_BACKEND = (window.REACT_APP_API_URL && window.REACT_APP_API_URL.length>0) ? window.REACT_APP_API_URL : 'https://api.saer.pk';

        if (orgId) {
          try {
            const orgResp = await axios.get(`${API_BASE}/api/cities/?organization=${orgId}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            console.debug('orgResp status, data:', orgResp.status, orgResp.data);
            const orgList = buildList(orgResp.data);
            if (orgResp.status === 304) {
              // Dev server returned 304 Not Modified (likely cached) — try direct backend
              console.warn('Received 304 from dev server; trying direct backend:', DIRECT_BACKEND);
              const direct = await axios.get(`${DIRECT_BACKEND}/api/cities/?organization=${orgId}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
              const dlist = buildList(direct.data);
              if (dlist && dlist.length > 0) {
                setCities(dlist);
                return;
              }
            }
            if (orgList && orgList.length > 0) {
              setCities(orgList);
              return;
            }
            // otherwise fall through to fetch global list
          } catch (errOrg) {
            console.warn('Org-scoped cities fetch failed, will try global:', errOrg?.response?.status || errOrg);
          }
        }

        // global list
        try {
          const response = await axios.get(`${API_BASE}/api/cities/`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          console.debug('global cities response:', response.status, response.data);
          if (response.status === 304) {
            // try direct backend
            const direct = await axios.get(`${DIRECT_BACKEND}/api/cities/`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
            const dlist = buildList(direct.data);
            setCities(dlist);
          } else {
            const list = buildList(response.data);
            setCities(list);
          }
        } catch (err) {
          // propagate to outer catch
          throw err;
        }
      } catch (error) {
        console.error("Error fetching cities:", error);
        if (!error.response) {
          toast.error(`Network error: cannot reach ${API_BASE || window.location.origin}. Is the backend running?`);
        } else {
          toast.error(
            "Failed to load cities: " +
              (error.response?.data?.detail || error.response?.data || "Unknown error.")
          );
        }
      }
    };

    fetchCities();
  }, [selectedOrg, token]);


  // Format date for API (YYYY-MM-DD)
  const formatDateForAPI = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  // Handle hotel details change
  const handleHotelChange = (field, value) => {
    setHotelDetails((prev) => ({ ...prev, [field]: value }));
  };

  // Handle price section change
  const handlePriceSectionChange = (id, field, value) => {
    setPriceSections((prevSections) =>
      prevSections.map((section) =>
        section.id === id ? { ...section, [field]: value } : section
      )
    );
  };

  // Handle contact details change
  const handleContactDetailsChange = (id, field, value) => {
    setContactDetails((prevDetails) =>
      prevDetails.map((detail) =>
        detail.id === id ? { ...detail, [field]: value } : detail
      )
    );
  };

  // Add new bed price to a section
  const addBedPrice = (sectionId, type = null) => {
    setPriceSections(prevSections =>
      prevSections.map(section => {
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
    );
  };

  // Add sharing as a bed type
  const addSharing = (sectionId) => {
    addBedPrice(sectionId, "sharing");
  };

  // Handle bed price change
  const handleBedPriceChange = (sectionId, bedType, value) => {
    setPriceSections(prevSections =>
      prevSections.map(section => {
        if (section.id === sectionId) {
          const updatedBedPrices = section.bed_prices.map(bp =>
            bp.type === bedType ? { ...bp, price: value } : bp
          );
          return { ...section, bed_prices: updatedBedPrices };
        }
        return section;
      })
    );
  };

  // Handle only room price change
  const handleOnlyRoomPriceChange = (sectionId, value) => {
    setPriceSections(prevSections =>
      prevSections.map(section =>
        section.id === sectionId ? { ...section, only_room_price: value } : section
      )
    );
  };

  // Remove bed price
  const removeBedPrice = (sectionId, bedType) => {
    setPriceSections(prevSections =>
      prevSections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            bed_prices: section.bed_prices.filter(bp => bp.type !== bedType)
          };
        }
        return section;
      })
    );
  };

  // Add new contact detail
  const addContactDetail = () => {
    setContactDetails([
      ...contactDetails,
      {
        id: contactDetails.length,
        contact_person: "",
        contact_number: ""
      },
    ]);
  };

  // Remove contact detail
  const removeContactDetail = (id) => {
    if (contactDetails.length > 1) {
      setContactDetails((prevDetails) =>
        prevDetails.filter((detail) => detail.id !== id)
      );
    } else {
      setError("At least one contact detail is required");
    }
  };

  const validateDateContinuity = () => {
    const sortedSections = [...priceSections].sort(
      (a, b) => new Date(a.start_date) - new Date(b.start_date)
    );

    const availabilityStart = new Date(hotelDetails.available_start_date);
    const availabilityEnd = new Date(hotelDetails.available_end_date);

    for (const section of sortedSections) {
      const sectionStart = new Date(section.start_date);
      const sectionEnd = new Date(section.end_date);

      if (sectionStart < availabilityStart || sectionEnd > availabilityEnd) {
        setError("Price section dates must be within availability dates");
        return false;
      }
    }

    for (let i = 0; i < sortedSections.length - 1; i++) {
      const currentEnd = new Date(sortedSections[i].end_date);
      const nextStart = new Date(sortedSections[i + 1].start_date);

      const nextDay = new Date(currentEnd);
      nextDay.setDate(nextDay.getDate() + 1);

      if (nextStart.getTime() !== nextDay.getTime()) {
        setError("Price sections must have continuous dates without gaps");
        return false;
      }
    }

    return true;
  };

  const validateForm = () => {
    // Check hotel details
    if (!hotelDetails.name) {
      setError("Hotel name is required");
      return false;
    }
    if (!hotelDetails.address) {
      setError("Hotel address is required");
      return false;
    }
    if (!hotelDetails.contact_number) {
      setError("Hotel contact number is required");
      return false;
    }
    if (!hotelDetails.city) {
      setError("City is required");
      return false;
    }
    if (!hotelDetails.available_start_date) {
      setError("Available start date is required");
      return false;
    }
    if (!hotelDetails.available_end_date) {
      setError("Available end date is required");
      return false;
    }

    // Check contact details
    for (const detail of contactDetails) {
      if (!detail.contact_person) {
        setError("Contact person name is required for all contacts");
        return false;
      }
      if (!detail.contact_number) {
        setError("Contact number is required for all contacts");
        return false;
      }
    }

    // Check price sections
    for (const section of priceSections) {
      if (!section.start_date) {
        setError("Start date is required for all price sections");
        return false;
      }
      if (!section.end_date) {
        setError("End date is required for all price sections");
        return false;
      }
      if (!section.only_room_price) {
        setError("Only-Room price is required for all price sections");
        return false;
      }
      for (const bedPrice of section.bed_prices) {
        if (!bedPrice.price) {
          setError(`Price is required for ${bedPrice.type === "sharing" ? "Sharing" : bedPrice.type}`);
          return false;
        }
      }
    }

    if (!validateDateContinuity()) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (action = "save") => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      setIsLoading(false);
      return;
    }

    try {
      const orgData = JSON.parse(localStorage.getItem("selectedOrganization"));
      const organizationId = orgData?.id;
      const token = localStorage.getItem("accessToken");

      if (!organizationId || !token) {
        setError("Organization or authentication token missing");
        setIsLoading(false);
        return;
      }

      // Prepare all price entries
      const allPriceEntries = [];

      priceSections.forEach((section) => {
        // Add the Only-Room price entry
        allPriceEntries.push({
          start_date: formatDateForAPI(section.start_date),
          end_date: formatDateForAPI(section.end_date),
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
            start_date: formatDateForAPI(section.start_date),
            end_date: formatDateForAPI(section.end_date),
            room_type: roomType,
            price: parseFloat(bedPrice.price) || 0,
            is_sharing_allowed: isSharing
          });
        });
      });

      // Prepare data according to API structure
      const data = {
        name: hotelDetails.name,
        city: hotelDetails.city,
        address: hotelDetails.address,
        google_location: hotelDetails.google_location || "",
        google_drive_link: hotelDetails.google_drive_link || "",
        contact_number: hotelDetails.contact_number,
        category: hotelDetails.category,
        distance: parseFloat(hotelDetails.distance) || 0,
        is_active: status === "active",
        available_start_date: formatDateForAPI(hotelDetails.available_start_date) || null,
        available_end_date: formatDateForAPI(hotelDetails.available_end_date) || null,
        organization: organizationId,
        prices: allPriceEntries,
        contact_details: contactDetails.map((detail) => ({
          contact_person: detail.contact_person,
          contact_number: detail.contact_number
        }))
      };

      // Make API call
      await axios.post(`${API_BASE}/api/hotels/`, data, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      setSuccess("Hotel added successfully!");

      if (action === "saveAndNew") {
        // Reset form
        setHotelDetails({
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
          organization: organizationId,
        });
        setPriceSections([
          {
            id: 0,
            start_date: "",
            end_date: "",
            only_room_price: "",
            bed_prices: [],
          },
        ]);
        setContactDetails([
          {
            id: 0,
            contact_person: "",
            contact_number: ""
          },
        ]);
      }
      if (action === "saveAndClose") {
        navigate("/hotels");
      }
      setTimeout(() => navigate("/hotels"), 2000);
    } catch (err) {
      console.error("API Error:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Failed to add hotel. Please check your data and try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const addPriceSection = () => {
    if (!hotelDetails.available_start_date || !hotelDetails.available_end_date) {
      setError("Please set availability dates first");
      return;
    }

    const availabilityStart = new Date(hotelDetails.available_start_date);
    const availabilityEnd = new Date(hotelDetails.available_end_date);

    if (priceSections.length === 0) {
      setPriceSections([
        {
          id: 0,
          start_date: hotelDetails.available_start_date,
          end_date: hotelDetails.available_end_date,
          only_room_price: "",
          bed_prices: [],
        },
      ]);
      return;
    }

    const sortedSections = [...priceSections].sort(
      (a, b) => new Date(a.end_date) - new Date(b.end_date)
    );
    const lastSection = sortedSections[sortedSections.length - 1];
    const lastEndDate = new Date(lastSection.end_date);
    const nextDay = new Date(lastEndDate);
    nextDay.setDate(nextDay.getDate() + 1);

    if (nextDay > availabilityEnd) {
      setError("No available dates left in the availability range");
      return;
    }

    setPriceSections([
      ...priceSections,
      {
        id: priceSections.length,
        start_date: nextDay.toISOString().split("T")[0],
        end_date: hotelDetails.available_end_date,
        only_room_price: "",
        bed_prices: [],
      },
    ]);
  };

  const removePriceSection = (id) => {
    if (priceSections.length > 1) {
      setPriceSections((prevSections) =>
        prevSections.filter((section) => section.id !== id)
      );
    } else {
      setError("At least one price section is required");
    }
  };

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
              <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 mb-4">
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

              <div className="bg-white rounded-4 shadow-sm p-3">
                {/* Hotel Details */}
                <div className="p-4">
                  <div className="row">
                    <h4 className="fw-bold mb-3">Add Hotel (Details)</h4>
                    <div className="col-12 d-flex flex-wrap gap-5">
                      <div className="form-group">
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
                          <option value="">Select City</option>
                          {cities.map((city) => (
                            <option key={city.id} value={city.id}>
                              {city.name}
                            </option>
                          ))}
                        </select>
                      </div>
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
                          placeholder="SAIF UL MAJD"
                        />
                      </div>
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
                          placeholder="Hadiya St"
                        />
                      </div>

                      <div>
                        <label htmlFor="" className="">
                          Google Location
                        </label>
                        <input
                          type="text"
                          value={hotelDetails.google_location}
                          onChange={(e) =>
                            handleHotelChange("google_location", e.target.value)
                          }
                          className="form-control rounded shadow-none  px-1 py-2"
                          placeholder="Google URL"
                        />
                      </div>
                      <div>
                        <label htmlFor="" className="">
                          Google Drive Link
                        </label>
                        <input
                          type="text"
                          value={hotelDetails.google_drive_link}
                          onChange={(e) =>
                            handleHotelChange("google_drive_link", e.target.value)
                          }
                          className="form-control rounded shadow-none  px-1 py-2"
                          placeholder="www.google......"
                        />
                      </div>
                      <div>
                        <label htmlFor="" className="">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={hotelDetails.contact_number}
                          onChange={(e) =>
                            handleHotelChange("contact_number", e.target.value)
                          }
                          className="form-control rounded shadow-none  px-1 py-2"
                          required
                          placeholder="+966 5666291"
                        />
                      </div>
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
                      <div>
                        <label htmlFor="" className="">
                          Distance
                        </label>
                        <input
                          type="number"
                          value={hotelDetails.distance}
                          onChange={(e) =>
                            handleHotelChange("distance", e.target.value)
                          }
                          className="form-control rounded shadow-none  px-1 py-2"
                          placeholder="600M"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Details Section */}
                <div className="p-3">
                  <h4 className="fw-bold">Contact Details</h4>
                </div>
                {contactDetails.map((detail, index) => (
                  <div key={detail.id} className="p-3 d-flex flex-wrap gap-5 position-relative">
                    {contactDetails.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger position-absolute"
                        style={{ top: "10px", right: "10px" }}
                        onClick={() => removeContactDetail(detail.id)}
                      >
                        Remove
                      </button>
                    )}
                    <div>
                      <label htmlFor="" className="">
                        Person Name
                      </label>
                      <input
                        type="text"
                        value={detail.contact_person}
                        onChange={(e) =>
                          handleContactDetailsChange(detail.id, "contact_person", e.target.value)
                        }
                        className="form-control rounded shadow-none  px-1 py-2"
                        required
                        placeholder="Contact Person"
                      />
                    </div>
                    <div>
                      <label htmlFor="" className="">
                        Contact Number
                      </label>
                      <input
                        type="text"
                        value={detail.contact_number}
                        onChange={(e) =>
                          handleContactDetailsChange(detail.id, "contact_number", e.target.value)
                        }
                        className="form-control rounded shadow-none  px-1 py-2"
                        required
                        placeholder="Contact Number"
                      />
                    </div>
                  </div>
                ))}
                <div className="p-3 cursor-pointer" onClick={addContactDetail}>
                  <Plus size={40} style={{ color: "#0869FB" }} />
                  <span className="ms-2">Add Contact Detail</span>
                </div>

                {/* Availability Section */}
                <div className="p-3">
                  <h4 className="fw-bold">Availability</h4>
                </div>
                <div className="p-3 d-flex flex-wrap gap-5">
                  <div>
                    <label htmlFor="" className="">
                      Available Start Date
                    </label>
                    <input
                      type="date"
                      value={hotelDetails.available_start_date}
                      onChange={(e) =>
                        handleHotelChange("available_start_date", e.target.value)
                      }
                      className="form-control rounded shadow-none  px-1 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="" className="">
                      Available End Date
                    </label>
                    <input
                      type="date"
                      value={hotelDetails.available_end_date}
                      onChange={(e) =>
                        handleHotelChange("available_end_date", e.target.value)
                      }
                      className="form-control rounded shadow-none  px-1 py-2"
                      required
                    />
                  </div>
                </div>

                {/* Dynamic Hotel Prices Sections */}
                {priceSections.map((section, index) => (
                  <div key={section.id} className="p-4 position-relative">
                    {priceSections.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger position-absolute"
                        style={{ top: "10px", right: "10px" }}
                        onClick={() => removePriceSection(section.id)}
                      >
                        Remove
                      </button>
                    )}

                    <div className="row">
                      <h4 className="fw-bold mb-3">Hotel Price {index + 1}</h4>
                      <div className="col-12 d-flex flex-wrap gap-5">
                        {/* Date fields */}
                        <div>
                          <label htmlFor="" className="">
                            Start Date
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
                            className="form-control rounded shadow-none  px-1 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="" className="">
                            End Date
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
                            className="form-control rounded shadow-none  px-1 py-2"
                            required
                          />
                        </div>

                        {/* Only-Room price */}
                        <div>
                          <label htmlFor="" className="">
                            Only-Room Price
                          </label>
                          <input
                            type="number"
                            value={section.only_room_price}
                            onChange={(e) =>
                              handleOnlyRoomPriceChange(section.id, e.target.value)
                            }
                            className="form-control rounded shadow-none  px-1 py-2"
                            placeholder="Base price"
                            required
                          />
                        </div>

                        {/* Bed prices (including sharing if added) */}
                        {section.bed_prices.map((bedPrice) => {
                          const bedTypeLabel = bedPrice.type === "sharing"
                            ? "Sharing"
                            : bedTypes.find(bt => bt.id === bedPrice.type)?.label || bedPrice.type;

                          return (
                            <label key={bedPrice.type} className="rounded mb-3 position-relative">
                              <button
                                type="button"
                                className="btn btn-danger position-absolute"
                                style={{ top: "-10px", right: "-10px", padding: "0.25rem 0.5rem" }}
                                onClick={() => removeBedPrice(section.id, bedPrice.type)}
                              >
                                ×
                              </button>
                              <label htmlFor="">
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
                                className="form-control rounded shadow-none  px-1 py-2"
                                placeholder="Price"
                                required
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
                  <span className="ms-2">Add Price Section</span>
                </div>

                {/* Status radio buttons */}
                <div className="d-flex gap-5 p-4">
                  <div className="form-check d-flex align-items-center">
                    <input
                      className="form-check-input border border-black me-2"
                      type="radio"
                      name="status"
                      id="active"
                      checked={status === "active"}
                      onChange={() => setStatus("active")}
                      style={{ width: "1.3rem", height: "1.3rem" }}
                    />
                    <label className="form-check-label" htmlFor="active">
                      Active
                    </label>
                  </div>

                  <div className="form-check d-flex align-items-center">
                    <input
                      className="form-check-input border border-black me-2"
                      type="radio"
                      name="status"
                      id="inactive"
                      checked={status === "inactive"}
                      onChange={() => setStatus("inactive")}
                      style={{ width: "1.3rem", height: "1.3rem" }}
                    />
                    <label className="form-check-label" htmlFor="inactive">
                      Inactive
                    </label>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="d-flex flex-wrap gap-2 justify-content-end">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSubmit("save")}
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save"}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSubmit("saveAndNew")}
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save and New"}
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSubmit("saveAndClose")}
                    disabled={isLoading}
                  >
                    {isLoading ? "Saving..." : "Save and close"}
                  </button>
                  <Link
                    to={'/hotels'}>
                    <button className="btn btn-outline-secondary">Cancel</button>
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

export default AddHotels;