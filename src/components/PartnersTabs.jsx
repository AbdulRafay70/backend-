import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

const tabs = [
  { name: 'Overview', path: '/partners' },
  { name: 'Messages', path: '/partners/message' },
  { name: 'Organization', path: '/partners/organization' },
  { name: 'Role Permissions', path: '/partners/role-permissions' },
  { name: 'Discounts', path: '/partners/discounts' },
  { name: 'Organization Links', path: '/partners/organization-links' },
  { name: 'Branches', path: '/partners/branche' },
  { name: 'Agencies', path: '/partners/agencies' },
  { name: 'Portal', path: '/partners/portal' },
  { name: 'Employees', path: '/partners/empolye' },
];

export default function PartnersTabs({ activeName }) {
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

        <div className="input-group" style={{ maxWidth: '300px' }}>
          <input type="text" className="form-control" placeholder="Search partners..." />
        </div>
      </div>
    </div>
  );
}
