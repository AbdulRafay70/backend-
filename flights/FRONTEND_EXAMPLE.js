"""
Example: How to use the Flight API from the frontend
"""

# Example Frontend API Call
# =========================

# 1. Search for Flights
fetch('/api/flights/search/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  },
  body: JSON.stringify({
    origin: "KHI",
    destination: "DXB",
    departureDate: "10-02-2026",
    adults: 1,
    children: 0,
    infants: 0,
    cabinClass: "Y",
    nonStop: false,
    preferredAirlines: [],
    maxResults: 50
  })
})
.then(response => response.json())
.then(data => {
  console.log('Flights found:', data.total_count);
  console.log('Flights:', data.flights);
  
  // Display flights
  data.flights.forEach(flight => {
    console.log(`Flight ${flight.id}: ${flight.fare.currency} ${flight.fare.total}`);
  });
})
.catch(error => console.error('Error:', error));


# 2. Test Authentication
fetch('/api/flights/auth/test/', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
})
.then(response => response.json())
.then(data => {
  console.log('Auth status:', data);
})
.catch(error => console.error('Error:', error));


# Example React Component
# ========================

import React, { useState } from 'react';
import axios from 'axios';

function FlightSearch() {
  const [searchParams, setSearchParams] = useState({
    origin: 'KHI',
    destination: 'DXB',
    departureDate: '10-02-2026',
    adults: 1,
    children: 0,
    infants: 0,
    cabinClass: 'Y',
    nonStop: false
  });
  
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/api/flights/search/', searchParams, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setFlights(response.data.flights);
      console.log(`Found ${response.data.total_count} flights`);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Search Flights</h2>
      <input 
        value={searchParams.origin} 
        onChange={e => setSearchParams({...searchParams, origin: e.target.value})}
        placeholder="Origin (e.g., KHI)"
      />
      <input 
        value={searchParams.destination}
        onChange={e => setSearchParams({...searchParams, destination: e.target.value})}
        placeholder="Destination (e.g., DXB)"
      />
      <input 
        type="date"
        onChange={e => {
          // Convert YYYY-MM-DD to DD-MM-YYYY
          const [y, m, d] = e.target.value.split('-');
          setSearchParams({...searchParams, departureDate: `${d}-${m}-${y}`});
        }}
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? 'Searching...' : 'Search Flights'}
      </button>
      
      <div>
        {flights.map(flight => (
          <div key={flight.id} className="flight-card">
            <h3>Flight #{flight.id}</h3>
            <p>Price: {flight.fare.currency} {flight.fare.total}</p>
            <p>Refundable: {flight.refundable ? 'Yes' : 'No'}</p>
            {flight.segments.map((seg, idx) => (
              <div key={idx}>
                {seg.flights.map((f, i) => (
                  <p key={i}>
                    {f.airline} {f.flightNumber}: {f.origin} → {f.destination}
                    <br/>
                    {f.departureDate} {f.departureTime} - {f.arrivalDate} {f.arrivalTime}
                  </p>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FlightSearch;
