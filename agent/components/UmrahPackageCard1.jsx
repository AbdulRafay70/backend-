import React from 'react';
import kaabaImg from "../assets/image.jpg";

const UmrahPackageCard = () => {
  return (

      <div className="card border-0" style={{ 
        borderRadius: '15px',
        background: '#DFF1FD',
        fontFamily: "poppins, sans-serif"
      }}>
        {/* Header Image */}
        <div className="card-img-top d-flex align-items-center mt-2 justify-content-center" style={{ borderRadius: '11px 11px 0 0', overflow: 'hidden' }}>
          <img 
            src={kaabaImg} 
            alt="Kaaba at Masjid al-Haram"
            className="img-fluid "
            style={{ height: '200px', objectFit: 'cover', borderRadius: '15px', width: '90%' }}
          />
        </div>

        {/* Card Body */}
        <div className="bg-white m-3 rounded-3 ps-3 pt-4">
          <h2 className="card-title fw-bold mb-4" style={{ color: '#333', fontSize: '1.5rem' }}>
            Umrah Package
          </h2>
          
          {/* Hotels Section */}
          <div className="mb-1">
            <h6 className="fw-bold mb-2" style={{ color: '#757D83', fontStyle:'italic' }}>Hotels:</h6>
            <div className="small" style={{color:'#333E47'}}>
              <div>4 Nights at makkah (Saif ul Majd)</div>
              <div>5nights At Medina (Rou Taiba)</div>
              <div>5nights At Medina (Rou Taiba)</div>
            </div>
          </div>

          {/* Umrah Visa */}
          <div className="mb-1">
            <h6 className="fw-bold mb-1" style={{ color: '#757D83', fontStyle:'italic' }}>Umrah Visa:</h6>
            <div className="small" style={{color:'#333E47'}}>INCLUDED</div>
          </div>

          {/* Transport */}
          <div className="mb-1">
            <h6 className="fw-bold mb-1" style={{ color: '#757D83', fontStyle:'italic' }}>Transport:</h6>
            <div className="small" style={{color:'#333E47'}}>JED-MAK-MED-MAK-JED</div>
          </div>

          {/* Flight */}
          <div className="mb-1">
            <h6 className="fw-bold mb-1" style={{ color: '#757D83', fontStyle:'italic' }}>Flight:</h6>
            <div className="small" style={{color:'#333E47'}}>
              <div><strong>Travel Date:</strong> SV 234-LHE-JED 19-DEC-2024-23:20-01:20</div>
              <div><strong>Return Date:</strong> SV 234-LHE-JED 19-DEC-2024-23:20-01:20</div>
            </div>
          </div>

          {/* Zayarat */}
          <div className="mb-1">
            <h6 className="fw-bold mb-1" style={{ color: '#757D83', fontStyle:'italic' }}>ZAYARAT</h6>
            <div className="small  style={{color:'#333E47'}}fw-bold">N/A</div>
          </div>

          {/* Food */}
          <div className="mb-4">
            <h6 className="fw-bold mb-1" style={{ color: '#666' }}>FOOD</h6>
            <div className="small  style={{color:'#333E47'}}fw-bold">N/A</div>
          </div>

          {/* Price */}
          <div className="text-center">
            <div className="bg-light rounded-pill py-2 px-4 d-inline-block">
              <h3 className="fw-bold mb-0" style={{ color: '#333', fontSize: '1.8rem' }}>
                RS.120,000/-
              </h3>
            </div>
          </div>
        </div>
      </div>
  );
};

export default UmrahPackageCard;