import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import api from '../../../utils/Api';
import { useToast } from './ToastProvider';

// Props:
// - show, onHide: modal visibility
// - employeeId: optional preselected employee id
// - employees: optional array of employee objects to choose from when employeeId is not provided
// - onCreated: optional callback(createdMovement) called after successful create
const StartMovementModal = ({ show, onHide, employeeId, employees = [], onCreated }) => {
  const [form, setForm] = useState({ reason: '', start_time: '', employee: employeeId || '' });
  const { show: toast } = useToast();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { employee: Number(form.employee || employeeId), reason: form.reason };
      if (form.start_time) payload.start_time = new Date(form.start_time).toISOString();

      let resp;
      if (form.id) {
        // editing existing movement
        resp = await api.patch(`/hr/movements/${form.id}/`, payload);
      } else {
        // create movement with start only (end handled separately)
        resp = await api.post('/hr/movements/', payload);
      }

      if (resp && resp.data) {
        onCreated && onCreated(resp.data);
        toast('success', 'Movement saved');
      }
    } catch (err) {
      console.warn('Start movement backend failed', err?.message);
      toast('danger', 'Failed to save movement', err?.message || '');
    } finally {
      setSaving(false);
      onHide && onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="modal-header-accent">
          <Modal.Title>Start Movement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!employeeId && (
            <Form.Group className="mb-2">
              <Form.Label>Employee</Form.Label>
              <Form.Control as="select" required value={form.employee} onChange={(e)=>setForm({...form, employee: e.target.value})}>
                <option value="">Select employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                ))}
              </Form.Control>
            </Form.Group>
          )}
          <Form.Group className="mb-2">
            <Form.Label>Reason</Form.Label>
            <Form.Control required value={form.reason} onChange={(e)=>setForm({...form, reason:e.target.value})} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Start Time</Form.Label>
            <Form.Control type="datetime-local" value={form.start_time} onChange={(e)=>setForm({...form, start_time:e.target.value})} />
          </Form.Group>
            {/* End time is intentionally omitted when creating a movement; closing movements is handled via the Movements list */}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="btn-ghost" onClick={onHide}>Cancel</Button>
          <Button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Starting...' : 'Start'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default StartMovementModal;
