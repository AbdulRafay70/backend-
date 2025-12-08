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
    const hotelCost = calculateHotelCost(form) || {};
    return {
      name: hotel.name || 'N/A',
      roomType: form.roomType || '',
      checkIn: form.checkIn || '',
      nights: form.noOfNights || 0,
      checkOut: form.checkOut || '',
      rate: hotelCost.perNight || 0,
      qty: 1,
      net: hotelCost.total || 0,
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
    const persons = (parseInt(formData.totalAdults || 0) || 0) + (parseInt(formData.totalChilds || 0) || 0);
    const per = item.per_pex || 0;
    return { title: item.title || item.name || 'Food', per, persons, net: per * persons };
  });

  const ziaratRows = ziaratForms.filter(f => f.ziaratId && !formData.ziaratSelf).map((f) => {
    const item = ziaratPrices.find(z => String(z.id) === String(f.ziaratId)) || {};
    const persons = (parseInt(formData.totalAdults || 0) || 0) + (parseInt(formData.totalChilds || 0) || 0);
    const per = item.price || 0;
    return { title: item.ziarat_title || item.title || item.name || 'Ziarat', per, persons, net: per * persons };
  });

  const visaCost = ((calculatedVisaPrices.adultPrice || 0) * (parseInt(formData.totalAdults || 0) || 0)) +
    ((calculatedVisaPrices.childPrice || 0) * (parseInt(formData.totalChilds || 0) || 0)) +
    ((calculatedVisaPrices.infantPrice || 0) * (parseInt(formData.totalInfants || 0) || 0));

  const flightCost = selectedFlight ? (
    (selectedFlight.adult_price || 0) * (parseInt(formData.totalAdults || 0) || 0) +
    (selectedFlight.child_price || 0) * (parseInt(formData.totalChilds || 0) || 0) +
    (selectedFlight.infant_price || 0) * (parseInt(formData.totalInfants || 0) || 0)
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
            <h5 className="section-title">Pilgrims & Tickets Detail</h5>
            <table className="table pax-ticket-table">
              <thead>
                <tr>
                  <th>Pax</th>
                  <th>Total Pax</th>
                  <th>Visa Rate</th>
                  <th>Ticket Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Adult</td>
                  <td>{parseInt(formData.totalAdults || 0) || 0}</td>
                  <td>{calculatedVisaPrices.adultPrice || '-'}</td>
                  <td>{selectedFlight ? `PKR ${selectedFlight.adult_price || 0}` : '-'}</td>
                </tr>
                <tr>
                  <td>Child</td>
                  <td>{parseInt(formData.totalChilds || 0) || 0}</td>
                  <td>{calculatedVisaPrices.childPrice || '-'}</td>
                  <td>{selectedFlight ? `PKR ${selectedFlight.child_price || 0}` : '-'}</td>
                </tr>
                <tr>
                  <td>Infant</td>
                  <td>{parseInt(formData.totalInfants || 0) || 0}</td>
                  <td>{calculatedVisaPrices.infantPrice || '-'}</td>
                  <td>{selectedFlight ? `PKR ${selectedFlight.infant_price || 0}` : '-'}</td>
                </tr>
                <tr className="fw-bold">
                  <td>Total</td>
                  <td>{totalPax}</td>
                  <td>{(calculatedVisaPrices.adultPrice || 0) + (calculatedVisaPrices.childPrice || 0) + (calculatedVisaPrices.infantPrice || 0)}</td>
                  <td>{flightCost ? `PKR ${flightCost}` : '-'}</td>
                </tr>
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
