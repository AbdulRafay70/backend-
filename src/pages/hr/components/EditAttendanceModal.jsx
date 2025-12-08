import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import api from '../../../utils/Api';
import { useToast } from './ToastProvider';

const EditAttendanceModal = ({ show, onHide, initial = null, employeeId = null, onSaved }) => {
  const [form, setForm] = useState({ date: '', check_in: '', check_out: '', status: 'present', notes: '' });
  const [saving, setSaving] = useState(false);
  const { show: toast } = useToast();

  useEffect(() => {
    if (initial) {
      setForm({
        date: initial.date || new Date().toISOString().slice(0,10),
        check_in: initial.check_in || '',
        check_out: initial.check_out || '',
        status: initial.status || 'present',
        notes: initial.notes || '',
      });
    } else {
      setForm({ date: new Date().toISOString().slice(0,10), check_in: '', check_out: '', status: 'present', notes: '' });
    }
  }, [initial, show]);

  const handleSubmit = async (e) => {
    e && e.preventDefault && e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        date: form.date,
        check_in: form.check_in || null,
        check_out: form.check_out || null,
        status: form.status,
        notes: form.notes,
        employee: employeeId || (initial && initial.employee) || null,
      };

      let resp;
      if (initial && initial.id) {
        resp = await api.patch(`/hr/attendance/${initial.id}/`, payload);
      } else {
        resp = await api.post('/hr/attendance/', payload);
      }

      if (resp && resp.data) {
        onSaved && onSaved(resp.data);
      }
    } catch (err) {
      console.error('Save attendance failed', err);
      toast('danger', 'Failed to save attendance', err?.message || '');
    } finally {
      setSaving(false);
      onHide && onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="modal-header-accent">
          <Modal.Title>{initial ? 'Edit Attendance' : 'Add Attendance'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2">
            <Form.Label>Date</Form.Label>
            <Form.Control type="date" value={form.date} onChange={(e)=>setForm({...form, date: e.target.value})} />
          </Form.Group>
          <Form.Group className="mb-2 d-flex gap-2">
            <div style={{flex:1}}>
              <Form.Label>Check In</Form.Label>
              <Form.Control type="time" value={form.check_in} onChange={(e)=>setForm({...form, check_in: e.target.value})} />
            </div>
            <div style={{flex:1}}>
              <Form.Label>Check Out</Form.Label>
              <Form.Control type="time" value={form.check_out} onChange={(e)=>setForm({...form, check_out: e.target.value})} />
            </div>
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Status</Form.Label>
            <Form.Control as="select" value={form.status} onChange={(e)=>setForm({...form, status: e.target.value})}>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
            </Form.Control>
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

export default EditAttendanceModal;
