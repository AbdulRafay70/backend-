import React from "react";
import { Container, Row, Col, Form, Button, InputGroup } from "react-bootstrap";
import { Envelope } from "react-bootstrap-icons";

const NewsletterSection = () => {
  return (
    <div
      className="py-5"
      style={{
        fontFamily: "Nunito Sans, sans-serif",
        backgroundColor: "#1976D2",
        borderRadius: "25px",
        margin: "40px 20px",
      }}
    >
      <Container className="text-center text-white">
        <h1 className="mb-5" style={{ fontWeight: "900" }}>
          Subscribe to Our Newsletter <br /> For Weekly Article Update.
        </h1>
        <p className="mb-5 px-md-5">
          We have plane-related blog so we can share our thought and rutinity in
          our
          <br />
          blog that updated weekly. We will not spam you, we promise.
        </p>
        <div className="d-flex justify-content-center gap-2">
          <div
            style={{
              backgroundColor: "#4DA3F1",
              borderRadius: "50px",
              overflow: "hidden",
              maxWidth: "500px",
            }}
            className="w-100 d-flex"
          >
            <InputGroup className="flex-nowrap w-100">
              <InputGroup.Text
                style={{
                  backgroundColor: "#4DA3F1",
                  border: "none",
                  color: "white",
                }}
              >
                <Envelope />
              </InputGroup.Text>
              <Form.Control
                type="email"
                placeholder="Enter your e-mail address"
                style={{
                  backgroundColor: "#4DA3F1",
                  border: "none",
                  color: "white",
                }}
              />
              
            </InputGroup>
          </div>
          <Button
                style={{
                  backgroundColor: "#1B78CE",
                  border: "none",
                  padding: "0 30px",
                  borderRadius: 0, // prevent extra round corners here
                }}
                className="fw-semibold shadow-sm rounded-pill"
              >
                Subscribe
              </Button>
        </div>
      </Container>
    </div>
  );
};

export default NewsletterSection;
