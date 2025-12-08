import React, { useEffect, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import api from '../../../utils/Api';
import { useToast } from './ToastProvider';

const AddSalaryModal = ({ show, onHide, employeeId, initial = null, onSaved, currentSalary }) => {
  const [form, setForm] = useState({ previous_salary: '', new_salary: '', reason: '' });
  const [prevReadOnly, setPrevReadOnly] = useState(false);
  const [saving, setSaving] = useState(false);
  const { show: toast } = useToast();

  useEffect(()=>{
    if (initial) {
      setForm({ previous_salary: initial.previous_salary || '', new_salary: initial.new_salary || '', reason: initial.reason || '' });
      setPrevReadOnly(false);
    } else {
      // when creating a new salary record, pre-fill previous_salary with current employee salary and make it read-only
      setForm({ previous_salary: currentSalary || '', new_salary: '', reason: '' });
      setPrevReadOnly(true);
    }
  },[initial, show, currentSalary]);

  const handleSubmit = async (e)=>{
    e && e.preventDefault && e.preventDefault();
    setSaving(true);
    try{
      const payload = { previous_salary: form.previous_salary, new_salary: form.new_salary, reason: form.reason, employee: employeeId };
      let resp;
      if (initial && initial.id) {
        resp = await api.patch(`/hr/salary-history/${initial.id}/`, payload);
      } else {
        resp = await api.post('/hr/salary-history/', payload);
      }
      if (resp && resp.data) {
        onSaved && onSaved(resp.data);
      }
    }catch(err){
      console.error('Salary save failed', err);
      toast('danger', 'Failed to save salary record', err?.message || '');
    }finally{
      setSaving(false);
      onHide && onHide();
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit}>
        <Modal.Header closeButton className="modal-header-accent">
          <Modal.Title>{initial ? 'Edit Salary Record' : 'Add Salary Record'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-2">
            <Form.Label>Previous Salary</Form.Label>
            <Form.Control value={form.previous_salary} onChange={(e)=>setForm({...form, previous_salary: e.target.value})} disabled={prevReadOnly} readOnly={prevReadOnly} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>New Salary</Form.Label>
            <Form.Control value={form.new_salary} onChange={(e)=>setForm({...form, new_salary: e.target.value})} />
          </Form.Group>
          <Form.Group className="mb-2">
            <Form.Label>Reason</Form.Label>
            <Form.Control value={form.reason} onChange={(e)=>setForm({...form, reason: e.target.value})} />
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

export default AddSalaryModal;
