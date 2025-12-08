import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AgentSidebar from '../../components/AgentSidebar';
import AgentHeader from '../../components/AgentHeader';

const BookingSummary = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { package: selectedPackage, bookingInfo, personDetails = [], totalPrice, families = [], cityMap = {}, airlineMap = {} } = location.state || {};

  // Group persons by family_index
  const groups = [];
  if (families && families.length) {
    families.forEach((f, fi) => groups.push({ family_index: fi, members: [] }));
    personDetails.forEach((p, idx) => {
      const fi = (p.family_index >= 0) ? p.family_index : 0;
      const group = groups[fi] || groups[0];
      group.members.push({ person: p, globalIndex: idx });
    });
  } else {
    const map = new Map();
    personDetails.forEach((p, idx) => {
      const fi = (p.family_index !== undefined && p.family_index !== null) ? p.family_index : 0;
      if (!map.has(fi)) map.set(fi, []);
      map.get(fi).push({ person: p, globalIndex: idx });
    });
    for (const [fi, members] of map.entries()) groups.push({ family_index: fi, members });
  }

  if (!selectedPackage || !bookingInfo) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <h5>No booking summary available</h5>
          <p className="text-muted">Please go back and complete the booking details.</p>
          <button className="btn btn-primary" onClick={() => navigate(-1)}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100" style={{ fontFamily: 'Poppins, sans-serif', background: '#f8f9fa' }}>
      <div className="row g-0">
        <div className="col-12 col-lg-2"><AgentSidebar /></div>
        <div className="col-12 col-lg-10 ps-lg-5">
          <div className="container">
            <AgentHeader />
            <div className="px-3 mt-3 ps-lg-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h3 className="fw-bold mb-1">Booking Summary</h3>
                  <p className="text-muted mb-0">Review all passenger and package details before submission</p>
                </div>
                <div>
                  <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>← Back</button>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Package Overview</h5>
                      <p className="mb-1"><strong>Title:</strong> {selectedPackage?.title || '—'}</p>
                      <p className="mb-1"><strong>Code / ID:</strong> {selectedPackage?.id || '—'}</p>
                      <p className="mb-1"><strong>Organization:</strong> {selectedPackage?.organization || '—'}</p>
                      <p className="mb-1"><strong>Total Seats:</strong> {selectedPackage?.total_seats ?? '—'}</p>
                      <p className="mb-1"><strong>Booking date:</strong> {bookingInfo?.date || '—'}</p>
                      <p className="mb-1"><strong>Totals:</strong> Adults {bookingInfo?.total_adult ?? 0} — Children {bookingInfo?.total_child ?? 0} — Infants {bookingInfo?.total_infant ?? 0}</p>
                      <p className="mb-1"><strong>Total Passengers:</strong> {bookingInfo?.total_pax ?? 0}</p>
                      {typeof totalPrice !== 'undefined' && (
                        <p className="mb-0"><strong>Estimated Price:</strong> Rs. {Number(totalPrice).toLocaleString()}</p>
                      )}
                    </div>
                  </div>

                  <div className="card mb-3">
                    <div className="card-body">
                        <h5 className="card-title">Ticket / Flight Info</h5>
                        {(
                          // prefer bookingInfo.ticket_details if present, otherwise selectedPackage.ticket_details
                          (bookingInfo && bookingInfo.ticket_details && bookingInfo.ticket_details.length > 0) ? bookingInfo.ticket_details : (selectedPackage?.ticket_details || [])
                        ).length ? (
                          (bookingInfo && bookingInfo.ticket_details && bookingInfo.ticket_details.length > 0 ? bookingInfo.ticket_details : selectedPackage.ticket_details).map((td, i) => {
                            // td may contain trip_details array and prices
                            const adultFare = td.adult_price || td.ticket_info?.adult_price || bookingInfo?.total_ticket_amount || 0;
                            const infantFare = td.infant_price || td.ticket_info?.infant_price || 0;
                            const ticketId = td.ticket || td.ticket_id || td.id || selectedPackage?.id || '—';
                            const tripArr = (td.trip_details || []).map(t => {
                              const dep = cityMap[t.departure_city] || t.departure_city || t.departure_city_id || '—';
                              const arr = cityMap[t.arrival_city] || t.arrival_city || t.arrival_city_id || '—';
                              const depDate = t.departure_date_time || t.departure_date || '—';
                              return `${dep} → ${arr} (${depDate})`;
                            });

                            // try to get airline name from map if td has airline or ticket has airline
                            const airlineKey = td.airline || td.ticket_info?.airline || td.ticket?.airline || td.ticket_id;
                            const airlineName = airlineMap && airlineKey ? (airlineMap[airlineKey]?.name || airlineMap[airlineKey] || airlineKey) : (td.airline_name || td.airline || '—');

                            return (
                              <div key={i} className="mb-2">
                                <div><strong>Airline:</strong> {airlineName}</div>
                                <div className="small text-muted">Ticket ID: {ticketId} — Adult fare: Rs. {Number(adultFare || 0).toLocaleString()} — Infant fare: Rs. {Number(infantFare || 0).toLocaleString()}</div>
                                <div className="small text-muted">{tripArr.length ? tripArr.join(' • ') : '—'}</div>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-muted">No ticket info</p>
                        )}
                      </div>
                  </div>

                  <div className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Hotel Details</h5>
                      {selectedPackage?.hotel_details?.length ? (
                        selectedPackage.hotel_details.map((h, idx) => (
                          <div key={idx} className="mb-2">
                            <div><strong>{h.hotel_info?.name || `Hotel ${idx + 1}`}</strong> <span className="small text-muted">({h.city || ''})</span></div>
                            <div className="small text-muted">Nights: {h.number_of_nights || 0}</div>
                            <div className="small text-muted">Prices — Sharing: Rs. {Number(h.sharing_bed_price || 0).toLocaleString()}, Quint: Rs. {Number(h.quaint_bed_price || h.quint_bed_price || 0).toLocaleString()}, Quad: Rs. {Number(h.quad_bed_price || 0).toLocaleString()}, Triple: Rs. {Number(h.triple_bed_price || 0).toLocaleString()}, Double: Rs. {Number(h.double_bed_price || 0).toLocaleString()}</div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted">No hotel details</p>
                      )}
                    </div>
                  </div>

                  <div className="card mb-3">
                    <div className="card-body">
                      <h5 className="card-title">Pricing & Extras</h5>
                      <div className="mb-1"><strong>Adult visa price:</strong> Rs. {Number(selectedPackage?.adault_visa_price || 0).toLocaleString()}</div>
                      <div className="mb-1"><strong>Child visa price:</strong> Rs. {Number(selectedPackage?.child_visa_price || 0).toLocaleString()}</div>
                      <div className="mb-1"><strong>Infant visa price:</strong> Rs. {Number(selectedPackage?.infant_visa_price || 0).toLocaleString()}</div>
                      <div className="mb-1"><strong>Transport price:</strong> Rs. {Number(selectedPackage?.transport_price || 0).toLocaleString()}</div>
                      <div className="mb-1"><strong>Food price:</strong> Rs. {Number(selectedPackage?.food_price || 0).toLocaleString()}</div>
                      <div className="mb-1"><strong>Makkah Ziyarat:</strong> Rs. {Number(selectedPackage?.makkah_ziyarat_price || 0).toLocaleString()}</div>
                      <div className="mb-0"><strong>Madina Ziyarat:</strong> Rs. {Number(selectedPackage?.madinah_ziyarat_price || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">Flags & Rules</h5>
                      <div className="mb-1"><strong>Sharing active:</strong> {selectedPackage?.is_sharing_active ? 'Yes' : 'No'}</div>
                      <div className="mb-1"><strong>Quint active:</strong> {selectedPackage?.is_quaint_active ? 'Yes' : 'No'}</div>
                      <div className="mb-1"><strong>Quad active:</strong> {selectedPackage?.is_quad_active ? 'Yes' : 'No'}</div>
                      <div className="mb-1"><strong>Triple active:</strong> {selectedPackage?.is_triple_active ? 'Yes' : 'No'}</div>
                      <div className="mb-1"><strong>Double active:</strong> {selectedPackage?.is_double_active ? 'Yes' : 'No'}</div>
                      <div className="mt-2"><strong>Rules:</strong>
                        <div className="text-muted small">{selectedPackage?.rules || '—'}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title mb-3">Passengers</h5>
                      {groups.length === 0 ? (
                        <p className="text-muted">No passengers added</p>
                      ) : (
                        groups.map((g, gi) => (
                          <div key={g.family_index} className="mb-3">
                            <h6 className="fw-bold">Family {gi + 1}</h6>
                            {g.members.map(({ person, globalIndex }, mi) => (
                              <div key={globalIndex} className="border rounded p-2 mb-2" style={{ background: '#f8f9fa' }}>
                                <div><strong>{person.person_title} {person.first_name} {person.last_name}</strong> {person.is_family_head && <span className="badge bg-success ms-2">Family Head</span>}</div>
                                <div className="small text-muted">Passport: {person.passport_number || '—'} | DOB: {person.date_of_birth || '—'}</div>
                                <div className="small text-muted">Contact: {person.contact_number || '—'}</div>
                                <div className="small text-muted">Age group: {person.age_group}</div>
                                {person.is_visa_included && person.visa_image && (
                                  <div className="small mt-1">Visa file: {person.visa_image.name || 'uploaded'}</div>
                                )}
                              </div>
                            ))}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 d-flex justify-content-end gap-2">
                <button className="btn btn-outline-secondary" onClick={() => navigate(-1)}>Edit Passengers</button>
                <button className="btn text-white" onClick={() => {
                  // Return to booking form with intent to open payment tab for finalization
                  navigate('/packages/booking', { state: { package: selectedPackage, families, totalPrice, bookingInfo, personDetails, openTab: 'payment-details' } });
                }}>Proceed to Payment →</button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;
