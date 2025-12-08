import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import api from '../../../utils/Api';
import { useToast } from './ToastProvider';

const AddCommissionModal = ({ show, onHide, employeeId, onSaved, employees }) => {
  const [form, setForm] = useState({ amount: '', booking: '', date: '' });
  const [selectedEmployee, setSelectedEmployee] = useState(employeeId || '');
  const [saving, setSaving] = useState(false);
  const { show: toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { employee: selectedEmployee || employeeId, ...form };
      const resp = await api.post('/hr/commissions/', payload);
      if (resp && resp.data) {
        toast('success', 'Saved', 'Commission added');
        onSaved && onSaved(resp.data);
      }
    } catch (err) {
      console.warn('Add commission backend failed', err?.message);
      toast('danger', 'Save failed', err?.response?.data?.detail || err?.message || 'Failed to save');
    } finally {
      setSaving(false);
      onHide && onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="modal-header-accent">
          <Modal.Title>Add Commission</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {(!employeeId && Array.isArray(employees) && employees.length > 0) && (
            <Form.Group className="mb-2">
              <Form.Label>Employee</Form.Label>
              <Form.Select value={selectedEmployee} onChange={(e)=>setSelectedEmployee(e.target.value)} required>
                <option value="">Select employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          <Form.Group className="mb-2">
            <Form.Label>Amount</Form.Label>
            <Form.Control required type="number" value={form.amount} onChange={(e)=>setForm({...form, amount:e.target.value})} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Booking</Form.Label>
            <Form.Control value={form.booking} onChange={(e)=>setForm({...form, booking:e.target.value})} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Due Date</Form.Label>
            <Form.Control type="date" value={form.date} onChange={(e)=>setForm({...form, date:e.target.value})} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="btn-ghost" onClick={onHide}>Cancel</Button>
          <Button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Add'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddCommissionModal;
