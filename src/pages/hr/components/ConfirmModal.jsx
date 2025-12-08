import React from 'react';
import { Modal, Button } from 'react-bootstrap';

const ConfirmModal = ({ show, title = 'Confirm', message = 'Are you sure?', onCancel, onConfirm, confirmLabel = 'Yes', cancelLabel = 'Cancel' }) => {
  return (
    <Modal show={show} onHide={onCancel} centered>
      <Modal.Header closeButton className="modal-header-accent">
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div>{message}</div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="btn-ghost" onClick={onCancel}>{cancelLabel}</Button>
        <Button className="btn-primary" onClick={onConfirm}>{confirmLabel}</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmModal;
