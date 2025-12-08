import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { toast } from "react-toastify";

const UmrahPackageCard = () => {
  const navigate = useNavigate();

  const [packageData, setPackageData] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [airlines, setAirlines] = useState([]);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [showValidationError, setShowValidationError] = useState(false);
  const token = localStorage.getItem("agentAccessToken");
  // const selectedOrganization = JSON.parse(

  // );
  // const organizationId = localStorage.getItem("agentOrganization");

  const getOrgId = () => {
    const agentOrg = localStorage.getItem("agentOrganization");
    if (!agentOrg) return null;

    const orgData = JSON.parse(agentOrg);
    return orgData.ids[0]; // Get the first organization ID
  };

  const orgId = getOrgId();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [packageRes, hotelsRes, ticketsRes, airlinesRes] =
          await Promise.all([
            axios.get(
              `http://127.0.0.1:8000/api/umrah-packages/?organization=${orgId}`,
              {
                // params: { organization: organizationId },
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            ),
            axios.get("http://127.0.0.1:8000/api/hotels/", {
              params: { organization: orgId },
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
            axios.get("http://127.0.0.1:8000/api/tickets/", {
              params: { organization: orgId },
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
            axios.get("http://127.0.0.1:8000/api/airlines/", {
              params: { organization: orgId },
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }),
          ]);

        const packages = packageRes.data.filter(
          (pkg) => pkg.organization === orgId
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
  }, [token, orgId]);

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

  if (!packageData.length) return <div>Loading Umrah Packages...</div>;

  return (
    <div className="container-fluid p-3">
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

        const infantPrices = ticketInfo?.infant_price || 0;

        const infantHotels = pkg?.infant_visa_price;

        const totalinfant = infantPrices + infantHotels;

        const childPrices =
          (pkg?.adault_visa_price || 0) - (pkg?.child_visa_price || 0);

        const flightFrom = tripDetails[0];
        const flightTo = tripDetails[1];
        const airline = airlines.find((a) => a.id === ticketInfo?.airline);

        // Moved this here 👇
        const matchedAirline = airlines.find(
          (a) => a.code?.toLowerCase() === airline?.code?.toLowerCase()
        );

        const calculatePackagePrice = (pkg, roomType) => {
          const ticketInfo = pkg?.ticket_details?.[0]?.ticket_info;

          // Base price components (same for all room types)
          const basePrice =
            (pkg.adault_visa_price || 0) +
            (pkg.transport_price || 0) +
            (ticketInfo?.adult_price || 0) +
            (pkg.food_price || 0) +
            (pkg.makkah_ziyarat_price || 0) +
            (pkg.madinah_ziyarat_price || 0);

          // Calculate hotel cost based on room type
          let hotelCost = 0;

          switch (roomType) {
            case 'sharing':
              hotelCost = pkg?.hotel_details?.reduce((sum, hotel) => {
                return sum + (hotel.sharing_bed_price || 0) * (hotel.number_of_nights || 0);
              }, 0) || 0;
              break;
            case 'quint':
              hotelCost = pkg?.hotel_details?.reduce((sum, hotel) => {
                return sum + (hotel.quaint_bed_price || 0) * (hotel.number_of_nights || 0);
              }, 0) || 0;
              break;
            case 'quad':
              hotelCost = pkg?.hotel_details?.reduce((sum, hotel) => {
                return sum + (hotel.quad_bed_price || 0) * (hotel.number_of_nights || 0);
              }, 0) || 0;
              break;
            case 'triple':
              hotelCost = pkg?.hotel_details?.reduce((sum, hotel) => {
                return sum + (hotel.triple_bed_price || 0) * (hotel.number_of_nights || 0);
              }, 0) || 0;
              break;
            case 'double':
              hotelCost = pkg?.hotel_details?.reduce((sum, hotel) => {
                return sum + (hotel.double_bed_price || 0) * (hotel.number_of_nights || 0);
              }, 0) || 0;
              break;
            default:
              hotelCost = 0;
          }

          return basePrice + hotelCost;
        };

        return (
          <>
            <div key={index} className="row bg-white p-3 rounded-4 mb-4">
              <div className="col-lg-8 col-md-12 mb-4">
                <div className="card border-0 h-100">
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
                      {pkg.is_sharing_active && (
                        <div className="col-6 col-sm-4 col-md-2 mb-3">
                          <strong className="d-block">SHARING</strong>
                          <div className="fw-bold text-primary">
                            Rs. {totalSharing.toLocaleString()}/
                          </div>
                          <small className="text-muted">per adult</small>
                        </div>
                      )}

                      {pkg.is_quaint_active && (
                        <div className="col-6 col-sm-4 col-md-2 mb-3">
                          <strong className="d-block">QUINT</strong>
                          <div className="fw-bold text-primary">
                            Rs. {totalQuint.toLocaleString()}/
                          </div>
                          <small className="text-muted">per adult</small>
                        </div>
                      )}

                      {pkg.is_quad_active && (
                        <div className="col-6 col-sm-4 col-md-2 mb-3">
                          <strong className="d-block">QUAD BED</strong>
                          <div className="fw-bold text-primary">
                            Rs. {totalQuad.toLocaleString()}/
                          </div>
                          <small className="text-muted">per adult</small>
                        </div>
                      )}

                      {pkg.is_triple_active && (
                        <div className="col-6 col-sm-4 col-md-2 mb-3">
                          <strong className="d-block">TRIPLE BED</strong>
                          <div className="fw-bold text-primary">
                            Rs. {totalTriple.toLocaleString()}/
                          </div>
                          <small className="text-muted">per adult</small>
                        </div>
                      )}

                      {pkg.is_double_active && (
                        <div className="col-6 col-sm-4 col-md-2 mb-3">
                          <strong className="d-block">DOUBLE BED</strong>
                          <div className="fw-bold text-primary">
                            Rs. {totalDouble.toLocaleString()}/
                          </div>
                          <small className="text-muted">per adult</small>
                        </div>
                      )}

                      <div className="col-6 col-sm-4 col-md-2 mb-3">
                        <strong className="d-block">PER INFANT</strong>
                        <div className="fw-bold text-primary">
                          Rs. {totalinfant.toLocaleString()}/
                        </div>
                        <small className="text-muted">per PEX</small>
                      </div>

                      <div className="col-12 mt-2">
                        <small className="text-muted">
                          Per Child{" "}
                          <span className="text-primary fw-bold">
                            Rs {childPrices}/.
                          </span>{" "}
                          discount.
                        </small>
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="d-flex flex-wrap gap-4">
                      <button
                        className="btn flex-fill text-white"
                        style={{ background: "#1B78CE" }}
                        onClick={() => {
                          setSelectedPackage(pkg);
                          setShowBookingModal(true);
                        }}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Modal */}
              {showBookingModal && selectedPackage && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.1' }}>
                  <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Select Room Type for {selectedPackage.title}</h5>
                        <button
                          type="button"
                          className="btn-close btn-close-white"
                          onClick={() => {
                            setShowBookingModal(false);
                            setSelectedRoomType(null);
                          }}
                        ></button>
                      </div>
                      <div className="modal-body">
                        <div className="row">
                          {/* Sharing Room Option */}
                          {selectedPackage.is_sharing_active && (
                            <div className="col-md-3 mb-3">
                              <div
                                className={`card h-100 ${selectedRoomType === 'sharing' ? 'border-primary border-3' : 'border-secondary'}`}
                                onClick={() => setSelectedRoomType('sharing')}
                                style={{
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                <div className="card-body text-center">
                                  <h6 className="">SHARING</h6>
                                  <div className="">
                                    <h6 className="text-primary">
                                      Rs. {calculatePackagePrice(selectedPackage, 'sharing').toLocaleString()}
                                    </h6>
                                    <small className="text-muted">per adult</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedPackage.is_quaint_active && (
                            <div className="col-md-3 mb-3">
                              <div
                                className={`card h-100 ${selectedRoomType === 'quint' ? 'border-primary border-3' : 'border-secondary'}`}
                                onClick={() => setSelectedRoomType('quint')}
                                style={{
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                <div className="card-body text-center">
                                  <h6 className="">QUINT</h6>
                                  <div className="">
                                    <h6 className="text-primary">
                                      Rs. {calculatePackagePrice(selectedPackage, 'quint').toLocaleString()}
                                    </h6>
                                    <small className="text-muted">per adult</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedPackage.is_quad_active && (
                            <div className="col-md-3 mb-3">
                              <div
                                className={`card h-100 ${selectedRoomType === 'quad' ? 'border-primary border-3' : 'border-secondary'}`}
                                onClick={() => setSelectedRoomType('quad')}
                                style={{
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                <div className="card-body text-center">
                                  <h6 className="">QUAD BED</h6>
                                  <div className="">
                                    <h6 className="text-primary">
                                      Rs. {calculatePackagePrice(selectedPackage, 'quad').toLocaleString()}
                                    </h6>
                                    <small className="text-muted">per adult</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedPackage.is_triple_active && (
                            <div className="col-md-3 mb-3">
                              <div
                                className={`card h-100 ${selectedRoomType === 'triple' ? 'border-primary border-3' : 'border-secondary'}`}
                                onClick={() => setSelectedRoomType('triple')}
                                style={{
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                <div className="card-body text-center">
                                  <h6 className="">TRIPLE BED</h6>
                                  <div className="">
                                    <h6 className="text-primary">
                                      Rs. {calculatePackagePrice(selectedPackage, 'triple').toLocaleString()}
                                    </h6>
                                    <small className="text-muted">per adult</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {selectedPackage.is_double_active && (
                            <div className="col-md-3 mb-3">
                              <div
                                className={`card h-100 ${selectedRoomType === 'double' ? 'border-primary border-3' : 'border-secondary'}`}
                                onClick={() => setSelectedRoomType('double')}
                                style={{
                                  cursor: 'pointer',
                                  transition: 'all 0.3s ease'
                                }}
                              >
                                <div className="text-center card-body">
                                  <h6 className="">DOUBLE BED</h6>
                                  <div className="">
                                    <h6 className="text-primary">
                                      Rs. {calculatePackagePrice(selectedPackage, 'double').toLocaleString()}
                                    </h6>
                                    <small className="text-muted">per adult</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setShowBookingModal(false);
                            setSelectedRoomType(null);
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={!selectedRoomType}
                          onClick={() => {
                            if (!selectedRoomType) {
                              toast.error('Please select a room type');
                              return;
                            }

                            // Calculate total price based on room type
                            let calculatedPrice = 0;
                            const basePrice =
                              (selectedPackage.adault_visa_price || 0) +
                              (selectedPackage.transport_price || 0) +
                              (ticketInfo?.adult_price || 0) +
                              (selectedPackage.food_price || 0) +
                              (selectedPackage.makkah_ziyarat_price || 0) +
                              (selectedPackage.madinah_ziyarat_price || 0);

                            // Add hotel price based on room type
                            switch (selectedRoomType) {
                              case 'sharing':
                                calculatedPrice = basePrice +
                                  (selectedPackage.hotel_details?.reduce((sum, hotel) =>
                                    sum + (hotel.sharing_bed_price || 0) * (hotel.number_of_nights || 0), 0) || 0);
                                break;
                              case 'quint':
                                calculatedPrice = basePrice +
                                  (selectedPackage.hotel_details?.reduce((sum, hotel) =>
                                    sum + (hotel.quaint_bed_price || 0) * (hotel.number_of_nights || 0), 0) || 0);
                                break;
                              case 'quad':
                                calculatedPrice = basePrice +
                                  (selectedPackage.hotel_details?.reduce((sum, hotel) =>
                                    sum + (hotel.quad_bed_price || 0) * (hotel.number_of_nights || 0), 0) || 0);
                                break;
                              case 'triple':
                                calculatedPrice = basePrice +
                                  (selectedPackage.hotel_details?.reduce((sum, hotel) =>
                                    sum + (hotel.triple_bed_price || 0) * (hotel.number_of_nights || 0), 0) || 0);
                                break;
                              case 'double':
                                calculatedPrice = basePrice +
                                  (selectedPackage.hotel_details?.reduce((sum, hotel) =>
                                    sum + (hotel.double_bed_price || 0) * (hotel.number_of_nights || 0), 0) || 0);
                                break;
                              default:
                                calculatedPrice = basePrice;
                            }

                            // Navigate to booking page with all necessary data
                            navigate('/agent/packages/detail', {
                              state: {
                                package: selectedPackage,
                                roomType: selectedRoomType.toUpperCase(),
                                totalPrice: calculatedPrice,

                              }
                            });

                            setShowBookingModal(false);
                          }}
                        >
                          Proceed to Booking
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Right Section (Flight + Summary) */}
              <div className="col-lg-4 col-md-12">
                <div
                  className="card border-0 rounded h-100"
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
  );
};

export default UmrahPackageCard;
