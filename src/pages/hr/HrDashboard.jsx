import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tabs, Tab } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import Header from '../../components/Header';
import './styles/hr.css';
import { EmployeeProvider } from './components/EmployeeContext';
import { ToastProvider } from './components/ToastProvider';

import EmployeesPage from './EmployeesPage';
import AttendancePage from './AttendancePage';
import MovementsPage from './MovementsPage';
import CommissionsPage from './CommissionsPage';
import PunctualityPage from './PunctualityPage';
import { useLocation, useNavigate } from 'react-router-dom';

const HrDashboard = () => {
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

  const [activeKey, setActiveKey] = useState(routeToKey(location.pathname));

  useEffect(() => {
    setActiveKey(routeToKey(location.pathname));
  }, [location.pathname]);

  return (
    <EmployeeProvider>
      <ToastProvider>
        <div className="d-flex hr-root">
          <Sidebar />
          <div className="flex-grow-1">
            <Header />
            <Container fluid className="p-3">
              <h3 className="mb-3">HR</h3>

              <Tabs
                activeKey={activeKey}
                onSelect={(k) => {
                  setActiveKey(k);
                  // navigate to the corresponding route for each tab
                  switch (k) {
                    case 'employees':
                      navigate('/hr/employees');
                      break;
                    case 'attendance':
                      navigate('/hr/attendance');
                      break;
                    case 'movements':
                      navigate('/hr/movements');
                      break;
                    case 'commissions':
                      navigate('/hr/commissions');
                      break;
                    case 'punctuality':
                      navigate('/hr/punctuality');
                      break;
                    default:
                      navigate('/hr');
                  }
                }}
                className="mb-3"
              >
                <Tab eventKey="dashboard" title="Dashboard">
                  <Row className="g-3 mb-3">
                    <Col xs={12} md={3}>
                      <Card className="hr-card shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h5 className="mb-0">Employees</h5>
                              <small className="text-muted">Total active</small>
                            </div>
                            <div className="display-number">128</div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} md={3}>
                      <Card className="hr-card shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h5 className="mb-0">Present Today</h5>
                              <small className="text-muted">Check-ins</small>
                            </div>
                            <div className="display-number">42</div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} md={3}>
                      <Card className="hr-card shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h5 className="mb-0">Movements</h5>
                              <small className="text-muted">Open today</small>
                            </div>
                            <div className="display-number">3</div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} md={3}>
                      <Card className="hr-card shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h5 className="mb-0">Unpaid Commissions</h5>
                              <small className="text-muted">Amount</small>
                            </div>
                            <div className="display-number">₹ 120,000</div>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>

                  <Row className="g-3">
                    <Col xs={12} md={8}>
                      <Card className="shadow-sm">
                        <Card.Body>
                            <h6>Overview</h6>
                            <div className="chart-placeholder">Chart placeholder — integrate chart here</div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col xs={12} md={4}>
                      <Card className="shadow-sm">
                        <Card.Body>
                          <h6>Quick Actions</h6>
                          <ul className="list-unstyled small">
                            <li>• Add Employee</li>
                            <li>• Open Attendance</li>
                            <li>• Export CSV</li>
                          </ul>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </Tab>
                <Tab eventKey="employees" title="Employees">
                  <div style={{ padding: 8 }}>
                    <EmployeesPage embedded />
                  </div>
                </Tab>
                <Tab eventKey="attendance" title="Attendance">
                  <div style={{ padding: 8 }}>
                    <AttendancePage embedded />
                  </div>
                </Tab>
                <Tab eventKey="movements" title="Movements">
                  <div style={{ padding: 8 }}>
                    <MovementsPage embedded />
                  </div>
                </Tab>
                <Tab eventKey="commissions" title="Commissions">
                  <div style={{ padding: 8 }}>
                    <CommissionsPage embedded />
                  </div>
                </Tab>
                <Tab eventKey="punctuality" title="Punctuality">
                  <div style={{ padding: 8 }}>
                    <PunctualityPage embedded />
                  </div>
                </Tab>
              </Tabs>
            </Container>
          </div>
        </div>
      </ToastProvider>
    </EmployeeProvider>
  );
};

export default HrDashboard;
