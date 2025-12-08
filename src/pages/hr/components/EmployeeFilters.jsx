import React from 'react';
import { Form } from 'react-bootstrap';

const EmployeeFilters = ({ filters, setFilters }) => {
  return (
    <div className="d-flex gap-2 align-items-center">
      <Form.Select size="sm" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} style={{ minWidth: 140 }}>
        <option value="">All Roles</option>
        <option value="Sales">Sales</option>
        <option value="Admin">Admin</option>
        <option value="HR">HR</option>
      </Form.Select>
      <Form.Select size="sm" value={filters.is_active} onChange={(e) => setFilters({ ...filters, is_active: e.target.value })} style={{ minWidth: 140 }}>
        <option value="">All Status</option>
        <option value="true">Active</option>
        <option value="false">Inactive</option>
      </Form.Select>
    </div>
  );
};

export default EmployeeFilters;
