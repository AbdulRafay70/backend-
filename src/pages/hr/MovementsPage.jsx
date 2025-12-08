import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Tabs, Tab } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from '../../utils/Api';
import { ToastProvider, useToast } from './components/ToastProvider';
import { useEmployees, EmployeeProvider } from './components/EmployeeContext';
import ConfirmModal from './components/ConfirmModal';
import './styles/hr.css';
import { useLocation, useNavigate } from 'react-router-dom';
import StartMovementModal from './components/StartMovementModal';

const MovementsInner = ({ embedded = false }) => {
  const [movements, setMovements] = useState([]);
  const { show: toast } = useToast();
  const { employees } = useEmployees();
  const [showStartModal, setShowStartModal] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const fetch = async () => {
    try {
      const resp = await api.get('/hr/movements/');
      if (Array.isArray(resp.data) && resp.data.length) setMovements(resp.data);
    } catch (e) { console.warn('Movements fetch failed', e?.message); toast('danger', 'Movements fetch failed', e?.message || ''); }
  };

  useEffect(()=>{ fetch(); }, []);

  const fmtDate = (d) => {
    if (!d) return '-';
    try { const dt = new Date(d); if (!isNaN(dt)) return dt.toLocaleDateString(); return d; } catch(e){ return d; }
  };
  const fmtTime = (d) => {
    if (!d) return '-';
    try { const dt = new Date(d); if (!isNaN(dt)) return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); return d; } catch(e){ return d; }
  };

  const endMovement = async (m) => {
    const now = new Date().toISOString();
    // optimistic update
    setMovements(prev => prev.map(x => x.id === m.id ? { ...x, end_time: now, duration: '—' } : x));
    try {
      const resp = await api.post(`/hr/movements/${m.id}/end/`, { end_time: now });
      if (resp && resp.data) {
        // replace with server version
        setMovements(prev => prev.map(x => x.id === resp.data.id ? resp.data : x));
        toast('success', 'Movement ended');
      }
    } catch (e) { console.warn('End movement failed', e?.message); toast('danger', 'End movement failed', e?.message || ''); }
  };

  const handleStartCreated = (created) => {
    if (!created) return;
    setMovements(prev => [created, ...prev]);
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
          <div className="title">Movement Logs</div>
          <div className="subtitle">Track out-of-office movements for employees</div>
        </div>
        <div className="hr-actions">
          <Button className="btn-primary" onClick={()=>setShowStartModal(true)}>Add Movement</Button>
        </div>
      </div>

      <div className="hr-panel">
        <Table responsive className="hr-table">
          <thead>
            <tr><th>Employee</th><th>Start</th><th>End</th><th>Duration</th><th>Reason</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {movements.length === 0 ? (
              <tr><td colSpan={6} className="text-center text-muted">No movements</td></tr>
            ) : movements.map((m,i)=> (
              <tr key={m.id||i}>
                <td>{
                  m.employee && typeof m.employee === 'object' ? `${m.employee.first_name || ''} ${m.employee.last_name || ''}` : (
                    (() => { const emp = employees && employees.find && employees.find(x => Number(x.id) === Number(m.employee)); return emp ? `${emp.first_name || ''} ${emp.last_name || ''}` : (m.employee || '-'); })()
                  )
                }</td>
                <td>{fmtDate(m.start_time)} {fmtTime(m.start_time)}</td>
                <td>{m.end_time ? `${fmtDate(m.end_time)} ${fmtTime(m.end_time)}` : '-'}</td>
                <td>{m.duration || '-'}</td>
                <td>{m.reason}</td>
                <td><Button size="sm" className="btn-ghost" onClick={()=>{ setConfirmTarget(m); setConfirmOpen(true); }}>End</Button></td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
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
        <StartMovementModal
          show={showStartModal}
          onHide={()=>setShowStartModal(false)}
          employees={employees}
          onCreated={handleStartCreated}
        />
        <ConfirmModal
          show={confirmOpen}
          title="End Movement"
          message={confirmTarget ? `Mark movement #${confirmTarget.id} as ended?` : 'Mark selected movement as ended?'}
          onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
          onConfirm={() => { if (confirmTarget) endMovement(confirmTarget); setConfirmOpen(false); setConfirmTarget(null); }}
          confirmLabel="End"
        />
      </div>
    </div>
  );
};

const MovementsPage = (props) => (
  <EmployeeProvider>
    <ToastProvider>
      <MovementsInner {...props} />
    </ToastProvider>
  </EmployeeProvider>
);

export default MovementsPage;
