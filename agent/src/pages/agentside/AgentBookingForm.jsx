import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AgentSidebar from '../../components/AgentSidebar';
import AgentHeader from '../../components/AgentHeader';
import { toast, ToastContainer } from 'react-toastify';
import api from '../../utils/Api';
import 'react-toastify/dist/ReactToastify.css';

const AgentBookingForm = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { package: selectedPackage, roomType, totalPrice, families = [] } = location.state || {};

  const [activeTab, setActiveTab] = useState('booking-info');
  const [loading, setLoading] = useState(false);

  // Get org data from localStorage
  const agentOrg = JSON.parse(localStorage.getItem('agentOrganization') || '{}');
  const orgId = agentOrg?.ids?.[0] || null;
  const userId = agentOrg?.user_id  || null;
  const branchId = agentOrg?.branch_id || null;
  const agencyId = agentOrg?.agency_id || null;

  // Derive totals from families passed in state (each family: {roomType, adults, children, ...})
  const derivedAdults = families.reduce((s, f) => s + (Number(f.adults) || 0), 0);
  const derivedChildren = families.reduce((s, f) => s + (Number(f.children) || 0), 0);
  const derivedInfants = families.reduce((s, f) => s + (Number(f.infants) || 0), 0);
  const derivedTotalPax = derivedAdults + derivedChildren + derivedInfants;

  // Booking Information State
  const [bookingInfo, setBookingInfo] = useState({
    organization: orgId,
    branch: branchId,
    agency: agencyId,
    user_id: userId,
    umrah_package: selectedPackage?.id || '',
    date: new Date().toISOString().split('T')[0],
    total_pax: derivedTotalPax,
    total_adult: derivedAdults,
    total_child: derivedChildren,
    total_infant: derivedInfants,
    // store room types summary (comma separated) for reference
    room_type: families.length ? families.map(f => f.roomType).join(',') : (roomType || ''),
    customer_name: '',
    customer_contact: '',
    customer_email: '',
    customer_address: '',
    client_note: '',
  });

  // Person Details State
  const [personDetails, setPersonDetails] = useState([]);

  // Payment Details State
  const [paymentDetails, setPaymentDetails] = useState([{
    method: 'cash',
    amount: 0,
    date: new Date().toISOString(),
    remarks: '',
    status: 'Pending'
  }]);

  // Hotel Details State (optional)
  const [hotelDetails, setHotelDetails] = useState([]);

  // Transport Details State (optional)
  const [transportDetails, setTransportDetails] = useState([]);

  // Ziyarat Details State (optional)
  const [ziyaratDetails, setZiyaratDetails] = useState([]);

  // Food Details State (optional)
  const [foodDetails, setFoodDetails] = useState([]);

  // Handle person count changes - generate persons grouped by families when available
  useEffect(() => {
    // If `families` array is provided via navigation, use it to construct grouped personDetails
    if (Array.isArray(families) && families.length > 0) {
      const newPersonDetails = [];
      families.forEach((family, famIndex) => {
        const adults = Number(family.adults) || 0;
        const children = Number(family.children) || 0;
        const infants = Number(family.infants) || 0;

        // Add adults for this family; mark first adult of family as family head
        for (let a = 0; a < adults; a++) {
          newPersonDetails.push({
            person_title: 'Mr',
            first_name: '',
            last_name: '',
            passport_number: '',
            date_of_birth: '',
            passpoet_issue_date: '',
            passport_expiry_date: '',
            country: 'Pakistan',
            is_family_head: a === 0, // first adult in family
            age_group: 'adult',
            contact_number: '',
            is_visa_included: true,
            ticket_included: true,
            family_index: famIndex,
          });
        }

        // Add children for this family
        for (let c = 0; c < children; c++) {
          newPersonDetails.push({
            person_title: 'Master',
            first_name: '',
            last_name: '',
            passport_number: '',
            date_of_birth: '',
            passpoet_issue_date: '',
            passport_expiry_date: '',
            country: 'Pakistan',
            is_family_head: false,
            age_group: 'child',
            contact_number: '',
            is_visa_included: true,
            ticket_included: true,
            family_index: famIndex,
          });
        }

        // Add infants for this family
        for (let i = 0; i < infants; i++) {
          newPersonDetails.push({
            person_title: 'Baby',
            first_name: '',
            last_name: '',
            passport_number: '',
            date_of_birth: '',
            passpoet_issue_date: '',
            passport_expiry_date: '',
            country: 'Pakistan',
            is_family_head: false,
            age_group: 'infant',
            contact_number: '',
            is_visa_included: true,
            ticket_included: true,
            family_index: famIndex,
          });
        }
      });

      // Update bookingInfo totals based on families (keep in sync)
      const totalAdults = families.reduce((s, f) => s + (Number(f.adults) || 0), 0);
      const totalChildren = families.reduce((s, f) => s + (Number(f.children) || 0), 0);
      const totalInfants = families.reduce((s, f) => s + (Number(f.infants) || 0), 0);
      const totalPax = totalAdults + totalChildren + totalInfants;

      setBookingInfo(prev => ({ ...prev, total_pax: totalPax, total_adult: totalAdults, total_child: totalChildren, total_infant: totalInfants }));
      setPersonDetails(newPersonDetails);
      return;
    }

    // Fallback: construct persons from raw totals when families not provided
    const totalPax = parseInt(bookingInfo.total_adult || 0) + 
                     parseInt(bookingInfo.total_child || 0) + 
                     parseInt(bookingInfo.total_infant || 0);
    setBookingInfo(prev => ({ ...prev, total_pax: totalPax }));

    const newPersonDetails = [];
    
    for (let i = 0; i < bookingInfo.total_adult; i++) {
      newPersonDetails.push({
        person_title: 'Mr',
        first_name: '',
        last_name: '',
        passport_number: '',
        date_of_birth: '',
        passpoet_issue_date: '',
        passport_expiry_date: '',
        country: 'Pakistan',
        is_family_head: i === 0,
        age_group: 'adult',
        contact_number: '',
        is_visa_included: true,
        ticket_included: true
      });
    }

    for (let i = 0; i < bookingInfo.total_child; i++) {
      newPersonDetails.push({
        person_title: 'Master',
        first_name: '',
        last_name: '',
        passport_number: '',
        date_of_birth: '',
        passpoet_issue_date: '',
        passport_expiry_date: '',
        country: 'Pakistan',
        is_family_head: false,
        age_group: 'child',
        contact_number: '',
        is_visa_included: true,
        ticket_included: true
      });
    }

    for (let i = 0; i < bookingInfo.total_infant; i++) {
      newPersonDetails.push({
        person_title: 'Baby',
        first_name: '',
        last_name: '',
        passport_number: '',
        date_of_birth: '',
        passpoet_issue_date: '',
        passport_expiry_date: '',
        country: 'Pakistan',
        is_family_head: false,
        age_group: 'infant',
        contact_number: '',
        is_visa_included: true,
        ticket_included: true
      });
    }

    setPersonDetails(newPersonDetails);
  }, [families, bookingInfo.total_adult, bookingInfo.total_child, bookingInfo.total_infant]);

  // Handle person detail changes
  const handlePersonChange = (index, field, value) => {
    const updatedPersons = [...personDetails];
    updatedPersons[index] = { ...updatedPersons[index], [field]: value };
    setPersonDetails(updatedPersons);
  };

  // Respect an `openTab` passed via navigation state (used when returning from summary)
  useEffect(() => {
    if (location.state?.openTab) {
      setActiveTab(location.state.openTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Helper: determine if package requires visa images/visa inclusion
  const visaRequired = Boolean(
    selectedPackage && (
      selectedPackage.is_visa_included ||
      selectedPackage.adault_visa_price > 0 ||
      selectedPackage.adult_visa_price > 0 ||
      selectedPackage.infant_visa_price > 0
    )
  );

  // Handle payment detail changes
  const handlePaymentChange = (index, field, value) => {
    const updatedPayments = [...paymentDetails];
    updatedPayments[index] = { ...updatedPayments[index], [field]: value };
    setPaymentDetails(updatedPayments);
  };

  // Add new payment
  const addPayment = () => {
    setPaymentDetails([...paymentDetails, {
      method: 'cash',
      amount: 0,
      date: new Date().toISOString(),
      remarks: '',
      status: 'Pending'
    }]);
  };

  // Remove payment
  const removePayment = (index) => {
    if (paymentDetails.length > 1) {
      setPaymentDetails(paymentDetails.filter((_, i) => i !== index));
    }
  };

  // Create internal note helper function
  const createInternalNote = async () => {
    try {
      const token = localStorage.getItem('agentAccessToken');
      const response = await api.post('/internal-notes/', {
        note: `Booking created on ${new Date().toLocaleDateString()}`,
        organization: orgId,
        employee: userId, // Required field
        note_type: 'booking' // Required field - could be 'booking', 'general', etc.
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('✅ Internal note created:', response.data);
      return response.data.id;
    } catch (error) {
      console.error('❌ Failed to create internal note:', error);
      console.error('Error details:', error.response?.data);
      // If internal note creation fails, try to continue without it
      toast.warning('Could not create internal note, proceeding with booking...');
      return null;
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!bookingInfo.umrah_package) {
      toast.error('Package is required');
      return;
    }

    if (bookingInfo.total_pax === 0) {
      toast.error('Please add at least one passenger');
      return;
    }

    // Validate person details
    for (let i = 0; i < personDetails.length; i++) {
      const person = personDetails[i];
      console.log(`🔍 Validating Passenger ${i + 1}:`, person);
      
      const missingFields = [];
      if (!person.first_name) missingFields.push('First Name');
      if (!person.last_name) missingFields.push('Last Name');
      if (!person.passport_number) missingFields.push('Passport Number');
      if (!person.date_of_birth) missingFields.push('Date of Birth');
      if (!person.contact_number) missingFields.push('Contact Number');
      // If visa is required for this package, ensure visa image is provided
      if (visaRequired && !person.visa_image) missingFields.push('Visa Image');
      
      if (missingFields.length > 0) {
        console.error(`❌ Missing fields for Passenger ${i + 1}:`, missingFields);
        toast.error(`Passenger ${i + 1} - Missing: ${missingFields.join(', ')}`);
        setActiveTab('person-details');
        return;
      }
    }

    setLoading(true);

    // Create internal note first
    let internalNoteId = await createInternalNote();
    
    // If internal note creation failed, use ID 1 as fallback
    // TODO: Backend should make this field optional or provide a default note
    if (!internalNoteId) {
      console.warn('⚠️ Using fallback internal_notes_id = 1');
      internalNoteId = 1;
    }

    // Prepare the final payload - matching backend API reference
    const payload = {
      // Required fields
      organization_id: orgId,
      branch_id: branchId,
      agency_id: agencyId,
      user_id: userId,
      umrah_package: bookingInfo.umrah_package,
      total_pax: bookingInfo.total_pax,
      total_adult: bookingInfo.total_adult,
      total_child: bookingInfo.total_child,
      total_infant: bookingInfo.total_infant,
      status: "Pending",
      
      // Optional but recommended
  ...(internalNoteId && { internal_notes_id: [internalNoteId] }),
      ...(bookingInfo.client_note && { client_note: bookingInfo.client_note }),
      
      // Person details (required if passengers exist)
      person_details: personDetails.map(p => ({
        first_name: p.first_name,
        last_name: p.last_name,
        passport_number: p.passport_number,
        date_of_birth: p.date_of_birth,
        age_group: p.age_group,
        contact_number: p.contact_number,
        is_family_head: p.is_family_head,
        // Optional person fields
        ...(p.person_title && { person_title: p.person_title }),
        ...(p.passpoet_issue_date && { passpoet_issue_date: p.passpoet_issue_date }),
        ...(p.passport_expiry_date && { passport_expiry_date: p.passport_expiry_date }),
        ...(p.country && { country: p.country }),
        ...(p.is_visa_included !== undefined && { is_visa_included: p.is_visa_included }),
        ...(p.ticket_included !== undefined && { ticket_included: p.ticket_included }),
      })),
      
      // Payment details (optional - only include if payments exist)
      ...(paymentDetails.length > 0 && paymentDetails[0].amount > 0 && {
        payment_details: paymentDetails.map(p => ({
          amount: parseFloat(p.amount),
          method: p.method,
          date: p.date.split('T')[0], // Convert to YYYY-MM-DD format
          status: p.status.toLowerCase(), // "Pending" → "pending"
          ...(p.remarks && { reference_number: p.remarks }),
        }))
      }),
    };

    console.log('📦 Booking Payload:', JSON.stringify(payload, null, 2));
    console.log('💳 Payment Details:', payload.payment_details ? JSON.stringify(payload.payment_details, null, 2) : 'Not included (optional)');
    
    try {
      const token = localStorage.getItem('agentAccessToken');
      const response = await api.post('/bookings/', payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      toast.success('Booking created successfully!');
      // Optional: response.data may include booking id/number
      navigate('/booking-history');
    } catch (error) {
      console.error('❌ Booking submission failed:', error);
      console.error('Error response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('Error status:', error.response?.status);
      console.error('Full error response:', error.response);
      
      // Handle specific error cases
      if (error.response?.status === 500) {
        toast.error('Backend server error. Please contact the developer to fix the booking API.');
        console.error('💡 Backend issue: BookingSerializer likely has a misconfiguration');
      } else if (error.response?.status === 400) {
        // Handle validation errors
        const data = error.response?.data;
        
        // Check if response is HTML error page
        if (typeof data === 'string' && data.includes('<!DOCTYPE html>')) {
          toast.error('Backend returned an error page. Check server logs.');
          console.error('💡 Backend returned HTML instead of JSON. Server might have crashed.');
          return;
        }
        
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          // Show first validation error
          const firstKey = Object.keys(data)[0];
          const val = data[firstKey];
          if (Array.isArray(val)) {
            toast.error(`${firstKey}: ${val[0]}`);
          } else if (typeof val === 'string') {
            toast.error(`${firstKey}: ${val}`);
          } else {
            toast.error('Validation error. Please check all required fields.');
          }
          console.error('Validation errors:', data);
        } else if (data?.message) {
          toast.error(data.message);
        } else if (data?.detail) {
          toast.error(data.detail);
        } else {
          toast.error('Bad request. Unknown validation error.');
          console.error('💡 Empty error object received from backend');
        }
      } else {
        const message = error.response?.data?.message || error.response?.data?.detail || 'Failed to create booking';
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'booking-info', label: 'Booking Info', icon: '📋' },
    { id: 'person-details', label: 'Passengers', icon: '👥' },
    { id: 'payment-details', label: 'Payment', icon: '💳' },
    { id: 'additional-services', label: 'Additional Services', icon: '🎫' },
  ];

  return (
    <div className="min-vh-100" style={{ fontFamily: "Poppins, sans-serif", background: "#f8f9fa" }}>
      <div className="row g-0">
        <div className="col-12 col-lg-2">
          <AgentSidebar />
        </div>
        <div className="col-12 col-lg-10 ps-lg-5">
          <div className="container">
            <AgentHeader />
            <ToastContainer position="top-right" autoClose={3000} theme="colored" />
            
            <div className="px-3 mt-3 ps-lg-4">
              {/* Page Header */}
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <h3 className="fw-bold mb-1">Create Umrah Booking</h3>
                  <p className="text-muted mb-0">
                    Package: {selectedPackage?.title || 'N/A'} | Room Type: {roomType || 'N/A'}
                  </p>
                </div>
                <button 
                  className="btn btn-outline-secondary"
                  onClick={() => navigate(-1)}
                >
                  ← Back
                </button>
              </div>

              {/* Tab Navigation */}
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-body p-2">
                  <ul className="nav nav-pills" role="tablist">
                    {tabs.map((tab) => (
                      <li className="nav-item" key={tab.id}>
                        <button
                          className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                          onClick={() => setActiveTab(tab.id)}
                          style={{
                            borderRadius: '8px',
                            marginRight: '8px',
                            fontWeight: activeTab === tab.id ? '600' : '400'
                          }}
                        >
                          <span className="me-2">{tab.icon}</span>
                          {tab.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Tab Content */}
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  
                  {/* Booking Info Tab */}
                  {activeTab === 'booking-info' && (
                    <div>
                      <h5 className="fw-bold mb-4">Booking Information</h5>
                      
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Booking Date</label>
                          <div className="p-2 border rounded bg-white fw-bold">{bookingInfo.date}</div>
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Room Type <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            value={bookingInfo.room_type}
                            readOnly
                            style={{ background: '#f8f9fa' }}
                          />
                        </div>

                        <div className="col-12">
                          <label className="form-label fw-semibold">Passengers (derived from selected rooms)</label>
                          <div className="border rounded p-3 bg-white">
                            <div className="row">
                                <div className="col-md-6">
                                <strong>Room summary:</strong>
                                <ul className="mb-0">
                                  {families && families.length ? (
                                    families.map((f, i) => (
                                      <li key={i} className="small">Family {i + 1}: <span className="text-capitalize">{f.roomType}</span> — {Number(f.adults||0)} adult(s){f.children? `, ${f.children} child(ren)`:''}</li>
                                    ))
                                  ) : (
                                    <li className="small text-muted">No rooms selected (select rooms from package)</li>
                                  )}
                                </ul>
                              </div>
                              <div className="col-md-6">
                                <strong>Totals</strong>
                                <div className="small">Adults: {bookingInfo.total_adult}</div>
                                <div className="small">Children: {bookingInfo.total_child}</div>
                                <div className="small">Infants: {bookingInfo.total_infant}</div>
                                <div className="small fw-bold mt-1">Total passengers: {bookingInfo.total_pax}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="col-12"><hr /></div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Customer Name <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            value={bookingInfo.customer_name}
                            onChange={(e) => setBookingInfo({...bookingInfo, customer_name: e.target.value})}
                            placeholder="Enter customer full name"
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Customer Contact <span className="text-danger">*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            value={bookingInfo.customer_contact}
                            onChange={(e) => setBookingInfo({...bookingInfo, customer_contact: e.target.value})}
                            placeholder="03001234567"
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Customer Email</label>
                          <input
                            type="email"
                            className="form-control"
                            value={bookingInfo.customer_email}
                            onChange={(e) => setBookingInfo({...bookingInfo, customer_email: e.target.value})}
                            placeholder="customer@example.com"
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="form-label fw-semibold">Customer Address</label>
                          <input
                            type="text"
                            className="form-control"
                            value={bookingInfo.customer_address}
                            onChange={(e) => setBookingInfo({...bookingInfo, customer_address: e.target.value})}
                            placeholder="Complete address"
                          />
                        </div>

                        <div className="col-12">
                          <label className="form-label fw-semibold">Client Notes</label>
                          <textarea
                            className="form-control"
                            rows="3"
                            value={bookingInfo.client_note}
                            onChange={(e) => setBookingInfo({...bookingInfo, client_note: e.target.value})}
                            placeholder="Any special requests or notes..."
                          />
                        </div>
                      </div>

                      <div className="mt-4 text-end">
                        <button 
                          className="btn text-white px-4"
                          id="btn"
                          onClick={() => setActiveTab('person-details')}
                          disabled={bookingInfo.total_pax === 0}
                        >
                          Next: Add Passengers →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Person Details Tab */}
                  {activeTab === 'person-details' && (
                    <div>
                      <h5 className="fw-bold mb-4">Passenger Details</h5>
                      
                      {personDetails.length === 0 ? (
                        <div className="text-center py-5">
                          <p className="text-muted">Please add passengers in the Booking Info tab first</p>
                          <button 
                            className="btn btn-outline-primary"
                            onClick={() => setActiveTab('booking-info')}
                          >
                            Go to Booking Info
                          </button>
                        </div>
                      ) : (
                        <>
                          {
                            // Group personDetails by family_index when available
                            (() => {
                              const groups = [];
                              if (families && families.length) {
                                // Use families order to create groups
                                families.forEach((f, fi) => {
                                  groups.push({ family_index: fi, members: [] });
                                });
                                personDetails.forEach((p, idx) => {
                                  const fi = p.family_index >= 0 ? p.family_index : 0;
                                  const group = groups[fi] || groups[0];
                                  group.members.push({ person: p, globalIndex: idx });
                                });
                              } else {
                                // fallback: group by family_index if present, else single group
                                const map = new Map();
                                personDetails.forEach((p, idx) => {
                                  const fi = (p.family_index !== undefined && p.family_index !== null) ? p.family_index : 0;
                                  if (!map.has(fi)) map.set(fi, []);
                                  map.get(fi).push({ person: p, globalIndex: idx });
                                });
                                for (const [fi, members] of map.entries()) {
                                  groups.push({ family_index: fi, members });
                                }
                              }

                              return groups.map((g, familyPos) => (
                                <div key={g.family_index} className="mb-3">
                                  <h6 className="fw-bold">Family {familyPos + 1}</h6>
                                  {g.members.map(({ person, globalIndex }, localIdx) => (
                                    <div key={globalIndex} className="border rounded p-3 mb-3" style={{ background: '#f8f9fa' }}>
                                      <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h6 className="fw-bold mb-0">
                                          Passenger {localIdx + 1}
                                          <span className="badge bg-primary ms-2">{person.age_group.toUpperCase()}</span>
                                          {person.is_family_head && <span className="badge bg-success ms-2">Family Head</span>}
                                        </h6>
                                      </div>

                                      <div className="row g-3">
                                        <div className="col-md-2">
                                          <label className="form-label fw-semibold">Title <span className="text-danger">*</span></label>
                                          <select
                                            className="form-select"
                                            value={person.person_title}
                                            onChange={(e) => handlePersonChange(globalIndex, 'person_title', e.target.value)}
                                          >
                                            <option value="Mr">Mr</option>
                                            <option value="Mrs">Mrs</option>
                                            <option value="Miss">Miss</option>
                                            <option value="Master">Master</option>
                                            <option value="Baby">Baby</option>
                                          </select>
                                        </div>

                                        <div className="col-md-5">
                                          <label className="form-label fw-semibold">First Name <span className="text-danger">*</span></label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={person.first_name}
                                            onChange={(e) => handlePersonChange(globalIndex, 'first_name', e.target.value)}
                                            placeholder="First name"
                                          />
                                        </div>

                                        <div className="col-md-5">
                                          <label className="form-label fw-semibold">Last Name <span className="text-danger">*</span></label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={person.last_name}
                                            onChange={(e) => handlePersonChange(globalIndex, 'last_name', e.target.value)}
                                            placeholder="Last name"
                                          />
                                        </div>

                                        <div className="col-md-4">
                                          <label className="form-label fw-semibold">Passport Number <span className="text-danger">*</span></label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={person.passport_number}
                                            onChange={(e) => handlePersonChange(globalIndex, 'passport_number', e.target.value)}
                                            placeholder="AB1234567"
                                          />
                                        </div>

                                        <div className="col-md-4">
                                          <label className="form-label fw-semibold">Date of Birth <span className="text-danger">*</span></label>
                                          <input
                                            type="date"
                                            className="form-control"
                                            value={person.date_of_birth}
                                            onChange={(e) => handlePersonChange(globalIndex, 'date_of_birth', e.target.value)}
                                          />
                                        </div>

                                        <div className="col-md-4">
                                          <label className="form-label fw-semibold">Contact Number <span className="text-danger">*</span></label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={person.contact_number}
                                            onChange={(e) => handlePersonChange(globalIndex, 'contact_number', e.target.value)}
                                            placeholder="03001234567"
                                          />
                                        </div>

                                        <div className="col-md-4">
                                          <label className="form-label fw-semibold">Passport Issue Date</label>
                                          <input
                                            type="date"
                                            className="form-control"
                                            value={person.passpoet_issue_date}
                                            onChange={(e) => handlePersonChange(globalIndex, 'passpoet_issue_date', e.target.value)}
                                          />
                                        </div>

                                        <div className="col-md-4">
                                          <label className="form-label fw-semibold">Passport Expiry Date</label>
                                          <input
                                            type="date"
                                            className="form-control"
                                            value={person.passport_expiry_date}
                                            onChange={(e) => handlePersonChange(globalIndex, 'passport_expiry_date', e.target.value)}
                                          />
                                        </div>

                                        <div className="col-md-4">
                                          <label className="form-label fw-semibold">Country</label>
                                          <input
                                            type="text"
                                            className="form-control"
                                            value={person.country}
                                            onChange={(e) => handlePersonChange(globalIndex, 'country', e.target.value)}
                                          />
                                        </div>

                                        <div className="col-md-6">
                                          <div className="form-check mt-4">
                                            <input
                                              className="form-check-input"
                                              type="checkbox"
                                              checked={visaRequired ? true : person.is_visa_included}
                                              disabled={visaRequired}
                                              onChange={(e) => handlePersonChange(globalIndex, 'is_visa_included', e.target.checked)}
                                            />
                                            <label className="form-check-label">Include Visa</label>
                                          </div>
                                        </div>

                                        <div className="col-md-6">
                                          <div className="form-check mt-4">
                                            <input
                                              className="form-check-input"
                                              type="checkbox"
                                              checked={person.ticket_included}
                                              onChange={(e) => handlePersonChange(globalIndex, 'ticket_included', e.target.checked)}
                                            />
                                            <label className="form-check-label">Include Ticket</label>
                                          </div>
                                        </div>

                                        {visaRequired && (
                                          <div className="col-12">
                                            <label className="form-label fw-semibold">Visa Image (required)</label>
                                            <input
                                              type="file"
                                              accept="image/*"
                                              className="form-control"
                                              onChange={(e) => handlePersonChange(globalIndex, 'visa_image', e.target.files?.[0] || null)}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ));
                            })()
                          }

                          <div className="mt-4 d-flex justify-content-between">
                            <button 
                              className="btn btn-outline-secondary px-4"
                              onClick={() => setActiveTab('booking-info')}
                            >
                              ← Previous
                            </button>
                            <button 
                              className="btn text-white px-4"
                              id="btn"
                              onClick={() => navigate('/packages/summary', { state: { package: selectedPackage, bookingInfo, personDetails, totalPrice, families } })}
                            >
                              Next: Booking Summary →
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Payment Details Tab */}
                  {activeTab === 'payment-details' && (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h5 className="fw-bold mb-0">Payment Details</h5>
                        <button 
                          className="btn btn-sm btn-outline-primary"
                          onClick={addPayment}
                        >
                          + Add Payment
                        </button>
                      </div>

                      {paymentDetails.map((payment, index) => (
                        <div key={index} className="border rounded p-3 mb-3" style={{ background: '#f8f9fa' }}>
                          <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="fw-bold mb-0">Payment {index + 1}</h6>
                            {paymentDetails.length > 1 && (
                              <button 
                                className="btn btn-sm btn-outline-danger"
                                onClick={() => removePayment(index)}
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="row g-3">
                            <div className="col-md-3">
                              <label className="form-label fw-semibold">Payment Method <span className="text-danger">*</span></label>
                              <select
                                className="form-select"
                                value={payment.method}
                                onChange={(e) => handlePaymentChange(index, 'method', e.target.value)}
                              >
                                <option value="cash">Cash</option>
                                <option value="bank_transfer">Bank Transfer</option>
                                <option value="online">Online Payment</option>
                                <option value="cheque">Cheque</option>
                                <option value="credit_card">Credit Card</option>
                              </select>
                            </div>

                            <div className="col-md-3">
                              <label className="form-label fw-semibold">Amount (PKR) <span className="text-danger">*</span></label>
                              <input
                                type="number"
                                className="form-control"
                                value={payment.amount}
                                onChange={(e) => handlePaymentChange(index, 'amount', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                              />
                            </div>

                            <div className="col-md-3">
                              <label className="form-label fw-semibold">Payment Date <span className="text-danger">*</span></label>
                              <input
                                type="datetime-local"
                                className="form-control"
                                value={payment.date.substring(0, 16)}
                                onChange={(e) => handlePaymentChange(index, 'date', new Date(e.target.value).toISOString())}
                              />
                            </div>

                            <div className="col-md-3">
                              <label className="form-label fw-semibold">Status</label>
                              <select
                                className="form-select"
                                value={payment.status}
                                onChange={(e) => handlePaymentChange(index, 'status', e.target.value)}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Completed">Completed</option>
                                <option value="Failed">Failed</option>
                              </select>
                            </div>

                            <div className="col-12">
                              <label className="form-label fw-semibold">Remarks</label>
                              <textarea
                                className="form-control"
                                rows="2"
                                value={payment.remarks}
                                onChange={(e) => handlePaymentChange(index, 'remarks', e.target.value)}
                                placeholder="Payment remarks or transaction details..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="alert alert-info mt-4">
                        <strong>Total Package Price:</strong> Rs. {totalPrice?.toLocaleString() || 0}/-
                        <br />
                        <strong>Total Payments:</strong> Rs. {paymentDetails.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0).toLocaleString()}/-
                      </div>

                      <div className="mt-4 d-flex justify-content-between">
                        <button 
                          className="btn btn-outline-secondary px-4"
                          onClick={() => setActiveTab('person-details')}
                        >
                          ← Previous
                        </button>
                        <button 
                          className="btn text-white px-4"
                          id="btn"
                          onClick={() => setActiveTab('additional-services')}
                        >
                          Next: Additional Services →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Additional Services Tab */}
                  {activeTab === 'additional-services' && (
                    <div>
                      <h5 className="fw-bold mb-4">Additional Services (Optional)</h5>
                      
                      <div className="alert alert-info">
                        <strong>Note:</strong> Hotel, Transport, Ziyarat, and Food details can be added here if they are not included in the package or need customization.
                        These fields are optional and will be added to API integration in future updates.
                      </div>

                      <div className="row g-4">
                        <div className="col-12">
                          <div className="card">
                            <div className="card-header">
                              <h6 className="mb-0">🏨 Hotel Details</h6>
                            </div>
                            <div className="card-body">
                              <p className="text-muted small mb-0">Custom hotel booking details (optional)</p>
                            </div>
                          </div>
                        </div>

                        <div className="col-12">
                          <div className="card">
                            <div className="card-header">
                              <h6 className="mb-0">🚌 Transport Details</h6>
                            </div>
                            <div className="card-body">
                              <p className="text-muted small mb-0">Custom transport arrangements (optional)</p>
                            </div>
                          </div>
                        </div>

                        <div className="col-12">
                          <div className="card">
                            <div className="card-header">
                              <h6 className="mb-0">🕌 Ziyarat Details</h6>
                            </div>
                            <div className="card-body">
                              <p className="text-muted small mb-0">Additional ziyarat tours (optional)</p>
                            </div>
                          </div>
                        </div>

                        <div className="col-12">
                          <div className="card">
                            <div className="card-header">
                              <h6 className="mb-0">🍽️ Food Details</h6>
                            </div>
                            <div className="card-body">
                              <p className="text-muted small mb-0">Custom food arrangements (optional)</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 d-flex justify-content-between">
                        <button 
                          className="btn btn-outline-secondary px-4"
                          onClick={() => setActiveTab('payment-details')}
                        >
                          ← Previous
                        </button>
                        <button 
                          className="btn btn-success px-4"
                          onClick={handleSubmit}
                          disabled={loading}
                        >
                          {loading ? 'Creating Booking...' : 'Create Booking ✓'}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentBookingForm;
