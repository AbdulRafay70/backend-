import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

const tabs = [
  // Use the actual app routes registered in App.jsx
  { name: 'Customers', path: '/customer-management' },
  { name: 'Leads', path: '/lead-management' },
  { name: 'Passport Leads', path: '/passport-leads' },
  { name: 'Commission Rules', path: '/commission-management' },
];

export default function CRMTabs({ activeName }) {
  return (
    <div className="row mb-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
        <nav className="nav flex-wrap gap-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `nav-link btn btn-link text-decoration-none px-0 me-3 ${
                  isActive || activeName === tab.name ? 'text-primary fw-semibold' : 'text-muted'
                }`
              }
              style={{ backgroundColor: 'transparent' }}
            >
              {tab.name}
            </NavLink>
          ))}
        </nav>

        <div className="input-group" style={{ maxWidth: '320px' }}>
          <input type="text" className="form-control" placeholder="Search CRM..." />
        </div>
      </div>
    </div>
  );
}
