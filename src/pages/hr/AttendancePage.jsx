import React, { useEffect, useState, useMemo } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, InputGroup, Tabs, Tab, Dropdown, ButtonGroup, Modal } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import api from '../../utils/Api';
import { ToastProvider, useToast } from './components/ToastProvider';
import { useEmployees, EmployeeProvider } from './components/EmployeeContext';
import './styles/hr.css';
import { useLocation, useNavigate } from 'react-router-dom';

const AttendanceInner = ({ embedded = false }) => {
  const [records, setRecords] = useState([]);
  const { show: toast } = useToast();
  const { employees } = useEmployees();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const resp = await api.get('/hr/attendance/');
        let atts = Array.isArray(resp.data) ? resp.data : [];
        // map attendance employee field to full object when possible
        const empMap = {};
        (employees || []).forEach(e => { empMap[e.id] = e; });
        atts = atts.map(a => ({ ...a, employee: (typeof a.employee === 'object' ? a.employee : (empMap[Number(a.employee)] || { id: Number(a.employee), first_name: 'Employee', last_name: '' } )) }));

        // Build a single row per active employee for the target date
        const today = new Date().toISOString().slice(0,10);
        const targetDate = dateFilter || today;

        if (employees && employees.length > 0) {
          // index attendance records by employee id for the target date
          const attByEmp = {};
          (atts || []).forEach(a => {
            try {
              const empId = a.employee && typeof a.employee === 'object' ? a.employee.id : Number(a.employee);
              if (a.date === targetDate) attByEmp[empId] = a;
            } catch (e) { /* ignore */ }
          });

          const derived = (employees || [])
            .filter(e => e && (e.is_active === undefined ? true : e.is_active))
            .map(e => {
              const existing = attByEmp[e.id];
              if (existing) return { ...existing, employee: (typeof existing.employee === 'object' ? existing.employee : e) };
              return { id: null, date: targetDate, check_in: null, check_out: null, working_hours: '', status: 'pending', notes: '', employee: e };
            });

          setRecords(derived);
        } else {
          // fallback: use raw attendance rows
          setRecords(atts);
        }
      } catch (e) {
        console.warn('Attendance fetch failed', e?.message);
        toast('danger', 'Attendance fetch failed', e?.message || '');
      }
    };
    fetch();
  }, [employees, dateFilter]);

  const filtered = useMemo(() => {
    return records.filter(r => {
      const fullname = `${r.employee.first_name} ${r.employee.last_name || ''}`.toLowerCase();
      if (query && !fullname.includes(query.toLowerCase())) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (dateFilter && r.date !== dateFilter) return false;
      return true;
    });
  }, [records, query, statusFilter, dateFilter]);

  // summary counts for the cards (for selected date or today)
  const summary = useMemo(() => {
    const target = dateFilter || new Date().toISOString().slice(0,10);
    const items = (records || []).filter(r => r.date === target);
    let present = 0, absent = 0, late = 0;
    items.forEach(it => {
      const s = String(it.status || '').toLowerCase();
      if (s === 'present' || s === 'in') present++;
      else if (s === 'absent') absent++;
      else if (s === 'late') late++;
    });
    return { present, absent, late, total: items.length };
  }, [records, dateFilter]);

  const doCheckIn = async (rec) => {
    const now = new Date().toISOString();
    // optimistic update: set check_in locally
    setRecords(prev => prev.map(p => p.id === rec.id ? { ...p, status: 'IN', check_in: now } : p));
    try {
      const payload = { employee: rec.employee && rec.employee.id ? rec.employee.id : rec.employee, time: now };
      const resp = await api.post('/hr/attendance/check_in/', payload);
      const att = resp.data;
      // upsert returned attendance into records array
      setRecords(prev => {
        const exists = prev.findIndex(r => r.id === att.id || (r.employee && r.employee.id === att.employee && r.date === att.date));
        if (exists >= 0) {
          const copy = [...prev]; copy[exists] = { ...copy[exists], ...att, employee: (typeof att.employee === 'object' ? att.employee : (copy[exists].employee && copy[exists].employee.id ? copy[exists].employee : { id: att.employee })) };
          return copy;
        }
        return [{ ...att, employee: (typeof att.employee === 'object' ? att.employee : { id: att.employee }) }, ...prev];
      });
    } catch (e) {
      console.warn('Check-in backend failed', e?.message);
      toast('danger', 'Check-in failed', e?.message || '');
    }
  };

  const doCheckOut = async (rec) => {
    const now = new Date().toISOString();
    setRecords(prev => prev.map(p => p.id === rec.id ? { ...p, status: 'OUT', check_out: now } : p));
    try {
      const payload = { employee: rec.employee && rec.employee.id ? rec.employee.id : rec.employee, time: now };
      const resp = await api.post('/hr/attendance/check_out/', payload);
      const att = resp.data;
      setRecords(prev => {
        const exists = prev.findIndex(r => r.id === att.id || (r.employee && r.employee.id === att.employee && r.date === att.date));
        if (exists >= 0) {
          const copy = [...prev]; copy[exists] = { ...copy[exists], ...att, employee: (typeof att.employee === 'object' ? att.employee : (copy[exists].employee && copy[exists].employee.id ? copy[exists].employee : { id: att.employee })) };
          return copy;
        }
        return [{ ...att, employee: (typeof att.employee === 'object' ? att.employee : { id: att.employee }) }, ...prev];
      });
    } catch (e) {
      console.warn('Check-out backend failed', e?.message);
      toast('danger', 'Check-out failed', e?.message || '');
    }
  };

  // Edit modal used to update check-in/out times and status
  const EditAttendanceModal = ({ show, onHide, record, onSaved }) => {
    const [form, setForm] = useState(() => ({
      date: record?.date || new Date().toISOString().slice(0,10),
      check_in: record?.check_in ? record.check_in : '',
      check_out: record?.check_out ? record.check_out : '',
      status: record?.status ? String(record.status).toLowerCase() : 'present',
      notes: record?.notes || ''
    }));
    useEffect(()=>{ setForm({ date: record?.date || new Date().toISOString().slice(0,10), check_in: record?.check_in || '', check_out: record?.check_out || '', status: record?.status ? String(record.status).toLowerCase() : 'present', notes: record?.notes || '' }); }, [record, show]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        if (record && record.id) {
          const payload = {
            date: form.date,
            check_in: form.check_in || null,
            check_out: form.check_out || null,
            status: form.status,
            notes: form.notes
          };
          const resp = await api.patch(`/hr/attendance/${record.id}/`, payload);
          onSaved && onSaved(resp.data);
          toast('success','Saved','Attendance updated');
        } else {
          const payload = {
            date: form.date,
            check_in: form.check_in || null,
            check_out: form.check_out || null,
            status: form.status,
            notes: form.notes,
            employee: record && record.employee ? (record.employee.id || record.employee) : null
          };
          const resp = await api.post('/hr/attendance/', payload);
          onSaved && onSaved(resp.data);
          toast('success','Saved','Attendance created');
        }
      } catch (e) {
        console.warn('Save attendance failed', e?.message);
        toast('danger','Save failed', e?.response?.data?.detail || e?.message || '');
      } finally {
        onHide && onHide();
      }
    };

    return (
      <Modal show={show} onHide={onHide} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton className="modal-header-accent"><Modal.Title>Edit Attendance</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-2">
              <Form.Label>Date</Form.Label>
              <Form.Control type="date" value={form.date} onChange={e=>setForm({...form, date: e.target.value})} required />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Check In</Form.Label>
              <Form.Control type="datetime-local" value={form.check_in ? new Date(form.check_in).toISOString().slice(0,16) : ''} onChange={e=>setForm({...form, check_in: e.target.value ? new Date(e.target.value).toISOString() : ''})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Check Out</Form.Label>
              <Form.Control type="datetime-local" value={form.check_out ? new Date(form.check_out).toISOString().slice(0,16) : ''} onChange={e=>setForm({...form, check_out: e.target.value ? new Date(e.target.value).toISOString() : ''})} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Status</Form.Label>
              <Form.Select value={form.status} onChange={e=>setForm({...form, status: e.target.value})}>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="late">Late</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Notes</Form.Label>
              <Form.Control value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})} />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="btn-ghost" onClick={onHide}>Cancel</Button>
            <Button type="submit" className="btn-primary">Save</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    );
  };

  const _upsertFromResp = (att) => {
    if (!att) return;
    setRecords(prev => {
      const exists = prev.findIndex(r => r.id === att.id || (r.employee && r.employee.id === att.employee && r.date === att.date));
      if (exists >= 0) {
        const copy = [...prev]; copy[exists] = { ...copy[exists], ...att, employee: (typeof att.employee === 'object' ? att.employee : (copy[exists].employee && copy[exists].employee.id ? copy[exists].employee : { id: att.employee })) };
        return copy;
      }
      return [{ ...att, employee: (typeof att.employee === 'object' ? att.employee : { id: att.employee }) }, ...prev];
    });
  };

  const markPresent = async (rec) => {
    // Try provider-specific action, then PATCH, then create
    const emp = rec.employee && rec.employee.id ? rec.employee.id : rec.employee;
    const date = rec.date || new Date().toISOString().slice(0,10);
    // optimistic (backend expects lowercase choices)
    setRecords(prev => prev.map(p => p.id === rec.id ? { ...p, status: 'present' } : p));
    try {
      // try action endpoint
      try {
        const r = await api.post('/hr/attendance/mark_present/', { employee: emp, date });
        if (r && r.data) { _upsertFromResp(r.data); toast('success','Marked','Marked present'); return; }
      } catch (e) { /* ignore, try next */ }

      if (rec.id) {
        const r = await api.patch(`/hr/attendance/${rec.id}/`, { status: 'present' });
        if (r && r.data) { _upsertFromResp(r.data); toast('success','Marked','Marked present'); return; }
      }

      const r2 = await api.post('/hr/attendance/', { employee: emp, date, status: 'present' });
      if (r2 && r2.data) { _upsertFromResp(r2.data); toast('success','Marked','Marked present'); return; }
    } catch (e) {
      console.warn('Mark present failed', e?.message);
      toast('danger','Mark failed', e?.message || '');
    }
  };

  const markAbsent = async (rec) => {
    const emp = rec.employee && rec.employee.id ? rec.employee.id : rec.employee;
    const date = rec.date || new Date().toISOString().slice(0,10);
    setRecords(prev => prev.map(p => p.id === rec.id ? { ...p, status: 'absent' } : p));
    try {
      try {
        const r = await api.post('/hr/attendance/mark_absent/', { employee: emp, date });
        if (r && r.data) { _upsertFromResp(r.data); toast('success','Marked','Marked absent'); return; }
      } catch (e) { /* ignore */ }

      if (rec.id) {
        const r = await api.patch(`/hr/attendance/${rec.id}/`, { status: 'absent' });
        if (r && r.data) { _upsertFromResp(r.data); toast('success','Marked','Marked absent'); return; }
      }

      const r2 = await api.post('/hr/attendance/', { employee: emp, date, status: 'absent' });
      if (r2 && r2.data) { _upsertFromResp(r2.data); toast('success','Marked','Marked absent'); return; }
    } catch (e) {
      console.warn('Mark absent failed', e?.message);
      toast('danger','Mark failed', e?.message || '');
    }
  };

  const resetFilters = () => { setQuery(''); setStatusFilter('ALL'); setDateFilter(''); };

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
          <div className="title">Attendance</div>
          <div className="subtitle">Quick overview and daily actions for employee attendance</div>
        </div>
        <div className="hr-actions">
          <Button className="btn-ghost" onClick={resetFilters}>Reset</Button>
          <Button className="btn-primary">Export CSV</Button>
        </div>
      </div>

      <div className="hr-cards">
        <div className="hr-card">
          <h4>Present</h4>
          <p>{summary.present}</p>
        </div>
        <div className="hr-card">
          <h4>Absent</h4>
          <p>{summary.absent}</p>
        </div>
        <div className="hr-card">
          <h4>Late</h4>
          <p>{summary.late}</p>
        </div>
      </div>

      <div className="hr-panel">
        <div className="hr-filters">
          <InputGroup className="filter-input" size="sm" style={{maxWidth:140}}>
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control placeholder="Search employee" value={query} onChange={e => setQuery(e.target.value)} />
          </InputGroup>

          <Form.Select size="sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{maxWidth:140}}>
            <option value="ALL">All Status</option>
            <option value="IN">In</option>
            <option value="OUT">Out</option>
            <option value="PENDING">Pending</option>
          </Form.Select>

          <Form.Control size="sm" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={{maxWidth:140}} />
        </div>

        {filtered.length === 0 ? (
          <div className="hr-empty">No attendance records found.</div>
        ) : (
          <Table className="hr-table" responsive>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id}>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div className="avatar">{(r.employee.first_name||'')[0]}{(r.employee.last_name||'')[0]}</div>
                      <div>
                        <div style={{fontWeight:700}}>{r.employee.first_name} {r.employee.last_name}</div>
                        <div className="small-muted">ID: {r.employee.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>{r.date}</td>
                  <td>{r.check_in ? new Date(r.check_in).toLocaleTimeString() : '-'}</td>
                  <td>{r.check_out ? new Date(r.check_out).toLocaleTimeString() : '-'}</td>
                  <td>
                    {(() => {
                      const s = String(r.status || '').toLowerCase();
                      const cls = s === 'present' || s === 'in' ? 'status-in' : s === 'out' ? 'status-out' : s === 'absent' ? 'status-out' : 'status-pending';
                      const label = s === 'present' ? 'Present' : s === 'absent' ? 'Absent' : s === 'half_day' ? 'Half Day' : s === 'late' ? 'Late' : (r.status || '');
                      return <span className={`status-chip ${cls}`}>{label}</span>;
                    })()}
                  </td>
                  <td>
                    <div style={{display:'flex',gap:8, alignItems:'center'}}>
                      {/* single icon-only dropdown containing all actions (check in/out, mark present/absent, edit, late, half-day) */}
                      <Dropdown align="end">
                        <Dropdown.Toggle variant="light" size="sm" id={`actions-icon-${r.id||Math.random()}`} style={{padding:'6px 8px', borderRadius:6}}>
                          {/* vertical ellipsis SVG for compact icon */}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => doCheckIn(r)}>Check In</Dropdown.Item>
                          <Dropdown.Item onClick={() => doCheckOut(r)}>Check Out</Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item onClick={()=>markPresent(r)}>Mark Present</Dropdown.Item>
                          <Dropdown.Item onClick={()=>markAbsent(r)}>Mark Absent</Dropdown.Item>
                          <Dropdown.Item onClick={()=>{ setEditTarget(r); setShowEdit(true); }}>Edit attendance</Dropdown.Item>
                          <Dropdown.Divider />
                          <Dropdown.Item onClick={()=>{ setRecords(prev => prev.map(p => p.id === r.id ? { ...p, status: 'late' } : p)); api.post('/hr/attendance/mark_late/', { employee: r.employee.id || r.employee, date: r.date || new Date().toISOString().slice(0,10) }).then(resp=>_upsertFromResp(resp.data)).catch(()=>{}); }}>Mark Late</Dropdown.Item>
                          <Dropdown.Item onClick={()=>{ setRecords(prev => prev.map(p => p.id === r.id ? { ...p, status: 'half_day' } : p)); api.post('/hr/attendance/mark_half_day/', { employee: r.employee.id || r.employee, date: r.date || new Date().toISOString().slice(0,10) }).then(resp=>_upsertFromResp(resp.data)).catch(()=>{}); }}>Mark Half Day</Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <EditAttendanceModal show={showEdit} onHide={()=>{setShowEdit(false); setEditTarget(null);}} record={editTarget} onSaved={(saved)=>{ _upsertFromResp(saved); }} />
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
      </div>
    </div>
  );
};

const AttendancePage = (props) => (
  <EmployeeProvider>
    <ToastProvider>
      <AttendanceInner {...props} />
    </ToastProvider>
  </EmployeeProvider>
);

export default AttendancePage;
