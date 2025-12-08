import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Button, Tabs, Tab } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from '../../utils/Api';
import './styles/hr.css';
import { useEmployees, EmployeeProvider } from './components/EmployeeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import AddCommissionModal from './components/AddCommissionModal';
import { ToastProvider, useToast } from './components/ToastProvider';

const CommissionsInner = ({ embedded = false }) => {
  const [commissions, setCommissions] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const { show: toast } = useToast();
  const { employees } = useEmployees();
  const fetch = async ()=>{
    try{
      const resp = await api.get('/hr/commissions/');
      setCommissions(resp.data || []);
    }catch(e){console.error(e); toast('danger','Fetch failed', e?.message || ''); setCommissions([]);}  
  };

  useEffect(()=>{fetch();},[]);

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

  const markPaid = async (c) => {
    try {
      const resp = await api.patch(`/hr/commissions/${c.id}/`, { status: 'paid' });
      if (resp && resp.data) {
        setCommissions(prev => prev.map(item => item.id === resp.data.id ? resp.data : item));
        toast('success','Updated','Commission marked paid');
      }
    } catch (e) { console.warn('Mark commission paid failed', e?.message); toast('danger','Update failed', e?.message || ''); }
  };

  const content = (
    <Container fluid className="p-3">
      <Row className="mb-3"><Col><h3>Commissions</h3></Col><Col className="text-end"><Button className="btn-primary" onClick={()=>setShowAdd(true)}>Add Commission</Button></Col></Row>
      <Card>
        <Card.Body>
          <Table responsive hover>
            <thead><tr><th>#</th><th>Employee</th><th>Booking</th><th>Amount</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {commissions.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-muted">No commissions</td></tr>
              ) : commissions.map((c,i)=> (
                <tr key={c.id||i}><td>{i+1}</td><td>{(() => {
                  try {
                    if (c.employee && typeof c.employee === 'number') {
                      const emp = (employees || []).find(e => e.id === Number(c.employee));
                      return emp ? `${emp.first_name} ${emp.last_name}` : c.employee;
                    }
                    return c.employee_display || (c.employee && typeof c.employee === 'object' ? `${c.employee.first_name} ${c.employee.last_name}` : c.employee);
                  } catch (ee) { return c.employee_display || c.employee; }
                })()}</td><td>{c.booking}</td><td>{c.amount}</td><td>{c.date}</td><td>{c.status}</td><td><Button size="sm" onClick={()=>markPaid(c)}>Mark Paid</Button></td></tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
      <AddCommissionModal show={showAdd} onHide={()=>{setShowAdd(false); fetch();}} onSaved={(c)=>{ setCommissions(prev => [c, ...prev]); }} employees={employees} />
    </Container>
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

const CommissionsPage = (props) => (
  <EmployeeProvider>
    <ToastProvider>
      <CommissionsInner {...props} />
    </ToastProvider>
  </EmployeeProvider>
);

export default CommissionsPage;
