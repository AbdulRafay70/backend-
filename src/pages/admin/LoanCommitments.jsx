import React, { useEffect, useState } from "react";
import axios from "axios";
import "./styles/loan-commitments.css";

const todayStr = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const LoanCommitments = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [form, setForm] = useState({
    lead_id: null,
    booking_id: "",
    promised_clear_date: "",
    status: "pending",
    remarks: "",
    paid_amount: 0,
  });

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await axios.get("/api/leads/list/");
      // normalize response: backend may return { results: [...] } or plain array
      if (Array.isArray(res.data)) setLeads(res.data);
      else if (Array.isArray(res.data?.results)) setLeads(res.data.results);
      else setLeads([]);
    } catch (e) {
      console.error(e);
      setLeads([]);
    }
    setLoading(false);
  };

  // ensure we always operate on an array (some API responses may be objects)
  const leadsArray = Array.isArray(leads) ? leads : [];

  const loanLeads = leadsArray.filter((l) => l && (l.loan_amount || l.promised_clear_date || l.loan_status));

  const totalLoan = loanLeads.reduce((s, l) => s + (Number(l.loan_amount) || 0), 0);

  const dueTodayCount = loanLeads.filter((l) => l.promised_clear_date === todayStr() && (l.loan_status === "pending" || !l.loan_status)).length;

  const openModal = (lead) => {
    setSelectedLead(lead);
    setForm({
      lead_id: lead.id,
      booking_id: lead.booking_id || "",
      promised_clear_date: lead.promised_clear_date || "",
      status: lead.loan_status || "pending",
      remarks: lead.loan_remarks || "",
      paid_amount: 0,
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const submitCommitment = async () => {
    try {
      const payload = {
        lead_id: form.lead_id,
        booking_id: form.booking_id || null,
        promised_clear_date: form.promised_clear_date,
        status: form.status,
        remarks: form.remarks,
        paid_amount: form.paid_amount || 0,
      };
      await axios.post("/api/leads/loan-promise/", payload);
      setShowModal(false);
      fetchLeads();
      alert("Loan commitment saved");
    } catch (e) {
      console.error(e);
      alert("Failed to save commitment");
    }
  };

  const markCleared = async (lead) => {
    try {
      await axios.post("/api/leads/loan-promise/", { lead_id: lead.id, status: "cleared" });
      fetchLeads();
    } catch (e) {
      console.error(e);
      alert("Failed to mark cleared");
    }
  };

  return (
    <div className="loan-page p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Loan / Payment Commitments</h3>
        <div className="small-muted">Track promised payments and statuses</div>
      </div>

      <div className="card p-3 mb-3">
        <div className="d-flex gap-3 stats">
          <div className="stat">
            <div className="label">Total Loan Amount</div>
            <div className="value">PKR {totalLoan.toLocaleString()}</div>
          </div>
          <div className="stat">
            <div className="label">Due Today</div>
            <div className="value">{dueTodayCount}</div>
          </div>
        </div>
      </div>

      <div className="card p-3">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Name</th>
                <th>Loan Amount</th>
                <th>Promised Clear Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loanLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>{lead.customer_name}</td>
                  <td>PKR {Number(lead.loan_amount || 0).toLocaleString()}</td>
                  <td>{lead.promised_clear_date || lead.next_followup_date || "-"}</td>
                  <td>{lead.loan_status || lead.status || "pending"}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => openModal(lead)}>Add / Update</button>
                    {lead.loan_status !== "cleared" && (
                      <button className="btn btn-sm btn-success" onClick={() => markCleared(lead)}>Mark Cleared</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-card p-3">
            <h5>Loan Commitment - {selectedLead?.customer_name}</h5>
            <div className="form-group mt-2">
              <label>Booking ID (optional)</label>
              <input name="booking_id" value={form.booking_id} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group mt-2">
              <label>Promised Clear Date</label>
              <input type="date" name="promised_clear_date" value={form.promised_clear_date} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group mt-2">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="form-control">
                <option value="pending">Pending</option>
                <option value="cleared">Cleared</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div className="form-group mt-2">
              <label>Paid Amount (to deduct from total)</label>
              <input type="number" name="paid_amount" value={form.paid_amount} onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group mt-2">
              <label>Remarks</label>
              <textarea name="remarks" value={form.remarks} onChange={handleChange} className="form-control" />
            </div>
            <div className="mt-3 d-flex justify-content-end gap-2">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitCommitment}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanCommitments;
