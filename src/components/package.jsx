import React from "react";
import UmrahPackageCard from "./UmrahPackageCard";
import UmrahPackageCard1 from "./UmrahPackageCard1";
import { Container, Row, Col, Card, Button } from "react-bootstrap";


const Package = () => {
  return (
    <div className="my-5 py-5">
      <div className="mb-5">
        <h1
          style={{ fontFamily: "Nunito Sans, sans-serif", fontWeight: "900" }}
          className=" text-center"
        >
          All Packages
        </h1>
      </div>
      <Row>
        <Col>
          <UmrahPackageCard />
        </Col>
        <Col>
          <UmrahPackageCard1 />
        </Col>
        <Col>
          <UmrahPackageCard1 />
        </Col>
      </Row>

      <div className="d-flex align-items-center justify-content-center">
        <Button
          className="rounded-pill px-5 py-3 mt-5"
          style={{ background: "#1b78ce", border: "none" }}
        >
          View All
        </Button>
      </div>
    </div>
  );
};

export default Package;
