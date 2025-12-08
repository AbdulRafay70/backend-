import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, InputGroup, Form, Spinner, Tabs, Tab } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from '../../utils/Api';
import { ToastProvider, useToast } from './components/ToastProvider';
import { useEmployees, EmployeeProvider } from './components/EmployeeContext';
import EmployeeFilters from './components/EmployeeFilters';
import EmployeeList from './components/EmployeeList';
import AddEmployeeModal from './components/AddEmployeeModal';
import EditEmployeeModal from './components/EditEmployeeModal';
import './styles/hr.css';
import { useLocation, useNavigate } from 'react-router-dom';

const EmployeesInner = ({ embedded = false }) => {
  const { employees, loading: empLoading, refresh } = useEmployees();
  const { show: toast } = useToast();
  const [loading, setLoading] = useState(false); // used for search
  const [searchResults, setSearchResults] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ role: '', branch: '', is_active: '' });

  const token = localStorage.getItem('accessToken');

  const fetchEmployees = async (q = '') => {
    try {
      setLoading(true);
      const resp = await api.get('/hr/employees/', { params: q ? { search: q } : {} });
      const data = Array.isArray(resp.data) ? resp.data : resp.data.results || [];
      setSearchResults(data || []);
    } catch (err) {
      console.warn('Failed to fetch employees', err?.message);
      toast('danger', 'Failed to fetch employees', err?.message || '');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { /* initial list comes from EmployeeProvider */ }, []);

  const handleSearch = (e) => { e && e.preventDefault && e.preventDefault(); fetchEmployees(search); };
  const handleAdded = async (saved) => { setShowAdd(false); if (saved && saved.id) { await refresh(); } else { await refresh(); } };

  const location = useLocation();
  const navigate = useNavigate();

  const routeToKey = (pathname) => {
    if (pathname.startsWith('/hr/employees')) return 'employees';
    if (pathname.startsWith('/hr/attendance')) return 'attendance';
    if (pathname.startsWith('/hr/movements')) return 'movements';
    if (pathname.startsWith('/hr/commissions')) return 'commissions';
    if (pathname.startsWith('/hr/punctuality')) return 'punctuality';
    return 'dashboard';
  };

  const [localKey, setLocalKey] = useState(routeToKey(location.pathname));

  React.useEffect(()=>{ setLocalKey(routeToKey(location.pathname)); }, [location.pathname]);

  const content = (
    <div className="hr-container">
      <div className="hr-topbar">
        <div>
          <div className="title">Employees</div>
          <div className="subtitle">Manage employees — add, view, edit and deactivate</div>
        </div>
        <div className="hr-actions">
          <Button className="btn-primary" onClick={() => setShowAdd(true)}>Add Employee</Button>
        </div>
      </div>

        <div className="hr-cards">
        <div className="hr-card"><h4>Total</h4><p>{(searchResults || employees || []).length}</p></div>
        <div className="hr-card"><h4>Active</h4><p>{(searchResults || employees || []).filter(e=>e.is_active).length}</p></div>
        <div className="hr-card"><h4>Inactive</h4><p>{(searchResults || employees || []).filter(e=>!e.is_active).length}</p></div>
      </div>

      <div className="hr-panel">
        <Form onSubmit={handleSearch} className="d-flex align-items-center mb-3">
          <InputGroup style={{ maxWidth: 420 }}>
            <Form.Control placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <Button type="submit" variant="outline-secondary">Search</Button>
          </InputGroup>
          <div style={{marginLeft:12}}>
            <EmployeeFilters filters={filters} setFilters={setFilters} />
          </div>
        </Form>

        {loading ? (
          <div className="text-center py-5"><Spinner animation="border" /></div>
        ) : (
          <EmployeeList employees={searchResults || employees || []} refresh={fetchEmployees} onEdit={(e)=>{ setEditingEmployee(e); setShowEdit(true); }} />
        )}
      </div>

      <AddEmployeeModal show={showAdd} onHide={() => setShowAdd(false)} onAdded={handleAdded} />
      <EditEmployeeModal show={showEdit} onHide={() => setShowEdit(false)} employee={editingEmployee} onSaved={(data)=>{ setShowEdit(false); refresh(); }} />
    </div>
  );

  if (embedded) return <div className="hr-embedded">{content}</div>;

  return (
    <div className="d-flex hr-root">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        <Tabs
          activeKey={localKey}
          onSelect={(k) => {
            setLocalKey(k);
            switch (k) {
              case 'employees': navigate('/hr/employees'); break;
              case 'attendance': navigate('/hr/attendance'); break;
              case 'movements': navigate('/hr/movements'); break;
              case 'commissions': navigate('/hr/commissions'); break;
              case 'punctuality': navigate('/hr/punctuality'); break;
              default: navigate('/hr');
            }
          }}
          className="mb-3"
        >
          <Tab eventKey="dashboard" title="Dashboard" />
          <Tab eventKey="employees" title="Employees" />
          <Tab eventKey="attendance" title="Attendance" />
          <Tab eventKey="movements" title="Movements" />
          <Tab eventKey="commissions" title="Commissions" />
          <Tab eventKey="punctuality" title="Punctuality" />
        </Tabs>
        {content}
      </div>
    </div>
  );
};

const EmployeesPage = (props) => (
  <EmployeeProvider>
    <ToastProvider>
      <EmployeesInner {...props} />
    </ToastProvider>
  </EmployeeProvider>
);

export default EmployeesPage;
