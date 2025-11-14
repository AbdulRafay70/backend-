import React from "react";
import { Card, Button } from "react-bootstrap";
import { CreditCard } from "lucide-react";
import KuickpayCheckoutButton from "../../components/KuickpayCheckoutButton";

const KuickpayCheckoutPage = () => {
  return (
    <div className="px-3 px-lg-4 my-3">
      <Card className="shadow-sm p-3">
        <h5><CreditCard size={18} className="me-2" />Kuickpay Demo Checkout</h5>
        <p>This page demonstrates embedding the Kuickpay checkout button into a booking flow.</p>
        <KuickpayCheckoutButton bookingId={"BKG-101"} amount={120} currency={"PKR"} />
      </Card>
    </div>
  );
};

export default KuickpayCheckoutPage;
