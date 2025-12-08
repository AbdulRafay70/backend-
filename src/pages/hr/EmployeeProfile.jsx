import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Tabs, Tab, Breadcrumb } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from '../../utils/Api';
import './styles/hr.css';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import EmployeesPage from './EmployeesPage';
import AttendancePage from './AttendancePage';
import MovementsPage from './MovementsPage';
import CommissionsPage from './CommissionsPage';
import PunctualityPage from './PunctualityPage';
import AddCommissionModal from './components/AddCommissionModal';
import StartMovementModal from './components/StartMovementModal';
import AddSalaryModal from './components/AddSalaryModal';
import AddPunctualityModal from './components/AddPunctualityModal';
import EditAttendanceModal from './components/EditAttendanceModal';
import MovementViewModal from './components/MovementViewModal';
import { ToastProvider, useToast } from './components/ToastProvider';

const EmployeeProfileInner = ({ embedded = false }) => {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', role: '', joining_date: '', email: '', phone: '' });

  const navigate = useNavigate();
  const [showCommission, setShowCommission] = useState(false);
  const [showMovement, setShowMovement] = useState(false);
  const [quickStatus, setQuickStatus] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [commissionBooking, setCommissionBooking] = useState('');
  const [commissionFilter, setCommissionFilter] = useState('All');

  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().slice(0,10));
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [showEditAttendance, setShowEditAttendance] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);

  const [movements, setMovements] = useState([]);
  const [punctualityRows, setPunctualityRows] = useState([]);
  const [showMovementView, setShowMovementView] = useState(false);
  const [viewingMovement, setViewingMovement] = useState(null);
  const [salaryHistory, setSalaryHistory] = useState([]);
  const [showAddSalary, setShowAddSalary] = useState(false);
  const [showAddPunctuality, setShowAddPunctuality] = useState(false);
  const { show: toast } = useToast();

  const location = useLocation();
  const routeToKey = (pathname) => {
    if (pathname.startsWith('/hr/employees')) return 'employees';
    if (pathname.startsWith('/hr/attendance')) return 'attendance';
    if (pathname.startsWith('/hr/movements')) return 'movements';
    if (pathname.startsWith('/hr/commissions')) return 'commissions';
    if (pathname.startsWith('/hr/punctuality')) return 'punctuality';
    return 'dashboard';
  };
  const [localKey, setLocalKey] = React.useState(routeToKey(location.pathname));
  React.useEffect(() => { setLocalKey(routeToKey(location.pathname)); }, [location.pathname]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const resp = await api.get(`/hr/employees/${id}/`);
        setEmployee(resp.data);
        setForm({
          first_name: resp.data.first_name || '',
          last_name: resp.data.last_name || '',
          role: resp.data.role || '',
          joining_date: resp.data.joining_date || '',
          email: resp.data.email || '',
          phone: resp.data.phone || '',
        });
      } catch (e) {
        console.error(e);
      }
    };
    if (id) fetch();
  }, [id]);

  // load related lists when employee loads
  useEffect(()=>{
    if (!id) return;
    const load = async () => {
      // commissions
      try{
        const c = await api.get(`/hr/commissions/?employee=${id}`);
        setCommissions(Array.isArray(c.data) ? c.data : c.data.results || []);
      }catch(e){
        console.warn('Failed to load commissions, using empty', e?.message);
        setCommissions([]);
      }
      // movements
      try{
        const m = await api.get(`/hr/movements/?employee=${id}`);
        setMovements(Array.isArray(m.data) ? m.data : m.data.results || []);
      }catch(e){
        setMovements([]);
      }
      // punctuality
      try{
        const p = await api.get(`/hr/punctuality/?employee=${id}`);
        setPunctualityRows(Array.isArray(p.data) ? p.data : p.data.results || []);
      }catch(e){
        setPunctualityRows([]);
      }
      // attendance for default date
            // salary history
            try{
              const s = await api.get(`/hr/salary-history/?employee=${id}`);
              setSalaryHistory(Array.isArray(s.data) ? s.data : s.data.results || []);
            }catch(e){
              setSalaryHistory([]);
            }
      try{
        const a = await api.get(`/hr/attendance/?employee=${id}&date=${attendanceDate}`);
        setAttendanceRows(Array.isArray(a.data) ? a.data : a.data.results || []);
      }catch(e){
        setAttendanceRows([]);
      }
    };
    load();
  },[id]);

  const handleSave = async () => {
    if (!id) return toast('warning', 'No employee selected');
    try {
      // merge existing employee with form values to avoid dropping fields server expects
      const payload = { ...employee, ...form };
      const resp = await api.put(`/hr/employees/${id}/`, payload);
      setEmployee(resp.data);
      setForm(prev => ({ ...prev, email: resp.data.email || prev.email, phone: resp.data.phone || prev.phone }));
      toast('success', 'Employee updated');
    } catch (err) {
      console.error(err);
      toast('danger', 'Failed to update employee', err?.message || '');
    }
  };



  const handleQuickCheckIn = async () => {
    if (!employee) return;
    try {
      await api.post('/hr/attendance/check_in/', { employee: employee.id });
      setQuickStatus('IN');
      toast('success', 'Checked in');
    } catch (e) {
      // fallback optimistic
      setQuickStatus('IN');
      console.warn('Check-in failed, optimistic update used', e?.message);
      toast('warning', 'Checked in (optimistic)');
    }
  };

  const handleStartMovement = () => setShowMovement(true);
  const handleAddCommission = () => setShowCommission(true);

  const loadCommissions = async () => {
    if (!id) return;
    try{
      const res = await api.get(`/hr/commissions/?employee=${id}`);
      setCommissions(Array.isArray(res.data) ? res.data : res.data.results || []);
    }catch(err){
      console.warn(err);
    }
  };

  const handleMarkCommissionPaid = async (commissionId) => {
    // optimistic update
    setCommissions(list => list.map(c=> c.id===commissionId ? {...c, status: 'Paid'} : c));
    try{
      await api.patch(`/hr/commissions/${commissionId}/`, { status: 'Paid' });
    }catch(e){
      console.warn('mark paid failed', e?.message);
    }
  };

  const handleLoadAttendance = async () => {
    if (!id) return;
    try{
      const res = await api.get(`/hr/attendance/?employee=${id}&date=${attendanceDate}`);
      setAttendanceRows(Array.isArray(res.data) ? res.data : res.data.results || []);
    }catch(e){
      // wireframe fallback: populate with dummy rows
      const rows = [];
      for(let i=1;i<=3;i++) rows.push({ id: i, date: attendanceDate, check_in: `09:0${i}`, check_out: `17:5${i}`, working_hours: `8h${i}m`, status: 'Present' });
      setAttendanceRows(rows);
    }
  };

  const handleAddAttendanceRow = () => {
    const r = { id: Math.floor(Math.random()*100000), date: attendanceDate, check_in: '-', check_out: '-', working_hours: '-', status: 'Pending' };
    setAttendanceRows(prev => [r, ...prev]);
  };

  const handleOpenEditAttendance = (row) => { setEditingAttendance(row); setShowEditAttendance(true); };

  const handleAttendanceSaved = (saved) => {
    if (!saved) return;
    setAttendanceRows(prev => {
      const exists = prev.find(r => r.id === saved.id);
      if (exists) return prev.map(r => r.id === saved.id ? saved : r);
      return [saved, ...prev];
    });
  };

  const handleOpenMovementView = (m) => { setViewingMovement(m); setShowMovementView(true); };

  const handleMovementSaved = (m) => {
    if (!m) return;
    setMovements(prev => {
      const exists = prev.find(x => x.id === m.id);
      if (exists) return prev.map(x => x.id === m.id ? m : x);
      return [m, ...prev];
    });
  };

  // simple date/time formatters for display
  const fmtDate = (d) => {
    if (!d) return '-';
    try {
      // if it's already a YYYY-MM-DD string
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        const dt = new Date(d + 'T00:00:00');
        return dt.toLocaleDateString();
      }
      const dt = new Date(d);
      if (!isNaN(dt)) return dt.toLocaleDateString();
      return d;
    } catch (e) { return d; }
  };

  const fmtTime = (t) => {
    if (!t) return '-';
    try {
      // time only like HH:MM or HH:MM:SS
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(t)) return t;
      const dt = new Date(t);
      if (!isNaN(dt)) return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return t;
    } catch (e) { return t; }
  };

  const content = (
    <Container fluid className="hr-container">
      <Row className="mb-3 align-items-center">
        <Col>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button className="btn-ghost" onClick={() => navigate('/hr?tab=employees')}>Back</Button>
            <h3 style={{ margin: 0 }}>Employee Profile</h3>
          </div>

        </Col>
        <Col xs="auto">
          <Button className="btn-primary me-2" onClick={handleSave}>Save</Button>
          <Button className="btn-ghost">More</Button>
        </Col>
      </Row>
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

      <Row>
        <Col xs={12} md={4}>
          <Card className="mb-3 hr-panel">
            <Card.Body>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="avatar" style={{ width: 72, height: 72, fontSize: 20 }}>{employee ? `${(employee.first_name || '')[0]}${(employee.last_name || '')[0]}` : 'NN'}</div>
                <div>
                  <h4 style={{ margin: 0 }}>{employee ? `${employee.first_name} ${employee.last_name || ''}` : 'Employee'}</h4>
                  <div className="small-muted">Role: {employee?.role || '-'}</div>
                  <div className="small-muted">Joined: {employee?.joining_date || '-'}</div>
                </div>
              </div>

              <hr />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div><strong>Salary</strong><div>PKR {employee?.salary || '50,000'}</div></div>
                <div><strong>Status</strong><div className="status-chip status-in" style={{ display: 'inline-block', marginTop: 6 }}>{quickStatus || (employee?.is_active ? 'Active' : 'Inactive')}</div></div>
              </div>

              <hr />
              <h6>Quick Actions</h6>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                <Button className="btn-primary" onClick={handleQuickCheckIn}>Check In</Button>
                <Button className="btn-ghost" onClick={handleStartMovement}>Start Movement</Button>
                <Button className="btn-ghost" onClick={handleAddCommission}>Add Commission</Button>
              </div>

              <hr />
              <h6>Contact</h6>
              <div className="small-muted">Email: {form.email || employee?.email || '-'}</div>
              <div className="small-muted">Phone: {form.phone || employee?.phone || '-'}</div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} md={8}>
          <Card className="hr-panel">
            <Card.Body>
              {/* summary cards removed from profile - summaries live in Attendance page now */}
              {/* HR Tabs for navigating between HR sections while on profile */}

              <Tabs defaultActiveKey="info" id="employee-tabs" className="mb-3">
                <Tab eventKey="info" title="Info">
                  <div className="p-3">
                    <h5>Basic Info</h5>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label>First name</label>
                        <input className="form-control" value={form.first_name} onChange={(e)=>setForm(f=>({...f, first_name: e.target.value}))} />
                      </div>
                      <div>
                        <label>Last name</label>
                        <input className="form-control" value={form.last_name} onChange={(e)=>setForm(f=>({...f, last_name: e.target.value}))} />
                      </div>
                      <div>
                        <label>Role</label>
                        <select className="form-control" value={form.role} onChange={(e)=>setForm(f=>({...f, role: e.target.value}))}>
                          <option value="">Select...</option>
                          <option>Manager</option>
                          <option>Sales</option>
                          <option>Cashier</option>
                          <option>HR</option>
                          <option>Admin</option>
                          <option>Support</option>
                          <option>Finance</option>
                        </select>
                      </div>
                      <div>
                        <label>Joining date</label>
                        <input type="date" className="form-control" value={form.joining_date} onChange={(e)=>setForm(f=>({...f, joining_date: e.target.value}))} />
                      </div>
                      <div>
                        <label>Email</label>
                        <input className="form-control" type="email" value={form.email} onChange={(e)=>setForm(f=>({...f, email: e.target.value}))} />
                      </div>
                      <div>
                        <label>Phone</label>
                        <input className="form-control" value={form.phone} onChange={(e)=>setForm(f=>({...f, phone: e.target.value}))} />
                      </div>
                    </div>
                    <hr />
                    {/* linked user removed per request */}
                  </div>
                </Tab>
                <Tab eventKey="salary" title="Salary">
                  <div className="p-3">
                    <h3>Salary & History</h3>
                    <div className="card-section">
                      <p>Current salary: <strong>PKR {employee?.salary || '50,000'}</strong></p>
                      <Button className="btn" onClick={() => setShowAddSalary(true)}>Add / Change Salary</Button>
                    </div>
                    <table className="table">
                      <thead><tr><th>Date</th><th>Previous</th><th>New</th><th>Reason</th></tr></thead>
                      <tbody>
                        {salaryHistory.length === 0 && <tr><td colSpan={4} className="muted">No salary history</td></tr>}
                        {salaryHistory.map(s => (
                          <tr key={s.id}>
                            <td>{s.changed_on ? s.changed_on.split('T')[0] : (s.created_at ? s.created_at.split('T')[0] : '-')}</td>
                            <td>{s.previous_salary}</td>
                            <td>{s.new_salary}</td>
                            <td>{s.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Tab>

                <Tab eventKey="commissions" title="Commissions">
                  <div className="p-3">
                    <h3>Commissions</h3>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <input className="form-control" placeholder="Booking ID" value={commissionBooking} onChange={(e)=>setCommissionBooking(e.target.value)} style={{maxWidth:200}} />
                      <select className="form-control" value={commissionFilter} onChange={(e)=>setCommissionFilter(e.target.value)} style={{maxWidth:140}}>
                        <option>All</option>
                        <option>Unpaid</option>
                        <option>Paid</option>
                      </select>
                      <Button className="btn small" onClick={loadCommissions}>Filter</Button>
                      <Button className="btn outline ms-2" onClick={()=>setShowCommission(true)}>Add Commission</Button>
                    </div>
                    <table className="table">
                      <thead><tr><th>ID</th><th>Booking</th><th>Amount</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {commissions.length === 0 && <tr><td colSpan={5} className="muted">No commissions</td></tr>}
                        {commissions.map(c => (
                          <tr key={c.id}>
                            <td>{c.id}</td>
                            <td>{c.booking_reference || c.booking || '-'}</td>
                            <td>{c.amount || '-'}</td>
                            <td><span className={`badge ${c.status && c.status.toLowerCase()==='paid' ? 'success' : 'warn'}`}>{c.status || 'Unpaid'}</span></td>
                            <td>{c.status && c.status.toLowerCase()==='paid' ? null : <Button size="sm" className="btn-ghost" onClick={()=>handleMarkCommissionPaid(c.id)}>Mark Paid</Button>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Tab>

                <Tab eventKey="attendance" title="Attendance">
                  <div className="p-3">
                    <h3>Attendance</h3>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                      <label style={{display:'flex',alignItems:'center',gap:8}}>Date <input type="date" className="form-control" value={attendanceDate} onChange={(e)=>setAttendanceDate(e.target.value)} style={{maxWidth:180}} /></label>
                      <Button className="btn small" onClick={handleLoadAttendance}>Load</Button>
                      <Button className="btn small outline ms-2" onClick={handleAddAttendanceRow}>Add Row</Button>
                    </div>
                    <div className="table-responsive">
                      <table className="table">
                      <thead><tr><th>Date</th><th>Check-in</th><th>Check-out</th><th>Working Hours</th><th>Status</th><th>Actions</th></tr></thead>
                      <tbody>
                        {attendanceRows.length===0 && <tr><td colSpan={6} className="muted">No attendance records</td></tr>}
                        {attendanceRows.map(r => (
                          <tr key={r.id}>
                            <td>{fmtDate(r.date)}</td>
                            <td>{fmtTime(r.check_in)}</td>
                            <td>{fmtTime(r.check_out)}</td>
                            <td>{r.working_hours || '-'}</td>
                            <td><span className={`badge ${r.status && String(r.status).toLowerCase()==='present' ? 'success' : r.status && String(r.status).toLowerCase()==='pending' ? 'muted' : 'warn'}`}>{r.status}</span></td>
                            <td><Button size="sm" className="btn-ghost" onClick={()=>handleOpenEditAttendance(r)}>Edit</Button></td>
                          </tr>
                        ))}
                      </tbody>
                      </table>
                    </div>
                  </div>
                </Tab>

                <Tab eventKey="movements" title="Movements">
                  <div className="p-3">
                    <h3>Movements</h3>
                    <Button className="btn" onClick={()=>setShowMovement(true)}>Start Movement</Button>
                    <table className="table" style={{marginTop:8}}>
                      <thead><tr><th>ID</th><th>Start</th><th>End</th><th>Duration</th><th>Reason</th><th>Actions</th></tr></thead>
                      <tbody>
                        {movements.length===0 && <tr><td colSpan={6} className="muted">No movements</td></tr>}
                        {movements.map(m => (
                          <tr key={m.id}><td>{m.id}</td><td>{fmtDate(m.start_time || m.start)} {fmtTime(m.start_time || m.start)}</td><td>{m.end_time || m.end ? `${fmtDate(m.end_time || m.end)} ${fmtTime(m.end_time || m.end)}` : '-'}</td><td>{m.duration || '-'}</td><td>{m.reason || '-'}</td><td><Button size="sm" className="btn-ghost" onClick={()=>handleOpenMovementView(m)}>View</Button></td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Tab>

                <Tab eventKey="punctuality" title="Punctuality">
                  <div className="p-3">
                    <h3>Punctuality</h3>
                    <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:8}}>
                      <Button className="btn small" onClick={()=>{ setShowAddPunctuality(true); }}>Add Record</Button>
                      <input type="date" className="form-control" value={attendanceDate} onChange={(e)=>setAttendanceDate(e.target.value)} style={{maxWidth:160}} />
                    </div>
                    <table className="table">
                      <thead><tr><th>Date</th><th>Type</th><th>Minutes</th><th>Notes</th></tr></thead>
                      <tbody>
                        {punctualityRows.length===0 && <tr><td colSpan={4} className="muted">No records</td></tr>}
                        {punctualityRows.map(p=> (
                          <tr key={p.id}><td>{p.date}</td><td>{p.type}</td><td>{p.minutes}</td><td>{p.notes || '-'}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
        <AddCommissionModal show={showCommission} onHide={() => setShowCommission(false)} employeeId={employee?.id} />
        <StartMovementModal show={showMovement} onHide={() => setShowMovement(false)} employeeId={employee?.id} />
        <AddSalaryModal show={showAddSalary} onHide={() => setShowAddSalary(false)} employeeId={employee?.id} currentSalary={employee?.salary} onSaved={(rec)=>{ setSalaryHistory(prev=>[rec, ...prev]); }} />
        <AddPunctualityModal show={showAddPunctuality} onHide={() => setShowAddPunctuality(false)} employeeId={employee?.id} initial={null} onSaved={(rec)=>{ setPunctualityRows(prev=>[rec, ...prev]); }} />
        <EditAttendanceModal show={showEditAttendance} onHide={()=>setShowEditAttendance(false)} initial={editingAttendance} employeeId={employee?.id} onSaved={handleAttendanceSaved} />
        <MovementViewModal show={showMovementView} onHide={()=>setShowMovementView(false)} movement={viewingMovement} onSaved={handleMovementSaved} />
    </Container>
  );

  if (embedded) return <div className="hr-embedded">{content}</div>;

  return (
    <div className="d-flex hr-root">
      <Sidebar />
      <div className="flex-grow-1">
        <Header />
        {content}
      </div>
    </div>
  );
};

const EmployeeProfile = (props) => (
  <ToastProvider>
    <EmployeeProfileInner {...props} />
  </ToastProvider>
);

export default EmployeeProfile;
