import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import client from "../assets/client.jpg";
import e1 from "../assets/1.png";
import e2 from "../assets/2.png";

const ClientReviews = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  const reviews = [
    {
      id: 1,
      name: "Steven Gill",
      position: "Head of Sales",
      image: "",
      review:
        "Simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essential!",
    },
    {
      id: 2,
      name: "Sarah Johnson",
      position: "Travel Agent",
      image: "",
      review:
        "Exceptional service and support from Saer Karo Travels. Their team handled all our Umrah bookings with utmost professionalism. The visa processing was smooth and hassle-free. Highly recommended for all travel agents looking for reliable partners.",
    },
    {
      id: 3,
      name: "Ahmed Khan",
      position: "Business Owner",
      image: "",
      review:
        "Outstanding experience with Saer Karo Travels. Their competitive pricing and excellent customer service made our partnership very successful. The 24/7 support really sets them apart from other travel companies.",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % reviews.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [reviews.length]);

  const handleDotClick = (index) => {
    setActiveSlide(index);
  };

  return (
    <div className="py-5" style={{ fontFamily: "Nunito Sans, sans-serif" }}>
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .profile-card {
            transition: all 0.5s ease-in-out;
          }

          .dot-button {
            transition: all 0.3s ease;
          }

          .dot-button:hover {
            transform: scale(1.2);
          }
        `}
      </style>

      <Container>
        <Row className="text-center mb-5">
          <Col>
            <h2 className="mb-3" style={{ fontSize: "2.5rem", fontWeight: "900" }}>
              Our Stories
            </h2>
            <p className="text-muted fs-5">Here are the reviews from our partner</p>
          </Col>
        </Row>

        <Row className="align-items-center">
          <Col lg={4} md={6} className="mb-4 d-flex justify-content-center">
            <div className="position-relative" style={{ width: "250px" }}>
              <div
                style={{
                  width: "100%",
                  height: "40px",
                  backgroundColor: "#3498db",
                  borderTopLeftRadius: "40px",
                  borderTopRightRadius: "40px",
                  position: "absolute",
                  top: "-20px",
                  zIndex: 0,
                }}
              ></div>

              <Card
                className="text-center shadow"
                style={{
                  borderRadius: "30px",
                  padding: "1.5rem 1rem",
                  backgroundColor: "white",
                  zIndex: 1,
                  position: "relative",
                  width: "250px",
                }}
              >
                <Card.Img
                  variant="top"
                  src={client}
                  alt="Profile"
                  style={{
                    width: "100%",
                    height: "250px",
                    objectFit: "cover",
                    borderRadius: "10px",
                  }}
                />
                <Card.Body>
                  <h5 className="fw-bold text-dark mt-3 mb-1">
                    {reviews[activeSlide].name}
                  </h5>
                  <p className="text-muted mb-0">{reviews[activeSlide].position}</p>
                </Card.Body>
              </Card>

              <div
                style={{
                  width: "100%",
                  height: "40px",
                  backgroundColor: "#3498db",
                  borderBottomLeftRadius: "40px",
                  borderBottomRightRadius: "40px",
                  position: "absolute",
                  bottom: "-20px",
                  zIndex: 0,
                }}
              ></div>
            </div>
          </Col>

          <Col lg={7} md={7}>
            <div className="ps-lg-4">
              <h3 className="mb-4 fw-bold" style={{ color: "#2c3e50", fontSize: "1.8rem" }}>
                Client Reviews
              </h3>

              <div className="mb-3">
                <img src={e1} alt="quote" />
              </div>

              <div
                key={activeSlide}
                className="px-5 px-md-5"
                style={{ animation: "fadeIn 0.5s ease-in-out" }}
              >
                <p
                  className="text-muted mb-4"
                  style={{ fontSize: "1.1rem", lineHeight: "1.8" }}
                >
                  {reviews[activeSlide].review}
                </p>
              </div>

              <div className="text-end mb-4 pe-3">
                <img src={e2} alt="quote end" />
              </div>

              <div className="d-flex justify-content-center justify-content-md-start gap-2">
                {reviews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleDotClick(index)}
                    className="btn p-0 border-0 dot-button"
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      backgroundColor: activeSlide === index ? "#3498db" : "#d1d5db",
                      transition: "all 0.3s ease",
                    }}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ClientReviews;
