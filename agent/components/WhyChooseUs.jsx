import React from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import './WhyChooseUs.css';
import Area from '../assets/area.jpg';
import Loptop from '../assets/loptop.jpg';

const WhyChooseUs = () => {
  return (
    <div className="py-5" style={{ fontFamily: "Nunito Sans, sans-serif" }}>
      <Container>
        {/* Why Choose Us Section */}
        <Row className="mb-5">
          <Col lg={6} className="d-flex flex-column justify-content-center">
            <h2 
              className="mb-3" 
              style={{ fontSize: '2.5rem', fontWeight :'900' }}
            >
              Why Choose Us?
            </h2>
            <ul className="list-unstyled mb-4">
              <li className="mb-3 d-flex align-items-start">
                <span 
                  className="me-3" 
                  style={{ color: '#22c55e', fontSize: '1.2rem' }}
                >
                  •
                </span>
                <span>Best prices for Umrah visas in Pakistan.</span>
              </li>
              <li className="mb-3 d-flex align-items-start">
                <span 
                  className="me-3" 
                  style={{ color: '#22c55e', fontSize: '1.2rem' }}
                >
                  •
                </span>
                <span>
                  Reliable hotel bookings near Haram in Makkah and Masjid-e-Nabawi in Madina.
                </span>
              </li>
              <li className="mb-3 d-flex align-items-start">
                <span 
                  className="me-3" 
                  style={{ color: '#22c55e', fontSize: '1.2rem' }}
                >
                  •
                </span>
                <span>Dedicated support for B2B agents with 24/7 availability.</span>
              </li>
              <li className="mb-3 d-flex align-items-start">
                <span 
                  className="me-3" 
                  style={{ color: '#22c55e', fontSize: '1.2rem' }}
                >
                  •
                </span>
                <span>Fast and hassle-free complaint resolution.</span>
              </li>
              <li className="mb-3 d-flex align-items-start">
                <span 
                  className="me-3" 
                  style={{ color: '#22c55e', fontSize: '1.2rem' }}
                >
                  •
                </span>
                <span>Flexible and affordable packages for groups and families.</span>
              </li>
            </ul>
            <p className="text-muted mb-4">
              At Saer Karo Travels, we believe in building lasting relationships with our 
              partners and clients by providing top-quality services. Let us take care of 
              the logistics while you focus on your spiritual journey.
            </p>
            <div>
              <Button 
                size="lg"
                style={{ 
                  backgroundColor: '#1B78CE', 
                  borderRadius: '25px',
                  padding: '12px 30px',
                  fontWeight: 'bold'
                }}
                className="shadow-sm mb-3"
              >
                Contact Us
              </Button>
            </div>
          </Col>
          <Col lg={6} className="d-flex align-items-center justify-content-center">
            <div 
              className="w-100 shadow-lg"
              style={{
                height: '400px',
                borderRadius: '15px',
                overflow: 'hidden'
              }}
            >
              <img 
                src={Area}
                alt="Pilgrims at Masjid al-Nabawi"
                className="w-100 h-100"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </Col>
        </Row>

        {/* Our Partners Section */}
        <Row>
          <Col lg={6} className="d-flex align-items-center justify-content-center mb-4 mb-lg-0">
            <div 
              className="w-100 shadow-lg"
              style={{
                height: '400px',
                borderRadius: '15px',
                overflow: 'hidden'
              }}
            >
              <img 
                src={Loptop}
                alt="Professional workspace with laptop"
                className="w-100 h-100"
                style={{ objectFit: 'cover' }}
              />
            </div>
          </Col>
          <Col lg={6} className="d-flex flex-column justify-content-center">
            <h2 
              className="mb-3" 
              style={{ fontSize: '2.5rem', fontWeight :'900' }}
            >
              Our Partners
            </h2>
            <p className="mb-4 text-muted">
              Saer Karo Travels is your one-stop solution for all travel requirements, 
              specializing in Umrah visa services, hotel bookings in Makkah and Madina, 
              and catering to B2B travel agents across Pakistan. We pride ourselves on 
              being the top travel provider in Punjab, offering competitive rates and 
              unparalleled services.
            </p>
            <p className="mb-4 text-muted">
              With years of experience, we have built a reputation for reliability, 
              transparency, and exceptional customer service. We ensure that your 
              complaints and inquiries are resolved quickly and efficiently, making 
              your experience smooth and stress-free.
            </p>
            <p className="mb-4 text-muted">
              Our services are tailored for agents and businesses looking for trusted 
              partners to handle their clients' travel needs with professionalism and care.
            </p>
            <div>
              <Button 
                size="lg"
                style={{ 
                  backgroundColor: '#1B78CE', 
                  borderColor: '#2563eb',
                  borderRadius: '25px',
                  padding: '12px 30px',
                  fontWeight: 'bold'
                }}
                className="shadow-sm"
              >
                Join Us
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default WhyChooseUs;