import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import api from '../../../utils/Api';
import { useToast } from './ToastProvider';

const MovementViewModal = ({ show, onHide, movement = null, onSaved }) => {
  const [form, setForm] = useState({ id: null, employee: '', start_time: '', end_time: '', reason: '' });
  const [saving, setSaving] = useState(false);

  useEffect(()=>{
    if (movement) {
      setForm({
        id: movement.id || null,
        employee: movement.employee?.id || movement.employee || '',
        start_time: movement.start_time || '',
        end_time: movement.end_time || '',
        reason: movement.reason || '',
      });
    } else {
      setForm({ id: null, employee: '', start_time: '', end_time: '', reason: '' });
    }
  },[movement, show]);

  const { show: toast } = useToast();

  const handleSave = async (e) => {
    e && e.preventDefault && e.preventDefault();
    if (!form.id) return onHide && onHide();
    setSaving(true);
    try {
      const payload = {
        reason: form.reason,
      };
      if (form.start_time) payload.start_time = new Date(form.start_time).toISOString();
      if (form.end_time) payload.end_time = new Date(form.end_time).toISOString();

      const resp = await api.patch(`/hr/movements/${form.id}/`, payload);
      if (resp && resp.data) {
        onSaved && onSaved(resp.data);
        toast('success', 'Movement saved');
      }
    } catch (err) {
      console.error('Save movement failed', err);
      toast('danger', 'Failed to save movement', err?.message || '');
    } finally {
      setSaving(false);
      onHide && onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSave}>
        <Modal.Header closeButton className="modal-header-accent">
          <Modal.Title>Movement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2">
            <Form.Label>Start Time</Form.Label>
            <Form.Control type="datetime-local" value={form.start_time ? new Date(form.start_time).toISOString().slice(0,16) : ''} onChange={(e)=>setForm({...form, start_time: e.target.value})} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>End Time</Form.Label>
            <Form.Control type="datetime-local" value={form.end_time ? new Date(form.end_time).toISOString().slice(0,16) : ''} onChange={(e)=>setForm({...form, end_time: e.target.value})} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Reason</Form.Label>
            <Form.Control value={form.reason} onChange={(e)=>setForm({...form, reason: e.target.value})} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="btn-ghost" onClick={onHide}>Close</Button>
          <Button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default MovementViewModal;
