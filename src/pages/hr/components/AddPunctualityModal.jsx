import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import api from '../../../utils/Api';
import { useToast } from './ToastProvider';

const AddPunctualityModal = ({ show, onHide, initial = null, employees = [], employeeId = null, onSaved, forceDate = null }) => {
  const [form, setForm] = useState({ employee: employeeId || '', date: '', record_type: 'late', minutes: 0, notes: '' });
  const [saving, setSaving] = useState(false);
  const { show: toast } = useToast();

  useEffect(() => {
    if (initial) setForm({
      employee: initial.employee || employeeId || '',
      date: forceDate || initial.date || new Date().toISOString().slice(0,10),
      record_type: (initial.record_type || 'late').toString().toLowerCase(),
      minutes: initial.minutes || 0,
      notes: initial.notes || '',
    });
    else setForm({ employee: employeeId || '', date: forceDate || new Date().toISOString().slice(0,10), record_type: 'late', minutes: 0, notes: '' });
  }, [initial, show, employeeId, forceDate]);

  const handleSubmit = async (e) => {
    e && e.preventDefault && e.preventDefault();
    setSaving(true);
    try {
      // Backend expects: employee, date (YYYY-MM-DD), record_type, minutes, notes
      const payload = {
        employee: form.employee,
        date: forceDate || form.date,
        record_type: form.record_type,
        minutes: Number(form.minutes || 0),
        notes: form.notes,
      };

      let resp;
      if (initial && initial.id) {
        resp = await api.patch(`/hr/punctuality/${initial.id}/`, payload);
      } else {
        resp = await api.post('/hr/punctuality/', payload);
      }

      if (resp && resp.data) {
        toast('success', 'Saved', 'Punctuality record saved');
        onSaved && onSaved(resp.data);
      }
    } catch (err) {
      console.error('Save punctuality failed', err);
      toast('danger', 'Save failed', err?.response?.data?.detail || err.message || 'Failed to save');
    } finally {
      setSaving(false);
      onHide && onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="modal-header-accent">
          <Modal.Title>{initial ? 'Edit Record' : 'Add Punctuality Record'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          { !employeeId && (
            <Form.Group className="mb-2">
              <Form.Label>Employee</Form.Label>
              <Form.Control as="select" required value={form.employee} onChange={(e)=>setForm({...form, employee: e.target.value})}>
                <option value="">Select employee</option>
                {employees.map(emp => (<option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>))}
              </Form.Control>
            </Form.Group>
          )}

          <Form.Group className="mb-2">
            <Form.Label>Date</Form.Label>
            <Form.Control type="date" required value={form.date} onChange={(e)=>setForm({...form, date: e.target.value})} disabled={!!forceDate} />
            {forceDate && <div className="form-text">Date locked to {forceDate}</div>}
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Type</Form.Label>
            <Form.Control as="select" value={form.record_type} onChange={(e)=>setForm({...form, record_type: e.target.value})}>
              <option value="late">Late</option>
              <option value="early">Early</option>
            </Form.Control>
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Minutes</Form.Label>
            <Form.Control type="number" min={0} value={form.minutes} onChange={(e)=>setForm({...form, minutes: e.target.value})} />
          </Form.Group>

          <Form.Group className="mb-2">
            <Form.Label>Notes</Form.Label>
            <Form.Control as="textarea" rows={2} value={form.notes} onChange={(e)=>setForm({...form, notes: e.target.value})} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="btn-ghost" onClick={onHide}>Cancel</Button>
          <Button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : (initial ? 'Save' : 'Add')}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddPunctualityModal;
