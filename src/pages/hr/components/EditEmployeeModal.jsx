import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import api from '../../../utils/Api';
import { useToast } from './ToastProvider';

const EditEmployeeModal = ({ show, onHide, employee, onSaved }) => {
  const [form, setForm] = useState({ first_name: '', last_name: '', role: '', joining_date: '', salary: '', currency: 'PKR', is_active: true, email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const { show: toast } = useToast();

  useEffect(()=>{
    if (employee) {
      setForm({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        role: employee.role || '',
        joining_date: employee.joining_date || '',
        salary: employee.salary || '',
        currency: employee.currency || 'PKR',
        is_active: employee.is_active ?? true,
        email: employee.email || '',
        phone: employee.phone || '',
      });
    }
  },[employee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!employee || !employee.id) return;
    setSaving(true);
    try {
      const payload = { ...employee, ...form };
      const resp = await api.put(`/hr/employees/${employee.id}/`, payload);
      onSaved && onSaved(resp.data);
      onHide && onHide();
    } catch (err) {
      console.error('Failed to save employee', err);
      toast('danger', 'Failed to save employee', err?.message || '');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered size="md">
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="modal-header-accent">
          <Modal.Title>Edit Employee</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2">
            <Form.Label>First Name *</Form.Label>
            <Form.Control required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Last Name</Form.Label>
            <Form.Control value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Role</Form.Label>
            <Form.Control as="select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="">Select role</option>
              <option>Manager</option>
              <option>Sales</option>
              <option>Cashier</option>
              <option>HR</option>
              <option>Admin</option>
              <option>Support</option>
              <option>Finance</option>
            </Form.Control>
          </Form.Group>
          <Form.Group className="mb-2 d-flex gap-2">
            <div style={{flex:1}}>
              <Form.Label>Joining Date</Form.Label>
              <Form.Control type="date" value={form.joining_date} onChange={(e) => setForm({ ...form, joining_date: e.target.value })} />
            </div>
            <div style={{width:140}}>
              <Form.Label>Salary</Form.Label>
              <Form.Control type="number" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
            </div>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Email</Form.Label>
            <Form.Control type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Phone</Form.Label>
            <Form.Control value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="btn-ghost" onClick={onHide}>Cancel</Button>
          <Button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditEmployeeModal;
