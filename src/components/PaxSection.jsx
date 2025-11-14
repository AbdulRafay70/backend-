import React, { useState } from "react";
import { Button, Form } from "react-bootstrap";
import { User } from "lucide-react";
import PaxDetailsModal, { getPaxDetails } from "./PaxDetailsModal";

const PaxSection = () => {
  const [paxDetails, setPaxDetails] = useState(null);
  const [paxModalOpen, setPaxModalOpen] = useState(false);

  const fetchPaxDetails = (paxId) => {
    const details = getPaxDetails(paxId);
    setPaxDetails(details);
    setPaxModalOpen(true);
  };

  return (
    <div>
      <h5 className="mb-3"><User size={18} className="me-2" />Pax Details</h5>
      
      <p>Select a pax from any tab to view full details, or enter Pax ID and click View.</p>
      <Form className="d-flex gap-2 mb-3" onSubmit={(e) => { e.preventDefault(); fetchPaxDetails(e.target.paxId.value); }}>
        <Form.Control name="paxId" placeholder="Enter Pax ID (e.g. PAX001)" />
        <Button type="submit">View</Button>
      </Form>

      <PaxDetailsModal 
        show={paxModalOpen} 
        onHide={() => setPaxModalOpen(false)} 
        paxDetails={paxDetails} 
      />
    </div>
  );
};

export default PaxSection;
