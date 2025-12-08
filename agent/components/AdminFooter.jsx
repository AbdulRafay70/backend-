import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import {
  Facebook,
  Twitter,
  Instagram,
  Youtube,
  Linkedin,
} from "react-bootstrap-icons";

const Footer = () => {
  return (
    <footer className="py-3">
      <Container>
        <Row className="align-items-center justify-content-between">
          <Col md="auto" className="mb-2 mb-md-0">
            <nav className="d-flex gap-3">
              <a href="#privacy" className="text-muted text-decoration-none">
                Privacy Policy
              </a>
              <a href="#terms" className="text-muted text-decoration-none">
                Terms and Conditions
              </a>
              <a href="#contact" className="text-muted text-decoration-none">
                Contact
              </a>
            </nav>
          </Col>
          <Col md="auto">
            <div className="d-flex gap-3">
              <a href="#facebook" className="text-muted">
                <Facebook size={20} />
              </a>
              <a href="#twitter" className="text-muted">
                <Twitter size={20} />
              </a>
              <a href="#instagram" className="text-muted">
                <Instagram size={20} />
              </a>
              <a href="#youtube" className="text-muted">
                <Youtube size={20} />
              </a>
              <a href="#linkedin" className="text-muted">
                <Linkedin size={20} />
              </a>
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;
