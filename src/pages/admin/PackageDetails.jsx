import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import axios from 'axios';

const PackageDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [bookingsData, setBookingsData] = useState([]);
    const [umrahPackageDetails, setUmrahPackageDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem("accessToken");
    const selectedOrganization = JSON.parse(
        localStorage.getItem("selectedOrganization")
    );
    const orgId = selectedOrganization?.id;

    useEffect(() => {
        const fetchPackageDetails = async () => {
            try {
                setLoading(true);
                const [bookingsRes, packageRes] = await Promise.all([
                    axios.get(`http://127.0.0.1:8000/api/bookings/get_by_umrah_package/`, {
                        params: { umrah_package_id: id, organization: orgId },
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }),
                    axios.get(`http://127.0.0.1:8000/api/umrah-packages/get_by_id/`, {
                        params: { id, organization: orgId },
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    })
                ]);

                setBookingsData(bookingsRes.data || []);

                // Normalize package response which may be { message, data }
                const pkgPayload = packageRes?.data;
                let pkg = null;
                if (pkgPayload) {
                    if (Array.isArray(pkgPayload.data)) pkg = pkgPayload.data[0];
                    else if (pkgPayload.data) pkg = pkgPayload.data;
                    else pkg = pkgPayload;
                }
                setUmrahPackageDetails(pkg);
            } catch (error) {
                console.error('Error fetching package details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPackageDetails();
    }, [id, orgId, token]);

    // Shimmer Loading Component
    const ShimmerEffect = () => (
        <div className="animate-pulse">
            {/* Header Shimmer */}
            <div className="mb-4">
                <div className="h-8 bg-gray-300 rounded w-1/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </div>

            {/* Package Info Shimmer */}
            <div className="row g-3 mb-4">
                {[...Array(6)].map((_, index) => (
                    <div key={index} className="col-md-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Hotel Details Shimmer */}
            <div className="card mb-4">
                <div className="card-header">
                    <div className="h-5 bg-gray-300 rounded w-1/4"></div>
                </div>
                <div className="card-body">
                    {[...Array(3)].map((_, index) => (
                        <div key={index} className="row mb-3">
                            <div className="col-md-3">
                                <div className="h-4 bg-gray-300 rounded w-full mb-1"></div>
                            </div>
                            <div className="col-md-3">
                                <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                            </div>
                            <div className="col-md-3">
                                <div className="h-4 bg-gray-300 rounded w-2/3 mb-1"></div>
                            </div>
                            <div className="col-md-3">
                                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Transport & Ticket Shimmer */}
            <div className="row g-3">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <div className="h-5 bg-gray-300 rounded w-1/3"></div>
                        </div>
                        <div className="card-body">
                            {[...Array(2)].map((_, index) => (
                                <div key={index} className="mb-2">
                                    <div className="h-4 bg-gray-300 rounded w-full mb-1"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <div className="h-5 bg-gray-300 rounded w-1/3"></div>
                        </div>
                        <div className="card-body">
                            {[...Array(2)].map((_, index) => (
                                <div key={index} className="mb-2">
                                    <div className="h-4 bg-gray-300 rounded w-full mb-1"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Format date function
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Format date time function
    const formatDateTime = (dateTimeString) => {
        if (!dateTimeString) return 'N/A';
        return new Date(dateTimeString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    

    // Format currency function
    // const formatCurrency = (amount) => {
    //     if (!amount) return '$0.00';
    //     return new Intl.NumberFormat('en-US', {
    //         style: 'currency',
    //         currency: 'USD'
    //     }).format(amount);
    // };

    // // Format currency in PKR
    // const formatCurrencyPKR = (amount) => {
    //     if (!amount) return '₨0';
    //     return new Intl.NumberFormat('en-PK', {
    //         style: 'currency',
    //         currency: 'PKR'
    //     }).format(amount);
    // };

    if (loading) {
        return (
            <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
                <div className="container-fluid p-0">
                    <div className="row g-0">
                        {/* Sidebar */}
                        <div className="col-12 col-lg-2">
                            <Sidebar />
                        </div>
                        {/* Main Content */}
                        <div className="col-12 col-lg-10">
                            <div className="container">
                                <Header />
                                <div className="px-3 my-3 px-lg-4">
                                    <ShimmerEffect />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // If there are no bookings, we'll show a non-blocking alert inside the
    // main page so package details are still visible to the user.

    return (
        <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif" }}>
            <div className="container-fluid p-0">
                <div className="row g-0">
                    {/* Sidebar */}
                    <div className="col-12 col-lg-2">
                        <Sidebar />
                    </div>
                    {/* Main Content */}
                    <div className="col-12 col-lg-10">
                        <div className="container">
                            <Header />
                            <div className="px-3 my-3 px-lg-4">
                                {/* Back Button */}
                                <div className="mb-4">
                                    <button
                                        className="btn btn-outline-secondary mb-3"
                                        onClick={() => navigate('/packages')}
                                    >
                                        ← Back to Packages
                                    </button>
                                    
                                    <h2 className="text-primary">Package Bookings</h2>
                                    <p className="text-muted">Package ID: {id} | Total Bookings: {bookingsData.length}</p>
                                    {bookingsData.length === 0 && (
                                        <div className="alert alert-warning">No bookings found for this package</div>
                                    )}
                                </div>
                                {umrahPackageDetails && (
                                    <div className="card mb-3">
                                        <div className="card-body">
                                            <h5>{umrahPackageDetails.title || umrahPackageDetails.name || 'Package'}</h5>
                                            <p className="mb-1"><strong>Organization:</strong> {umrahPackageDetails.organization || umrahPackageDetails.organization_id || 'N/A'}</p>
                                            <p className="mb-1"><strong>Status:</strong> {umrahPackageDetails.is_active ? 'Active' : 'Inactive'}</p>
                                            <p className="mb-0"><strong>Total Seats:</strong> {umrahPackageDetails.total_seats || umrahPackageDetails.total_seats}</p>
                                        </div>
                                    </div>
                                )}

                                {bookingsData.map((booking, bookingIndex) => (
                                    <div key={booking.id} className="card mb-4">
                                        <div className="card-header bg-primary text-white">
                                            <h5 className="mb-0">
                                                Booking #{booking.booking_number || booking.id}
                                                <span className={`badge ms-2 ${booking.status === 'confirmed' ? 'bg-success' : 'bg-warning'}`}>
                                                    {booking.status || 'Unknown'}
                                                </span>
                                            </h5>
                                        </div>
                                        <div className="card-body">
                                            {/* Booking Overview */}
                                            <div className="row g-3 mb-4">
                                                <div className="col-md-3">
                                                    <div className="card h-100">
                                                        <div className="card-body">
                                                            <h6 className="card-title text-muted">Total Amount</h6>
                                                            <h4 className="text-primary">{booking.total_amount}</h4>
                                                            <small className="text-muted">
                                                                PKR: {booking.total_in_pkr}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="card h-100">
                                                        <div className="card-body">
                                                            <h6 className="card-title text-muted">Payment Status</h6>
                                                            <span className={`badge ${booking.payment_status === 'paid' ? 'bg-success' :
                                                                booking.payment_status === 'partial' ? 'bg-warning' : 'bg-danger'
                                                                }`}>
                                                                {booking.payment_status || 'Unknown'}
                                                            </span>
                                                            <div className="mt-2">
                                                                <small>Paid: {booking.paid_payment}</small><br />
                                                                <small>Pending: {booking.pending_payment}</small>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="card h-100">
                                                        <div className="card-body">
                                                            <h6 className="card-title text-muted">Passengers</h6>
                                                            <h4 className="text-primary">{booking.total_pax}</h4>
                                                            <small className="text-muted">
                                                                Adults: {booking.total_adult} | Children: {booking.total_child} | Infants: {booking.total_infant}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="card h-100">
                                                        <div className="card-body">
                                                            <h6 className="card-title text-muted">Booking Date</h6>
                                                            <p className="mb-1">{formatDate(booking.date)}</p>
                                                            <small className="text-muted">
                                                                Created: {formatDate(booking.created_at)}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Package Details */}
                                            {booking.umrah_package && (
                                                <div className="mb-4">
                                                    <h6 className="text-primary mb-3">Package Information</h6>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <strong>Title:</strong> {booking.umrah_package.title}<br />
                                                            <strong>Visa Prices:</strong> 
                                                            Adult: {booking.umrah_package.adault_visa_price} | 
                                                            Child: {booking.umrah_package.child_visa_price} | 
                                                            Infant: {booking.umrah_package.infant_visa_price}
                                                        </div>
                                                        <div className="col-md-6">
                                                            <strong>Status:</strong> {booking.umrah_package.is_active ? 'Active' : 'Inactive'}<br />
                                                            <strong>Total Seats:</strong> {booking.umrah_package.total_seats} | 
                                                            <strong> Left Seats:</strong> {booking.umrah_package.left_seats}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Ticket Details */}
                                            <div className="mb-4">
                                                <h6 className="text-primary mb-3">Ticket Details</h6>
                                                {booking.ticket_details && booking.ticket_details.length > 0 ? (
                                                    booking.ticket_details.map((ticket, index) => (
                                                        <div key={ticket.id} className="card mb-3">
                                                            <div className="card-header bg-light">
                                                                <strong>Ticket #{index + 1}</strong>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="row">
                                                                    <div className="col-md-6">
                                                                        <strong>PNR:</strong> {ticket.pnr || 'N/A'}<br />
                                                                        <strong>Meal Included:</strong> {ticket.is_meal_included ? 'Yes' : 'No'}<br />
                                                                        <strong>Refundable:</strong> {ticket.is_refundable ? 'Yes' : 'No'}<br />
                                                                        <strong>Umrah Seat:</strong> {ticket.is_umrah_seat ? 'Yes' : 'No'}<br />
                                                                        <strong>Trip Type:</strong> {ticket.trip_type || 'N/A'}<br />
                                                                        <strong>Weight:</strong> {ticket.weight} kg<br />
                                                                        <strong>Pieces:</strong> {ticket.pieces}
                                                                    </div>
                                                                    <div className="col-md-6">
                                                                        <strong>Prices:</strong><br />
                                                                        Adult: {ticket.adult_price}<br />
                                                                        Child: {ticket.child_price}<br />
                                                                        Infant: {ticket.infant_price}<br />
                                                                        <strong>Seats:</strong> {ticket.seats}<br />
                                                                        <strong>Status:</strong> {ticket.status || 'N/A'}
                                                                    </div>
                                                                </div>

                                                                {/* Trip Details */}
                                                                {ticket.trip_details && ticket.trip_details.length > 0 && (
                                                                    <div className="mt-3">
                                                                        <strong>Trip Details:</strong>
                                                                        {ticket.trip_details.map((trip, tripIndex) => (
                                                                            <div key={trip.id} className="card mt-2">
                                                                                <div className="card-body py-2">
                                                                                    <div className="row">
                                                                                        <div className="col-md-6">
                                                                                            <strong>Departure:</strong> {formatDateTime(trip.departure_date_time)}<br />
                                                                                            <strong>Trip Type:</strong> {trip.trip_type}
                                                                                        </div>
                                                                                        <div className="col-md-6">
                                                                                            <strong>Arrival:</strong> {formatDateTime(trip.arrival_date_time)}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* Stopover Details */}
                                                                {ticket.stopover_details && ticket.stopover_details.length > 0 && (
                                                                    <div className="mt-3">
                                                                        <strong>Stopover Details:</strong>
                                                                        {ticket.stopover_details.map((stopover, stopoverIndex) => (
                                                                            <div key={stopover.id} className="card mt-2">
                                                                                <div className="card-body py-2">
                                                                                    <div className="row">
                                                                                        <div className="col-md-6">
                                                                                            <strong>Duration:</strong> {stopover.stopover_duration}<br />
                                                                                            <strong>Trip Type:</strong> {stopover.trip_type}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="alert alert-info">No ticket details available</div>
                                                )}
                                            </div>

                                            {/* Passenger Details */}
                                            <div className="mb-4">
                                                <h6 className="text-primary mb-3">Passenger Details</h6>
                                                {booking.person_details && booking.person_details.length > 0 ? (
                                                    <div className="table-responsive">
                                                        <table className="table table-bordered table-striped">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th>#</th>
                                                                    <th>Name</th>
                                                                    <th>Passport No</th>
                                                                    <th>Date of Birth</th>
                                                                    <th>Age Group</th>
                                                                    <th>Country</th>
                                                                    <th>Visa Status</th>
                                                                    <th>Ticket Status</th>
                                                                    <th>Visa Included</th>
                                                                    <th>Family Head</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {booking.person_details.map((person, index) => (
                                                                    <tr key={person.id}>
                                                                        <td>{index + 1}</td>
                                                                        <td>
                                                                            {person.first_name} {person.last_name}
                                                                            {person.is_family_head && (
                                                                                <span className="badge bg-info ms-1">Head</span>
                                                                            )}
                                                                        </td>
                                                                        <td>{person.passport_number || 'N/A'}</td>
                                                                        <td>{formatDate(person.date_of_birth)}</td>
                                                                        <td>
                                                                            <span className={`badge ${
                                                                                person.age_group === 'adult' ? 'bg-primary' :
                                                                                person.age_group === 'child' ? 'bg-success' : 'bg-warning'
                                                                            }`}>
                                                                                {person.age_group || 'N/A'}
                                                                            </span>
                                                                        </td>
                                                                        <td>{person.country || 'N/A'}</td>
                                                                        <td>
                                                                            <span className={`badge ${
                                                                                person.visa_status === 'approved' ? 'bg-success' :
                                                                                person.visa_status === 'pending' ? 'bg-warning' : 'bg-secondary'
                                                                            }`}>
                                                                                {person.visa_status || 'Pending'}
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <span className={`badge ${
                                                                                person.ticket_status === 'confirmed' ? 'bg-success' :
                                                                                person.ticket_status === 'pending' ? 'bg-warning' : 'bg-secondary'
                                                                            }`}>
                                                                                {person.ticket_status || 'Pending'}
                                                                            </span>
                                                                        </td>
                                                                        <td>{person.is_visa_included ? 'Yes' : 'No'}</td>
                                                                        <td>{person.is_family_head ? 'Yes' : 'No'}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="alert alert-info">No passenger details available</div>
                                                )}
                                            </div>

                                            {/* Hotel Details */}
                                            {booking.hotel_details && booking.hotel_details.length > 0 && (
                                                <div className="mb-4">
                                                    <h6 className="text-primary mb-3">Hotel Bookings</h6>
                                                    {booking.hotel_details.map((hotel, index) => (
                                                        <div key={hotel.id} className="row mb-3 pb-3 border-bottom">
                                                            <div className="col-md-4">
                                                                <strong>Check-in:</strong> {formatDate(hotel.check_in_date)}<br />
                                                                <strong>Check-out:</strong> {formatDate(hotel.check_out_date)}<br />
                                                                <strong>Nights:</strong> {hotel.number_of_nights}
                                                            </div>
                                                            <div className="col-md-4">
                                                                <strong>Room Type:</strong> {hotel.room_type}<br />
                                                                <strong>Price:</strong> {hotel.price}<br />
                                                                <strong>Quantity:</strong> {hotel.quantity}
                                                            </div>
                                                            <div className="col-md-4">
                                                                <strong>Total Price:</strong> {hotel.total_price}<br />
                                                                <strong>PKR:</strong> {hotel.total_in_pkr}<br />
                                                                <strong>Status:</strong> {hotel.check_in_status}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Transport Details */}
                                            {booking.transport_details && booking.transport_details.length > 0 && (
                                                <div className="mb-4">
                                                    <h6 className="text-primary mb-3">Transport Bookings</h6>
                                                    {booking.transport_details.map((transport, index) => (
                                                        <div key={transport.id} className="row mb-3 pb-3 border-bottom">
                                                            <div className="col-md-6">
                                                                <strong>Price:</strong> {transport.price}<br />
                                                                <strong>Total Price:</strong> {transport.total_price}<br />
                                                                <strong>Voucher No:</strong> {transport.voucher_no}
                                                            </div>
                                                            <div className="col-md-6">
                                                                <strong>PKR:</strong> {transport.price_in_pkr}<br />
                                                                <strong>SAR:</strong> {transport.price_in_sar}<br />
                                                                <strong>BRN No:</strong> {transport.brn_no}
                                                            </div>
                                                            {transport.sector_details && transport.sector_details.length > 0 && (
                                                                <div className="col-12 mt-2">
                                                                    <strong>Sector Details:</strong>
                                                                    {transport.sector_details.map((sector, sectorIndex) => (
                                                                        <div key={sector.id} className="small text-muted">
                                                                            Sector {sector.sector_no}: {formatDate(sector.date)} - {sector.contact_person_name} ({sector.contact_number})
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Agency Information */}
                                            {booking.agency && (
                                                <div className="mt-4 pt-3 border-top">
                                                    <h6 className="text-primary mb-3">Agency Information</h6>
                                                    <div className="row">
                                                        <div className="col-md-6">
                                                            <strong>Agency Name:</strong> {booking.agency.name}<br />
                                                            <strong>Branch:</strong> {booking.agency.branch_name}<br />
                                                            <strong>Email:</strong> {booking.agency.email}
                                                        </div>
                                                        <div className="col-md-6">
                                                            <strong>Phone:</strong> {booking.agency.phone_number}<br />
                                                            <strong>Address:</strong> {booking.agency.address}<br />
                                                            <strong>Agreement Status:</strong> {booking.agency.agreement_status ? 'Active' : 'Inactive'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PackageDetails;