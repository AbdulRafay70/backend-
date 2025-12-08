import React, { useState } from "react";
import { Button, Modal, Form } from "react-bootstrap";
import { CreditCard } from "lucide-react";

const KuickpayCheckoutButton = ({ bookingId = "BKG-101", amount = 120.0, currency = "PKR" }) => {
  const [show, setShow] = useState(false);
  const [customer, setCustomer] = useState({ name: "Ali Raza", email: "ali@example.com", phone: "+923000709017" });

  const handleStart = () => setShow(true);
  const handleCheckout = () => {
    // demo: pretend to create checkout session and redirect
    const checkoutUrl = `https://kuickpay.example/checkout?session=demo-${Date.now()}`;
    alert(`Redirecting to checkout (demo): ${checkoutUrl}`);
    setShow(false);
    // In real integration, redirect window.location = checkoutUrl
  };

  return (
    <>
      <Button variant="primary" onClick={handleStart}><CreditCard size={14} className="me-1" />Pay with Kuickpay</Button>
      <Modal show={show} onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Kuickpay Checkout (Demo)</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p><strong>Booking:</strong> {bookingId}</p>
          <p><strong>Amount:</strong> {amount} {currency}</p>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Full name</Form.Label>
              <Form.Control value={customer.name} onChange={(e) => setCustomer(c => ({ ...c, name: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Email</Form.Label>
              <Form.Control value={customer.email} onChange={(e) => setCustomer(c => ({ ...c, email: e.target.value }))} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Phone</Form.Label>
              <Form.Control value={customer.phone} onChange={(e) => setCustomer(c => ({ ...c, phone: e.target.value }))} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShow(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleCheckout}>Proceed to Checkout</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default KuickpayCheckoutButton;
