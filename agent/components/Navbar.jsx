import React from "react";
import { Navbar, Nav, Container, Offcanvas } from "react-bootstrap";
import logo from "../assets/logo.png";

const Navbar1 = () => {
  return (
    <>
      <Navbar expand="lg">
        <Container>
          {/* Logo */}
          <Navbar.Brand href="/" className="fw-bold fs-3">
            <img src={logo} alt="Logo" style={{ height: "40px" }} />
          </Navbar.Brand>

          {/* Toggle Button */}
          <Navbar.Toggle aria-controls="offcanvasNavbar" />

          {/* Offcanvas Navbar (right side) */}
          <Navbar.Offcanvas
            id="offcanvasNavbar"
            aria-labelledby="offcanvasNavbarLabel"
            placement="end"  // 👈 Change this to "end"
          >
            <Offcanvas.Header closeButton>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Nav className="justify-content-end flex-grow-1 pe-3 fw-medium">
                <Nav.Link href="#home" className="mx-2">Home</Nav.Link>
                <Nav.Link href="#partner" className="mx-2">Our Partner</Nav.Link>
                <Nav.Link href="#packages" className="mx-2">All Packages</Nav.Link>
                <Nav.Link href="#orders" className="mx-2">Orders Status</Nav.Link>
                <Nav.Link href="#contact" className="mx-2">Contact</Nav.Link>
              </Nav>
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        </Container>
      </Navbar>
    </>
  );
};

export default Navbar1;
