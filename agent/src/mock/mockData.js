// Minimal mock data used by AgentUmrahCalculator.jsx
// Replace or extend these objects with the real test data your component expects.

const mockData = {
  packages: [
    {
      id: 1,
      title: "umrah",
      total_seats: 12,
      is_sharing_active: true,
      is_quaint_active: true,
      is_quad_active: true,
      is_triple_active: true,
      is_double_active: true,
      hotel_details: [
        { hotel_info: { name: "crowin" }, number_of_nights: 3 },
        { hotel_info: { name: "N/A" }, number_of_nights: 2 }
      ],
      ticket_details: [
        {
          ticket_info: {
            airline: 1,
            adult_price: 27000,
            infant_price: 120124200,
            trip_details: []
          }
        }
      ],
      food_price: 0,
      makkah_ziyarat_price: 1,
      madinah_ziyarat_price: 0,
      adault_visa_price: 0,
      infant_visa_price: 0,
      rules: "N/A",
    }
  ],
  airlines: [
    { id: 1, name: "PIA", logo: "" },
    { id: 2, name: "Saudi", logo: "" }
  ],
  cities: [
    { id: 5, name: "Makkah", code: "MHK" }
  ],
  hotels: [
    {
      id: 40,
      name: "crowin",
      address: "ajfh;a",
      city: 5,
      distance: 10,
      prices: [
        {
          id: 202,
          start_date: "2025-11-16",
          end_date: "2025-11-30",
          room_type: "triple",
          price: 1000.0,
          purchase_price: 12000.0,
          is_sharing_allowed: false
        }
      ]
    }
  ]
};

export default mockData;
