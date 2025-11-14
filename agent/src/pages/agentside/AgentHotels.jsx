import React, { useState, useEffect, useRef } from "react";
import AgentSidebar from "../../components/AgentSidebar";
import AgentHeader from "../../components/AgentHeader";
import { Search } from "lucide-react";
import { Gear } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import AdminFooter from "../../components/AdminFooter";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "react-toastify";

const HotelRowSkeleton = () => {
  return (
    <tr>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "100%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "80%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "100%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "90%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "80%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "70%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "70%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "70%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "70%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "70%", borderRadius: "4px" }}></div>
      </td>
      <td>
        <div className="shimmer" style={{ height: "20px", width: "70%", borderRadius: "4px" }}></div>
      </td>
    </tr>
  );
};

const Hotels = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const [makkahHotels, setMakkahHotels] = useState([]);
  const [madinahHotels, setMadinahHotels] = useState([]);

  // Refs for the tables
  const makkahTableRef = useRef(null);
  const madinahTableRef = useRef(null);

  // Format date function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    const date = new Date(dateString + "T00:00:00Z");

    const day = date.getUTCDate();
    const month = date.toLocaleString("en-US", {
      month: "long",
      timeZone: "UTC",
    });
    const year = date.getUTCFullYear();

    return `${day} ${month} ${year}`;
  };

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("agentAccessToken");
      if (!token) throw new Error("No access token found");

      const decoded = jwtDecode(token);
      const userId = decoded.user_id;
      if (!userId) throw new Error("User ID not found in token");

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      // 1. Fetch user details
      const userResponse = await axios.get(
        `http://127.0.0.1:8000/api/users/${userId}/`,
        config
      );

      // 2. Get organization ID(s) - handles both single and multiple orgs
      const orgDetails = userResponse.data.organization_details || [];
      const organizationIds = orgDetails.map((org) => org.id);

      localStorage.setItem(
        "agentOrganization",
        JSON.stringify({
          ids: organizationIds,
          names: orgDetails.map((org) => org.name),
          timestamp: new Date().getTime(),
        })
      );

      if (organizationIds.length === 0) {
        throw new Error("User has no organizations assigned");
      }

      // 3. Fetch hotels - different approaches based on number of orgs
      let allHotels = [];

      if (organizationIds.length === 1) {
        // Single organization - simple request
        const response = await axios.get(`http://127.0.0.1:8000/api/hotels/`, {
          ...config,
          params: {
            organization: organizationIds[0],
          },
        });
        allHotels = response.data;
      } else {
        // Multiple organizations - fetch in parallel
        const requests = organizationIds.map(orgId =>
          axios.get(`http://127.0.0.1:8000/api/hotels/`, {
            ...config,
            params: { organization: orgId },
          })
        );
        const responses = await Promise.all(requests);
        allHotels = responses.flatMap(response => response.data);
      }

      const normalize = (city) => city?.toString().trim().toLowerCase() || "";

      // Filter hotels by city
      const makkah = allHotels.filter((hotel) => normalize(hotel.city) === "makkah");
      const madinah = allHotels.filter((hotel) => normalize(hotel.city) === "madina");

      setMakkahHotels(makkah);
      setMadinahHotels(madinah);
      setHotels(allHotels);
      setTotalRecords(allHotels.length);
    } catch (error) {
      console.error("Error fetching hotels:", error);
      setError(error.response?.data?.detail || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handlePageChange = (page) => setCurrentPage(page);

  const filteredHotels = hotels.filter(
    (hotel) =>
      hotel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      hotel.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredHotels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHotels = filteredHotels.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const renderSkeletonRows = () => {
    return Array.from({ length: itemsPerPage }).map((_, index) => (
      <HotelRowSkeleton key={index} />
    ));
  };

  const getPricesByRoomType = (prices, startDate, endDate) => {
    if (!prices || prices.length === 0) return {};

    const priceMap = {
      'Only-Room': null,
      'Sharing': null,
      'Double Bed': null,
      'Triple Bed': null,
      'Quad Bed': null,
      'Quint Bed': null
    };

    prices.forEach(price => {
      if (price.room_type in priceMap &&
        price.start_date === startDate &&
        price.end_date === endDate) {
        priceMap[price.room_type] = price;
      }
    });

    return priceMap;
  };

  // Function to export hotels as PDF
  const exportHotelsToPDF = async () => {
    try {
      toast.info("Generating PDF...", { autoClose: 2000 });
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      
      // Add title to the PDF
      pdf.setFontSize(18);
      pdf.text("Hotels List", pageWidth / 2, 15, { align: 'center' });
      pdf.setFontSize(12);
      pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, 22, { align: 'center' });
      
      let currentY = 30;
      
      // Process Makkah hotels table
      if (makkahHotels.length > 0) {
        pdf.setFontSize(16);
        // pdf.text("Makkah Hotels", margin, currentY);
        currentY += 10;
        
        const makkahCanvas = await html2canvas(makkahTableRef.current, {
          scale: 1.5,
          useCORS: true,
          logging: false,
        });
        
        const makkahImgData = makkahCanvas.toDataURL('image/jpeg', 0.9);
        const imgWidth = contentWidth;
        const imgHeight = (makkahCanvas.height * imgWidth) / makkahCanvas.width;
        
        // Add new page if needed
        if (currentY + imgHeight > pdf.internal.pageSize.getHeight() - 20) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.addImage(makkahImgData, 'JPEG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 15;
      }
      
      // Process Madinah hotels table
      if (madinahHotels.length > 0) {
        // Add new page if needed
        if (currentY > pdf.internal.pageSize.getHeight() - 50) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.setFontSize(16);
        // pdf.text("Madinah Hotels", margin, currentY);
        currentY += 10;
        
        const madinahCanvas = await html2canvas(madinahTableRef.current, {
          scale: 1.5,
          useCORS: true,
          logging: false,
        });
        
        const madinahImgData = madinahCanvas.toDataURL('image/jpeg', 0.9);
        const imgWidth = contentWidth;
        const imgHeight = (madinahCanvas.height * imgWidth) / madinahCanvas.width;
        
        // Add new page if needed
        if (currentY + imgHeight > pdf.internal.pageSize.getHeight() - 20) {
          pdf.addPage();
          currentY = margin;
        }
        
        pdf.addImage(madinahImgData, 'JPEG', margin, currentY, imgWidth, imgHeight);
      }
      
      // Save the PDF
      pdf.save(`hotels-list-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  // Modified renderHotelTable function to handle date ranges with oldest first
  const renderHotelTable = (title, data, tableRef) => (
    <div className="mb-5" ref={tableRef}>
      <h4 className="text-center fw-bold">{title} Hotels</h4>
      <div className="bg-white rounded shadow-sm">
        <div className="table-responsive">
          <table className="table mb-0">
            <thead className="table-light">
              <tr>
                <th>Hotel Name</th>
                <th>Category</th>
                <th>Address</th>
                <th>Available</th>
                <th>Price Dates</th>
                <th>Only Room</th>
                <th>Sharing</th>
                <th>Double</th>
                <th>Triple</th>
                <th>Quad</th>
                <th>Quint</th>
              </tr>
            </thead>
            <tbody className="small">
              {loading ? (
                <>
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <HotelRowSkeleton key={idx} />
                  ))}
                </>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan="12" className="text-center">
                    No hotels found
                  </td>
                </tr>
              ) : (
                data.flatMap((hotel) => {
                  const priceGroups = getAllPriceObjects(hotel.prices);

                  // Sort price groups with oldest dates first
                  const sortedGroups = [...priceGroups].sort((a, b) =>
                    new Date(a[0].start_date) - new Date(b[0].start_date)
                  );

                  return sortedGroups.map((group, groupIndex) => {
                    const isOldestGroup = groupIndex === 0;
                    const startDate = group[0]?.start_date;
                    const endDate = group[0]?.end_date;
                    const pricesByType = getPricesByRoomType(hotel.prices, startDate, endDate);

                    return (
                      <tr key={`${hotel.id}-${groupIndex}`}>
                        {groupIndex === 0 ? (
                          <>
                            <td rowSpan={sortedGroups.length}>
                              <strong>{hotel.name}</strong>
                              <br />
                              <small className="text-muted">{hotel.distance}M</small>
                            </td>
                            <td rowSpan={sortedGroups.length}>{hotel.category}</td>
                            <td rowSpan={sortedGroups.length} style={{ color: "#1B78CE" }}>
                              {hotel.address}
                            </td>
                            <td rowSpan={sortedGroups.length}>
                              {formatDate(hotel.available_start_date)} -{" "}
                              {formatDate(hotel.available_end_date)}
                            </td>
                          </>
                        ) : null}

                        <td className={`small ${!isOldestGroup ? "text-danger " : ""}`}>
                          {formatDate(startDate)} - {formatDate(endDate)}
                        </td>
                        <td className={!isOldestGroup ? "text-danger " : ""}>
                          {pricesByType['Only-Room'] ? `SAR ${pricesByType['Only-Room'].price}` : 'N/A'}
                        </td>

                        <td className={!isOldestGroup ? "text-danger " : ""}>
                          {pricesByType['Sharing'] ? `SAR ${pricesByType['Sharing'].price}` : 'N/A'}
                        </td>
                        <td className={!isOldestGroup ? "text-danger " : ""}>
                          {pricesByType['Double Bed'] ? `SAR ${pricesByType['Double Bed'].price}` : 'N/A'}
                        </td>
                        <td className={!isOldestGroup ? "text-danger " : ""}>
                          {pricesByType['Triple Bed'] ? `SAR ${pricesByType['Triple Bed'].price}` : 'N/A'}
                        </td>
                        <td className={!isOldestGroup ? "text-danger " : ""}>
                          {pricesByType['Quad Bed'] ? `SAR ${pricesByType['Quad Bed'].price}` : 'N/A'}
                        </td>
                        <td className={!isOldestGroup ? "text-danger " : ""}>
                          {pricesByType['Quint Bed'] ? `SAR ${pricesByType['Quint Bed'].price}` : 'N/A'}
                        </td>
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Helper function to group prices by date ranges (oldest first)
  const getAllPriceObjects = (prices) => {
    if (!prices || prices.length === 0) return [];

    // Group prices by their date ranges
    const groupedByDate = prices.reduce((acc, price) => {
      const dateKey = `${price.start_date}-${price.end_date}`;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(price);
      return acc;
    }, {});

    // Convert to array of grouped prices sorted by date (oldest first)
    return Object.values(groupedByDate).sort((a, b) =>
      new Date(a[0].start_date) - new Date(b[0].start_date)
    );
  };

  return (
    <div
      className=""
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      <style>{`
  .shimmer {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }

  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
`}</style>
      <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
      <div className="row g-0">
        {/* Sidebar */}
        <div className="col-12 col-lg-2">
          <AgentSidebar />
        </div>
        {/* Main Content */}
        <div className="col-12 col-lg-10 ps-lg-4">
          <div className="container">
            <AgentHeader />
            <div className="px-3 mt-3 px-lg-4">
              {/* Header Controls */}
              <div className="row mb-4 align-items-center justify-content-end">
                <div className="col-lg-9 col-md-8 d-flex align-items-center flex-wrap gap-2 justify-content-md-end">
                  {/* Search Bar */}
                  <div className="input-group" style={{ maxWidth: "300px" }}>
                    <span className="input-group-text">
                      <Search />
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search name, address, etc"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="d-flex">
                    <button className="btn" id="btn" onClick={exportHotelsToPDF}>Export</button>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="alert alert-danger mb-4">
                  {error}
                </div>
              )}

              {/* Tables */}
              {renderHotelTable("Makkah", makkahHotels, makkahTableRef)}
              {renderHotelTable("Madina", madinahHotels, madinahTableRef)}

              <div className="mt-3">
                <AdminFooter />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Hotels;