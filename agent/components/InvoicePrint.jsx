import React from 'react';
import './InvoicePrint.css';

const InvoicePrint = ({
  formData = {},
  hotelForms = [],
  transportForms = [],
  foodForms = [],
  ziaratForms = [],
  selectedFlight = null,
  calculatedVisaPrices = {},
  riyalRate = {},
  hotels = [],
  foodPrices = [],
  ziaratPrices = [],
  formatPriceWithCurrencyNetPrice = (n) => n,
  calculateHotelCost = () => ({ total: 0, perNight: 0 }),
  calculateTransportCost = () => 0,
  formatPriceWithCurrency = (n) => n,
}) => {
  const totalPax = (parseInt(formData.totalAdults || 0) || 0) + (parseInt(formData.totalChilds || 0) || 0) + (parseInt(formData.totalInfants || 0) || 0);

  const hotelRows = hotelForms.filter(f => f.hotelId).map((form, idx) => {
    const hotel = hotels.find(h => String(h.id) === String(form.hotelId)) || {};
    
    // Calculate hotel cost directly in invoice
    let perNight = 0;
    let total = 0;
    
    if (hotel?.prices && form.checkIn) {
      const checkIn = new Date(form.checkIn);
      const activePrice = hotel.prices.find(price => {
        const startDate = new Date(price.start_date);
        const endDate = new Date(price.end_date);
        return checkIn >= startDate && checkIn <= endDate;
      });
      
      if (activePrice) {
        const adults = parseInt(formData.totalAdults || 0) || 0;
        const childs = parseInt(formData.totalChilds || 0) || 0;
        const infants = parseInt(formData.totalInfants || 0) || 0;
        const nights = parseInt(form.noOfNights || 0) || 0;
        
        const adultPrice = activePrice.adult_selling_price || 0;
        const childPrice = activePrice.child_selling_price || 0;
        const infantPrice = activePrice.infant_selling_price || 0;
        
        perNight = (adults * adultPrice) + (childs * childPrice) + (infants * infantPrice);
        total = perNight * nights;
      }
    }
    
    return {
      name: hotel.name || 'N/A',
      roomType: form.roomType || '',
      checkIn: form.checkIn || '',
      nights: form.noOfNights || 0,
      checkOut: form.checkOut || '',
      rate: perNight,
      qty: 1,
      net: total,
    };
  });

  const transportRows = transportForms.filter(f => f.transportSectorId && !f.self).map((f) => ({
    vehicle: f.transportType || 'Vehicle',
    route: f.transportSector || '',
    rate: calculateTransportCost(f),
    qty: 1,
    net: calculateTransportCost(f),
  }));

  const foodRows = foodForms.filter(f => f.foodId && !formData.foodSelf).map((f) => {
    const item = foodPrices.find(fp => String(fp.id) === String(f.foodId)) || {};
    const adults = parseInt(formData.totalAdults || 0) || 0;
    const childs = parseInt(formData.totalChilds || 0) || 0;
    const infants = parseInt(formData.totalInfants || 0) || 0;
    const adultPrice = item.adult_selling_price || 0;
    const childPrice = item.child_selling_price || 0;
    const infantPrice = item.infant_selling_price || 0;
    const net = (adults * adultPrice) + (childs * childPrice) + (infants * infantPrice);
    return { 
      title: item.title || item.name || 'Food', 
      adults, childs, infants,
      adultPrice, childPrice, infantPrice,
      net 
    };
  });

  const ziaratRows = ziaratForms.filter(f => f.ziaratId && !formData.ziaratSelf).map((f) => {
    const item = ziaratPrices.find(z => String(z.id) === String(f.ziaratId)) || {};
    const adults = parseInt(formData.totalAdults || 0) || 0;
    const childs = parseInt(formData.totalChilds || 0) || 0;
    const infants = parseInt(formData.totalInfants || 0) || 0;
    const adultPrice = item.adult_selling_price || 0;
    const childPrice = item.child_selling_price || 0;
    const infantPrice = item.infant_selling_price || 0;
    const net = (adults * adultPrice) + (childs * childPrice) + (infants * infantPrice);
    return { 
      title: item.ziarat_title || item.title || item.name || 'Ziarat',
      adults, childs, infants,
      adultPrice, childPrice, infantPrice,
      net 
    };
  });

  const visaCost = ((calculatedVisaPrices.adultPrice || 0) * (parseInt(formData.totalAdults || 0) || 0)) +
    ((calculatedVisaPrices.childPrice || 0) * (parseInt(formData.totalChilds || 0) || 0)) +
    ((calculatedVisaPrices.infantPrice || 0) * (parseInt(formData.totalInfants || 0) || 0));

  const flightCost = selectedFlight ? (
    (selectedFlight.adult_price || selectedFlight.adult_fare || 0) * (parseInt(formData.totalAdults || 0) || 0) +
    (selectedFlight.child_price || selectedFlight.child_fare || 0) * (parseInt(formData.totalChilds || 0) || 0) +
    (selectedFlight.infant_price || selectedFlight.infant_fare || 0) * (parseInt(formData.totalInfants || 0) || 0)
  ) : 0;

  const hotelTotal = hotelRows.reduce((s, r) => s + (r.net || 0), 0);
  const transportTotal = transportRows.reduce((s, r) => s + (r.net || 0), 0);
  const foodTotal = foodRows.reduce((s, r) => s + (r.net || 0), 0);
  const ziaratTotal = ziaratRows.reduce((s, r) => s + (r.net || 0), 0);

  const netPKR = flightCost + hotelTotal + transportTotal + foodTotal + ziaratTotal + visaCost;

  return (
    <div className="invoice-print-root">
      <div className="invoice-header">
        <div className="invoice-logo">Company Logo</div>
        <div className="invoice-meta">
          <div><strong>Booking Ref:</strong> {formData.bookingRef || formData.booking_ref || '—'}</div>
          <div><strong>Invoice:</strong> {formData.invoice_no || formData.invoice || formData.invoiceDate || '—'}</div>
        </div>
      </div>

      <div className="invoice-grid">
        <div className="invoice-left">
          <section className="invoice-section">
            <h5 className="section-title">Pax Information</h5>
            <table className="table pax-table">
              <thead>
                <tr>
                  <th>Passenger Name</th>
                  <th>Passport No</th>
                  <th>PAX</th>
                  <th>DOB</th>
                  <th>PNR</th>
                  <th>Bed</th>
                  <th>Total Pax</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>N/A</td>
                  <td>N/A</td>
                  <td>Adult</td>
                  <td>N/A</td>
                  <td>{formData.pnr || 'N/A'}</td>
                  <td>{'—'}</td>
                  <td>{(parseInt(formData.totalAdults || 0) || 0)} Adult & {(parseInt(formData.totalChilds || 0) || 0)} Child</td>
                </tr>
              </tbody>
            </table>
          </section>

          <div className="section-divider" />

          <section className="invoice-section">
            <h5 className="section-title">Accommodation</h5>
            <table className="table accom-table">
              <thead>
                <tr>
                  <th>Hotel Name</th>
                  <th>Type</th>
                  <th>Check-In</th>
                  <th>Nights</th>
                  <th>Check-Out</th>
                  <th>Rate</th>
                  <th>QTY</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {hotelRows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.name}</td>
                    <td>{r.roomType}</td>
                    <td>{r.checkIn}</td>
                    <td>{r.nights}</td>
                    <td>{r.checkOut}</td>
                    <td>{riyalRate?.is_hotel_pkr ? 'PKR ' : 'SAR '}{r.rate}</td>
                    <td>{r.qty}</td>
                    <td>{formatPriceWithCurrencyNetPrice(r.net)}</td>
                  </tr>
                ))}

                <tr className="fw-bold">
                  <td>Total Accommodation</td>
                  <td></td>
                  <td></td>
                  <td>{hotelRows.reduce((s, r) => s + (r.nights || 0), 0)}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td>{formatPriceWithCurrencyNetPrice(hotelTotal)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <div className="section-divider" />

          <section className="invoice-section">
            <h5 className="section-title">Transportation</h5>
            <table className="table transport-table">
              <thead>
                <tr>
                  <th>Vehicle type</th>
                  <th>Route</th>
                  <th>Rate</th>
                  <th>QTY</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {transportRows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.vehicle}</td>
                    <td>{r.route}</td>
                    <td>{r.rate}</td>
                    <td>{r.qty}</td>
                    <td>{r.net}</td>
                  </tr>
                ))}
                <tr className="fw-bold">
                  <td colSpan="4">Total Transportation</td>
                  <td>{transportTotal}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <div className="section-divider" />

          <section className="invoice-section">
            <h5 className="section-title">Food Services</h5>
            <table className="table food-table">
              <thead>
                <tr>
                  <th>Food Item</th>
                  <th>Adult Rate × Qty</th>
                  <th>Child Rate × Qty</th>
                  <th>Infant Rate × Qty</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {foodRows.length > 0 ? (
                  <>
                    {foodRows.map((r, i) => (
                      <tr key={i}>
                        <td>{r.title}</td>
                        <td>PKR {r.adultPrice.toLocaleString()} × {r.adults}</td>
                        <td>PKR {r.childPrice.toLocaleString()} × {r.childs}</td>
                        <td>PKR {r.infantPrice.toLocaleString()} × {r.infants}</td>
                        <td>PKR {r.net.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="fw-bold">
                      <td colSpan="4">Total Food Services</td>
                      <td>PKR {foodTotal.toLocaleString()}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">No food services selected</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <div className="section-divider" />

          <section className="invoice-section">
            <h5 className="section-title">Ziarat Services</h5>
            <table className="table ziarat-table">
              <thead>
                <tr>
                  <th>Ziarat</th>
                  <th>Adult Rate × Qty</th>
                  <th>Child Rate × Qty</th>
                  <th>Infant Rate × Qty</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {ziaratRows.length > 0 ? (
                  <>
                    {ziaratRows.map((r, i) => (
                      <tr key={i}>
                        <td>{r.title}</td>
                        <td>PKR {r.adultPrice.toLocaleString()} × {r.adults}</td>
                        <td>PKR {r.childPrice.toLocaleString()} × {r.childs}</td>
                        <td>PKR {r.infantPrice.toLocaleString()} × {r.infants}</td>
                        <td>PKR {r.net.toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="fw-bold">
                      <td colSpan="4">Total Ziarat Services</td>
                      <td>PKR {ziaratTotal.toLocaleString()}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">No ziarat services selected</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <div className="section-divider" />

          <section className="invoice-section">
            <h5 className="section-title">Visa Services</h5>
            <table className="table visa-table">
              <thead>
                <tr>
                  <th>Visa Type</th>
                  <th>Adult Rate × Qty</th>
                  <th>Child Rate × Qty</th>
                  <th>Infant Rate × Qty</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {visaCost > 0 ? (
                  <>
                    <tr>
                      <td>{calculatedVisaPrices.visaType || 'Visa Services'}</td>
                      <td>PKR {(calculatedVisaPrices.adultPrice || 0).toLocaleString()} × {parseInt(formData.totalAdults || 0) || 0}</td>
                      <td>PKR {(calculatedVisaPrices.childPrice || 0).toLocaleString()} × {parseInt(formData.totalChilds || 0) || 0}</td>
                      <td>PKR {(calculatedVisaPrices.infantPrice || 0).toLocaleString()} × {parseInt(formData.totalInfants || 0) || 0}</td>
                      <td>PKR {visaCost.toLocaleString()}</td>
                    </tr>
                    <tr className="fw-bold">
                      <td colSpan="4">Total Visa Services</td>
                      <td>PKR {visaCost.toLocaleString()}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">No visa services selected</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <div className="section-divider" />

          <section className="invoice-section">
            <h5 className="section-title">Flight Tickets</h5>
            <table className="table ticket-table">
              <thead>
                <tr>
                  <th>Ticket Type</th>
                  <th>Adult Rate × Qty</th>
                  <th>Child Rate × Qty</th>
                  <th>Infant Rate × Qty</th>
                  <th>Net</th>
                </tr>
              </thead>
              <tbody>
                {selectedFlight ? (
                  <>
                    <tr>
                      <td>{selectedFlight.airline_name || 'Flight Ticket'}</td>
                      <td>PKR {(selectedFlight.adult_price || selectedFlight.adult_fare || 0).toLocaleString()} × {parseInt(formData.totalAdults || 0) || 0}</td>
                      <td>PKR {(selectedFlight.child_price || selectedFlight.child_fare || 0).toLocaleString()} × {parseInt(formData.totalChilds || 0) || 0}</td>
                      <td>PKR {(selectedFlight.infant_price || selectedFlight.infant_fare || 0).toLocaleString()} × {parseInt(formData.totalInfants || 0) || 0}</td>
                      <td>PKR {flightCost.toLocaleString()}</td>
                    </tr>
                    <tr className="fw-bold">
                      <td colSpan="4">Total Flight Tickets</td>
                      <td>PKR {flightCost.toLocaleString()}</td>
                    </tr>
                  </>
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">No flight selected</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>

      </div>

      {/* Bottom full-width Invoice Details section */}
      <div className="invoice-details-section">
        <h5 className="section-title">Invoice Details</h5>
        <div className="invoice-details" style={{display:'flex',gap:24,flexWrap:'wrap'}}>
          <div style={{flex:'1 1 520px',minWidth:300}}>
            <div className="summary-row"><span>Booking Date:</span><strong>{formData.bookingDate || formData.booking_date || '—'}</strong></div>
            <div className="summary-row"><span>Booking#:</span><strong>{formData.bookingNumber || formData.booking_no || formData.booking_ref || '—'}</strong></div>
            <div className="summary-row"><span>Family Head:</span><strong>{formData.familyHead || formData.family_head || '—'}</strong></div>
            <div className="summary-row"><span>Travel Date:</span><strong>{formData.travelDate || formData.departureTravelDate || '—'}</strong></div>
            <div className="summary-row"><span>Return Date:</span><strong>{formData.returnDate || formData.returnReturnDate || '—'}</strong></div>
            <div className="summary-row"><span>Invoice Date:</span><strong>{formData.invoiceDate || formData.invoice_date || '—'}</strong></div>
          </div>

          <div style={{flex:'0 0 320px',minWidth:260}}>
            <div className="summary-box">
              <div className="tot-row"><span>PKR Rate: Visa @ {riyalRate?.rate ?? '—'}</span><strong>PKR {visaCost.toLocaleString()}</strong></div>
              <div className="tot-row"><span>Tickets :</span><strong>PKR {flightCost.toLocaleString()}</strong></div>
              <div className="tot-row"><span>PKR Rate: Hotel @ {riyalRate?.rate ?? '—'}</span><strong>PKR {hotelTotal.toLocaleString()}</strong></div>
              <div className="tot-row"><span>PKR Rate: Transport @ {riyalRate?.rate ?? '—'}</span><strong>PKR {transportTotal.toLocaleString()}</strong></div>
              {foodTotal > 0 && <div className="tot-row"><span>Food Services :</span><strong>PKR {foodTotal.toLocaleString()}</strong></div>}
              {ziaratTotal > 0 && <div className="tot-row"><span>Ziarat Services :</span><strong>PKR {ziaratTotal.toLocaleString()}</strong></div>}
              <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
                <div className="net-badge">Net PKR = <strong>PKR {netPKR.toLocaleString()}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div className="notes" style={{marginTop:12}}>
          <p><strong>Booking Notes:</strong> {formData.bookingNotes || formData.booking_notes || '—'}</p>
          <p><strong>Voucher Notes:</strong> {formData.voucherNotes || formData.voucher_notes || '—'}</p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrint;
