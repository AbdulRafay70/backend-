import React from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

const EmployeeList = ({ employees = [], refresh = () => {}, onEdit = ()=>{} }) => {
  const navigate = useNavigate();
  return (
    <div className="table-responsive">
      <Table hover className="mb-0 hr-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Role</th>
            <th>Salary</th>
            <th>Status</th>
            <th>Last Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
              {employees.length === 0 ? (
            <tr><td colSpan={7} className="text-center text-muted">No employees found</td></tr>
          ) : employees.map((e) => (
            <tr key={e.id}>
              <td>{e.id}</td>
              <td>{e.first_name} {e.last_name}</td>
              <td>{e.role || '-'}</td>
              <td>{e.salary ? `${e.salary}` : '-'}</td>
              <td>{e.is_active ? <Badge bg="success">Active</Badge> : <Badge bg="secondary">Inactive</Badge>}</td>
              <td>{e.updated_at ? String(e.updated_at).replace('T',' ') : '-'}</td>
                <td>
                <Button size="sm" variant="outline-primary" className="me-1" onClick={() => navigate(`/hr/employees/${e.id}`)}>View</Button>
                <Button size="sm" variant="outline-secondary" onClick={() => onEdit(e)}>Edit</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default EmployeeList;
