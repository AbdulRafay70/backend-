import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import logo from "../assets/logo.png";
import { Facebook, Twitter, Instagram } from "react-bootstrap-icons";

const Footer = () => {
  return (
    <footer
      className="py-5"
      style={{ fontFamily: "Nunito Sans, sans-serif" }}
    >
      <Container>
        <Row className="align-items-start">
          {/* Logo and Description */}
          <Col md={6} className="mb-4 mb-md-0">
            <h2 className="fw-bold">
              <img src={logo} alt="" style={{height:"40px", width:"150px"}}/>
            </h2>
            <p className="text-muted mb-5 mt-5">
              2021 Award winning Plane Ticket
              <br />
              and Lorem ipsum dolor sit amet
            </p>
            {/* Social Icons */}
            <div className="d-flex gap-3">
              <a href="#" className="text-white text-decoration-none">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "#1976D2",
                    transition: "background 0.3s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#58AEFC")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "#1976D2")
                  }
                >
                  <Facebook />
                </div>
              </a>
              <a href="#" className="text-white text-decoration-none">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "#1976D2",
                    transition: "background 0.3s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#58AEFC")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "#1976D2")
                  }
                >
                  <Twitter />
                </div>
              </a>
              <a href="#" className="text-white text-decoration-none">
                <div
                  className="rounded-circle d-flex align-items-center justify-content-center"
                  style={{
                    width: "40px",
                    height: "40px",
                    background: "#1976D2",
                    transition: "background 0.3s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.background = "#58AEFC")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.background = "#1976D2")
                  }
                >
                  <Instagram />
                </div>
              </a>
            </div>
          </Col>

          {/* Links */}
          <Col md={2} className="mb-4 mb-md-0">
            <h6 className="fw-bold text-dark mb-3">Links</h6>
            <ul className="list-unstyled text-muted">
              <li>
                <a href="#" className="d-block text-decoration-none text-muted">
                  Home
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="d-block text-decoration-none text-muted mt-4"
                >
                  Our Partners
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="d-block text-decoration-none text-muted mt-4"
                >
                  All Packages
                </a>
              </li>
            </ul>
          </Col>

          {/* Contact */}
          <Col md={2}>
            <h6 className="fw-bold text-dark mb-3">Contact</h6>
            <ul className="list-unstyled text-muted">
              <li>
                <a href="#" className="text-decoration-none text-muted">
                  Contact Us
                </a>
              </li>
            </ul>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
