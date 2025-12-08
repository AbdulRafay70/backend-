import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Tabs, Tab } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from '../../utils/Api';
import AddPunctualityModal from './components/AddPunctualityModal';
import ConfirmModal from './components/ConfirmModal';
import { ToastProvider, useToast } from './components/ToastProvider';
import { useEmployees, EmployeeProvider } from './components/EmployeeContext';
import './styles/hr.css';
import { useLocation, useNavigate } from 'react-router-dom';

const demoPunctuality = [
  { id: 41, employee: { id: 11, first_name: 'Aisha' }, date: '2025-11-24', record_type: 'Late', minutes: 12, notes: 'Traffic' },
  { id: 42, employee: { id: 12, first_name: 'Omar' }, date: '2025-11-25', record_type: 'Early', minutes: 5, notes: 'Left early' },
];

const InnerPunctuality = ({ embedded = false }) => {
  const todayStr = new Date().toISOString().slice(0,10);
  const [records, setRecords] = useState([]);
  const [dateFilter, setDateFilter] = useState(todayStr);
  const { employees } = useEmployees();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);
  const { show: toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const fetch = async ()=>{
    try{
      const resp = await api.get('/hr/punctuality/', { params: { date: dateFilter } });
      if (Array.isArray(resp.data)) setRecords(resp.data);
    }catch(e){console.warn('Punctuality fetch failed', e?.message);}  
  };

  useEffect(()=>{fetch();},[dateFilter]);

  const openAdd = () => { setEditing(null); setShowAdd(true); };

  const handleSaved = (saved) => {
    if (!saved) return;
    setRecords(prev => {
      const exists = prev.find(r => r.id === saved.id);
      if (exists) return prev.map(p => p.id === saved.id ? saved : p);
      return [saved, ...prev];
    });
    toast('success', 'Saved', 'Punctuality saved');
  };

  const handleEdit = (r) => { setEditing(r); setShowAdd(true); };

  const handleDelete = (r) => {
    setConfirmTarget(r);
    setConfirmOpen(true);
  };

  const doDelete = async () => {
    const r = confirmTarget;
    if (!r) return setConfirmOpen(false);
    try {
      await api.delete(`/hr/punctuality/${r.id}/`);
      setRecords(prev => prev.filter(x => x.id !== r.id));
      toast('success', 'Deleted', 'Punctuality record deleted');
    } catch (e) { console.warn('Delete failed', e?.message); toast('danger', 'Delete failed', e?.message || ''); }
    setConfirmOpen(false);
    setConfirmTarget(null);
  };

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

  const [localKey, setLocalKey] = React.useState(routeToKey(location.pathname));
  React.useEffect(()=>{ setLocalKey(routeToKey(location.pathname)); }, [location.pathname]);

  const content = (
    <div className="hr-container">
      <div className="hr-topbar">
        <div>
          <div className="title">Punctuality</div>
          <div className="subtitle">Late / early records and minutes — showing for {dateFilter}</div>
        </div>
        <div className="hr-actions">
          <Button className="btn-primary" onClick={openAdd}>Add Record</Button>
        </div>
      </div>

      <div className="hr-panel">
        <Table responsive className="hr-table">
          <thead><tr><th>#</th><th>Employee</th><th>Date</th><th>Type</th><th>Minutes</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody>
            {records.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-muted">No records</td></tr>
            ) : records.map((r,i)=>(
              <tr key={r.id||i}>
                <td>{i+1}</td>
                <td>{(() => {
                  try {
                    // If employee is an object with fields, use it
                    if (r.employee && typeof r.employee === 'object') {
                      return `${r.employee.first_name || ''} ${r.employee.last_name || ''}`.trim() || r.employee_display || '-';
                    }
                    // Try to resolve by id (supports numeric or string id)
                    const empId = Number(r.employee);
                    if (!isNaN(empId) && employees && employees.length) {
                      const emp = employees.find(e => Number(e.id) === empId);
                      if (emp) return `${emp.first_name || ''} ${emp.last_name || ''}`.trim();
                    }
                    return r.employee_display || r.employee || '-';
                  } catch (ee) { return r.employee_display || r.employee || '-'; }
                })()}</td>
                <td>{r.date}</td>
                <td>{r.record_type}</td>
                <td>{r.minutes}</td>
                <td>{r.notes}</td>
                <td>
                  <Button size="sm" className="me-1" onClick={()=>handleEdit(r)}>Edit</Button>
                  <Button size="sm" variant="danger" onClick={()=>handleDelete(r)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      <AddPunctualityModal show={showAdd} onHide={()=>setShowAdd(false)} initial={editing} employees={employees} onSaved={handleSaved} forceDate={dateFilter} />
      <ConfirmModal show={confirmOpen} title="Delete record" message={confirmTarget ? `Delete punctuality record #${confirmTarget.id}?` : 'Delete record?'} onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }} onConfirm={doDelete} confirmLabel="Delete" />
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

const PunctualityPage = (props) => (
  <EmployeeProvider>
    <ToastProvider>
      <InnerPunctuality {...props} />
    </ToastProvider>
  </EmployeeProvider>
);

export default PunctualityPage;
