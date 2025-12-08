import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const ShimmerLoader = ({ count = 1, height = "20px", width = "100%", className = "" }) => {
  return (
    <div className={`shimmer-container ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="shimmer-line"
          style={{ height, width }}
        ></div>
      ))}
    </div>
  );
};

const UmrahPackageCards = () => {

  const navigate = useNavigate();

  const [packageData, setPackageData] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [airlines, setAirlines] = useState([]);

  const token = localStorage.getItem("accessToken");
  const selectedOrganization = JSON.parse(
    localStorage.getItem("selectedOrganization")
  );
  const organizationId = selectedOrganization?.id;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [packageRes, hotelsRes, ticketsRes, airlinesRes] =
          await Promise.all([
            axios.get("http://127.0.0.1:8000/api/umrah-packages/", {
              params: { organization: organizationId },
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
            axios.get("http://127.0.0.1:8000/api/hotels/", {
              params: { organization: organizationId },
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
            axios.get("http://127.0.0.1:8000/api/tickets/", {
              params: { organization: organizationId },
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
            axios.get("http://127.0.0.1:8000/api/airlines/", {
              params: { organization: organizationId },
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
          ]);

        const packages = packageRes.data.filter(
          (pkg) => pkg.organization === organizationId
        );
        setPackageData(packages);
        setHotels(hotelsRes.data);
        setTickets(ticketsRes.data);
        setAirlines(airlinesRes.data);
      } catch (err) {
        console.error("API Error", err);
      }
    };

    fetchData();
  }, [token, organizationId]);

  const formatDateTime = (dateStr) => {
    const date = new Date(dateStr);
    const d = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const t = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${d} ${t}`;
  };

  if (!packageData.length) {
    return (
      <div className="p-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="row p-3 rounded-4 mb-4 border">
            {/* Left Section Shimmer */}
            <div className="col-lg-8 col-md-12 mb-4">
              <div className="card border-0 h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <ShimmerLoader width="200px" height="30px" />
                    <ShimmerLoader width="100px" height="100px" className="rounded-circle" />
                  </div>

                  {/* Hotel Info Row Shimmer */}
                  <div className="row mb-4">
                    <div className="col-md-9">
                      <div className="row">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="col-6 col-sm-4 col-md-3 mb-2">
                            <ShimmerLoader width="80px" height="15px" />
                            <ShimmerLoader width="120px" height="20px" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="col-md-3 text-center">
                      <ShimmerLoader width="80px" height="30px" className="mx-auto" />
                      <ShimmerLoader width="100px" height="20px" className="mx-auto" />
                    </div>
                  </div>

                  {/* Pricing Section Shimmer */}
                  <div className="row mb-3 text-center">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="col-6 col-sm-4 col-md-2 mb-3">
                        <ShimmerLoader width="70px" height="20px" className="mx-auto" />
                        <ShimmerLoader width="100px" height="25px" className="mx-auto" />
                        <ShimmerLoader width="60px" height="15px" className="mx-auto" />
                      </div>
                    ))}
                  </div>

                  {/* Buttons Shimmer */}
                  <div className="d-flex flex-wrap gap-4">
                    <ShimmerLoader width="100px" height="40px" />
                    <ShimmerLoader width="100px" height="40px" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Section Shimmer */}
            <div className="col-lg-4 col-md-12">
              <div className="shimmer-card rounded-4 h-100"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const handleDeletePackage = async (packageId) => {
    if (!window.confirm("Are you sure you want to delete this package?"))
      return;

    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/umrah-packages/${packageId}/`,
        {
          params: { organization: organizationId },
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setPackageData((prev) => prev.filter((pkg) => pkg.id !== packageId));
      toast.success("Package deleted successfully!");
    } catch (error) {
      console.error("Error deleting package:", error);
      toast.error("Failed to delete package.");
    }
  };

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
    
    .shimmer-card {
      height: 200px;
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
  `}
      </style>
      <div className="p-3">
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        {packageData.map((pkg, index) => {
          const hotelDetails = pkg?.hotel_details?.map((hotelEntry) => {
            const hotelInfo = hotels.find(
              (h) => h.id === hotelEntry.hotel_info?.id
            );
            return {
              city: hotelInfo?.city || "N/A",
              name: hotelInfo?.name || "N/A",
              nights: hotelEntry?.number_of_nights || 0,
              prices: hotelInfo?.prices?.[0] || {},
            };
          });

          const ticketInfo = pkg?.ticket_details?.[0]?.ticket_info;
          const tripDetails = ticketInfo?.trip_details || [];

          // Calculate sharing hotel cost
          const sharingHotelTotal = pkg?.hotel_details?.reduce((sum, hotel) => {
            const perNight = hotel.sharing_bed_price || 0;
            const nights = hotel.number_of_nights || 0;
            return sum + perNight * nights;
          }, 0);

          // Calculate total sharing
          const sharingPrices =
            (pkg.adault_visa_price || 0) +
            (pkg.transport_price || 0) +
            (ticketInfo?.adult_price || 0) +
            (pkg.food_price || 0) +
            (pkg.makkah_ziyarat_price || 0) +
            (pkg.madinah_ziyarat_price || 0);

          const totalSharing = sharingHotelTotal + sharingPrices;

          // Calculate total QUINT price
          const quintPrices =
            (pkg.adault_visa_price || 0) +
            (pkg.transport_price || 0) +
            (ticketInfo?.adult_price || 0) +
            (pkg.food_price || 0) +
            (pkg.makkah_ziyarat_price || 0) +
            (pkg.madinah_ziyarat_price || 0);

          const quintHotels = pkg?.hotel_details?.reduce((sum, hotel) => {
            const perNight =
              hotel.quaint_bed_price || hotel.quaint_bed_price || 0;
            const nights = hotel.number_of_nights || 0;
            return sum + perNight * nights;
          }, 0);

          const totalQuint = quintPrices + quintHotels;

          // Calculate total QUAD price
          const quadPrices =
            (pkg.adault_visa_price || 0) +
            (pkg.transport_price || 0) +
            (ticketInfo?.adult_price || 0) +
            (pkg.food_price || 0) +
            (pkg.makkah_ziyarat_price || 0) +
            (pkg.madinah_ziyarat_price || 0);

          const quadHotels = pkg?.hotel_details?.reduce((sum, hotel) => {
            const perNight = hotel.quad_bed_price || 0;
            const nights = hotel.number_of_nights || 0;
            return sum + perNight * nights;
          }, 0);

          const totalQuad = quadPrices + quadHotels;

          // TRIPLE BED calculation
          const triplePrices =
            (pkg.adault_visa_price || 0) +
            (pkg.transport_price || 0) +
            (ticketInfo?.adult_price || 0) +
            (pkg.food_price || 0) +
            (pkg.makkah_ziyarat_price || 0) +
            (pkg.madinah_ziyarat_price || 0);

          const tripleHotels = pkg?.hotel_details?.reduce((sum, hotel) => {
            const perNight = hotel.triple_bed_price || 0;
            const nights = hotel.number_of_nights || 0;
            return sum + perNight * nights;
          }, 0);

          const totalTriple = triplePrices + tripleHotels;

          // DOUBLE BED calculation
          const doublePrices =
            (pkg.adault_visa_price || 0) +
            (pkg.transport_price || 0) +
            (ticketInfo?.adult_price || 0) +
            (pkg.food_price || 0) +
            (pkg.makkah_ziyarat_price || 0) +
            (pkg.madinah_ziyarat_price || 0);

          const doubleHotels = pkg?.hotel_details?.reduce((sum, hotel) => {
            const perNight = hotel.double_bed_price || 0;
            const nights = hotel.number_of_nights || 0;
            return sum + perNight * nights;
          }, 0);

          const totalDouble = doublePrices + doubleHotels;

          const infantPrices =
            (ticketInfo?.infant_price || 0)

          const infantHotels = pkg?.infant_visa_price;

          const totalinfant = infantPrices + infantHotels;

          const childPrices =
            (pkg?.adault_visa_price || 0) -
            (pkg?.child_visa_price || 0);

          const flightFrom = tripDetails[0];
          const flightTo = tripDetails[1];
          const airline = airlines.find((a) => a.id === ticketInfo?.airline);

          // Moved this here 👇
          const matchedAirline = airlines.find(
            (a) => a.code?.toLowerCase() === airline?.code?.toLowerCase()
          );

          console.log(ticketInfo?.adult_price);

          return (
            <>
              <div key={index} className="row p-3 rounded-4 mb-4 border">
                <div className="col-lg-8 col-md-12 mb-4">
                  <div className="card border-0 h-100" >
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center">
                        <h4 className="card-title mb-4 fw-bold">
                          {pkg?.title || "Umrah Package"}
                        </h4>
                        {matchedAirline?.logo && (
                          <img
                            src={matchedAirline.logo}
                            alt={matchedAirline.code}
                            style={{
                              height: "100px",
                              width: "100px",
                              objectFit: "contain",
                            }}
                          />
                        )}
                      </div>
                      {/* Hotel Info Row */}
                      <div className="row mb-4">
                        <div className="col-md-9">
                          <div className="row text-muted small">
                            <div className="col-6 col-sm-4 col-md-3 mb-2">
                              <p className="fw-bold mb-1 small">MAKKAH HOTEL:</p>
                              <div>{hotelDetails?.[0]?.name || "N/A"}</div>
                            </div>
                            <div className="col-6 col-sm-4 col-md-3 mb-2">
                              <p className="fw-bold mb-1 small">MADINA HOTEL:</p>
                              <div>{hotelDetails?.[1]?.name || "N/A"}</div>
                            </div>
                            {/* <div className="col-6 col-sm-4 col-md-2 mb-2">
                          <p className="fw-bold mb-1 small">AIRLINE:</p>
                          <div>{airline?.name || "N/A"} / (DIRECT)</div>
                        </div> */}
                            <div className="col-6 col-sm-4 col-md-2 mb-2">
                              <p className="fw-bold mb-1 small">ZAYARAT:</p>
                              <div>
                                {pkg?.makkah_ziyarat_price ||
                                  pkg?.madinah_ziyarat_price
                                  ? "YES"
                                  : "N/A"}
                              </div>
                            </div>
                            <div className="col-6 col-sm-4 col-md-2 mb-2">
                              <p className="fw-bold mb-1 small">FOOD:</p>
                              <div>
                                {pkg?.food_price > 0 ? "INCLUDED" : "N/A"}
                              </div>
                            </div>
                            <div className="col-6 col-sm-4 col-md-2 mb-2">
                              <p className="fw-bold mb-1 small">RULES:</p>
                              <div>{pkg?.rules || "N/A"}</div>
                            </div>
                          </div>
                        </div>

                        <div className="col-md-3 text-center d-flex flex-column justify-content-center align-items-center">
                          <h3 className="mb-1">{pkg?.total_seats || "0"}</h3>
                          <h5 className="text-danger">Seats Left</h5>
                        </div>
                      </div>

                      {/* Pricing Section */}
                      <div className="row mb-3 text-center text-dark">
                        <div className="col-6 col-sm-4 col-md-2 mb-3">
                          <strong className="d-block">SHARING</strong>
                          <div className="fw-bold text-primary">
                            Rs. {totalSharing.toLocaleString()}/.
                          </div>
                          <small className="text-muted">per adult</small>
                        </div>

                        <div className="col-6 col-sm-4 col-md-2 mb-3">
                          <strong className="d-block">QUINT</strong>
                          <div className="fw-bold text-primary">
                            Rs. {totalQuint.toLocaleString()}/.
                          </div>
                          <small className="text-muted">per adult</small>
                        </div>

                        <div className="col-6 col-sm-4 col-md-2 mb-3">
                          <strong className="d-block">QUAD BED</strong>
                          <div className="fw-bold text-primary">
                            Rs. {totalQuad.toLocaleString()}/.
                          </div>
                          <small className="text-muted">per adult</small>
                        </div>

                        <div className="col-6 col-sm-4 col-md-2 mb-3">
                          <strong className="d-block">TRIPLE BED</strong>
                          <div className="fw-bold text-primary">
                            Rs. {totalTriple.toLocaleString()}/.
                          </div>
                          <small className="text-muted">per adult</small>
                        </div>

                        <div className="col-6 col-sm-4 col-md-2 mb-3">
                          <strong className="d-block">DOUBLE BED</strong>
                          <div className="fw-bold text-primary">
                            Rs. {totalDouble.toLocaleString()}/.
                          </div>
                          <small className="text-muted">per adult</small>
                        </div>

                        <div className="col-6 col-sm-4 col-md-2 mb-3">
                          <strong className="d-block">PER INFANT</strong>
                          <div className="fw-bold text-primary">
                            Rs. {totalinfant.toLocaleString()}/.
                          </div>
                          <small className="text-muted">per PEX</small>
                        </div>
                        {/* <div className="col-6 col-sm-4 col-md-2 mb-3">
                        <strong className="d-block">PER CHILD</strong>
                        <div className="fw-bold text-primary">
                          Rs. {pkg?.child_visa_price || 0}/
                        </div>
                      </div> */}

                        <div className="col-12 mt-2">
                          <small className="text-muted">
                            Per Child <span className="text-primary fw-bold">Rs {childPrices}/.</span> discount.
                          </small>
                        </div>
                      </div>

                      {/* Buttons */}
                      <div className="d-flex flex-wrap gap-4">
                        <button
                          className="btn flex-fill text-white"
                          style={{ background: "#1B78CE" }}
                          onClick={() =>
                            navigate(`/admin/packages/edit/${pkg.id}`)
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="btn text-white"
                          style={{ background: "#1B78CE" }}
                          onClick={() => handleDeletePackage(pkg.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section (Flight + Summary) */}
                <div className="col-lg-4 col-md-12">
                  <div
                    className="card border-0 rounded-4 h-100"
                    style={{ background: "#F7F8F8" }}
                  >
                    <div className="m-3 ps-3 pt-2 pb-2">
                      <h5 className="fw-bold mb-2 text-dark">Umrah Package</h5>

                      <div className="mb-1">
                        <h6 className="fw-bold mb-1 text-muted fst-italic">
                          Hotels:
                        </h6>
                        <div className="small text-dark">
                          {hotelDetails?.map((h, i) => (
                            <div key={i}>
                              {h.nights} Nights at {h.city} ({h.name})
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mb-1">
                        <h6 className="fw-bold mb-1 text-muted fst-italic">
                          Umrah Visa:
                        </h6>
                        <div className="small text-dark">
                          {pkg?.adault_visa_price > 0 ? "INCLUDED" : "N/A"}
                        </div>
                      </div>

                      <div className="mb-2">
                        <h6 className="fw-bold mb-1 text-muted fst-italic">
                          Transport:
                        </h6>
                        <div className="small text-dark">
                          {pkg?.transport_details
                            ?.map((t) => t.transport_sector_info?.name)
                            .join(" - ") || "N/A"}
                        </div>
                      </div>

                      <div className="mb-1">
                        <h6 className="fw-bold mb-1 text-muted fst-italic">
                          Flight:
                        </h6>
                        <div className="small text-dark">
                          <div>
                            <strong>Travel Date:</strong> <br />
                            {flightFrom?.departure_date_time &&
                              flightFrom?.arrival_date_time ? (
                              <>
                                {airline?.code || "XX"} {ticketInfo?.pnr} -{" "}
                                {formatDateTime(flightFrom?.departure_date_time)}{" "}
                                - {formatDateTime(flightFrom?.arrival_date_time)}
                              </>
                            ) : (
                              <>N/A</>
                            )}
                          </div>
                          <div>
                            <strong>Return Date:</strong> <br />
                            {flightTo?.departure_date_time &&
                              flightTo?.arrival_date_time ? (
                              <>
                                {airline?.code || "XX"} {ticketInfo?.pnr} -{" "}
                                {formatDateTime(flightTo?.departure_date_time)} -{" "}
                                {formatDateTime(flightTo?.arrival_date_time)}
                              </>
                            ) : (
                              <>N/A</>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mb-1">
                        <h6 className="fw-bold mb-1 text-muted fst-italic">
                          ZAYARAT:
                        </h6>
                        <div className="small text-dark">
                          {pkg?.makkah_ziyarat_price || pkg?.madinah_ziyarat_price
                            ? "YES"
                            : "N/A"}
                        </div>
                      </div>

                      <div className="mb-1">
                        <h6 className="fw-bold mb-1 text-muted fst-italic">
                          FOOD:
                        </h6>
                        <div className="small text-dark">
                          {pkg?.food_price > 0 ? "INCLUDED" : "N/A"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          );
        })}
      </div>
    </>
  );
};

export default UmrahPackageCards;
