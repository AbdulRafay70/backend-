import React from 'react';
import { Nav } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';

const tabs = [
  // use relative paths so tabs resolve under the current parent route (e.g. /admin/partners)
  { name: 'Overview', path: '' },
  { name: 'Organization', path: 'organization' },
  { name: 'Role Permissions', path: 'role-permissions' },
  { name: 'Request', path: 'request' },
  { name: 'Discounts', path: 'discounts' },
  { name: 'Organization Links', path: 'organization-links' },
  { name: 'Branches', path: 'branche' },
  // Portal is a partners tab (navigates to /partners/portal)
  { name: 'Portal', path: 'portal' },
  { name: 'Employees', path: 'empolye' },
];

export default function PartnersTabs({ activeName }) {
  // Always resolve partners tabs to absolute /partners paths so
  // the links work even when the app is mounted under a prefix
  // like /admin (e.g. current location /admin/partners).
  const partnersBase = '/partners';

  const resolveTo = (tabPath) => {
    // If it's already absolute (starts with '/'), use it as-is (Portal)
    if (tabPath.startsWith('/')) return tabPath;
    // Otherwise map to /partners or /partners/<tabPath>
    return tabPath ? `${partnersBase}/${tabPath}` : partnersBase;
  };

  return (
    <div className="row mb-3">
      <div className="d-flex flex-wrap justify-content-between align-items-center w-100">
        <nav className="nav flex-wrap gap-2">
          {tabs.map((tab) => (
            <NavLink
              key={tab.name}
              to={resolveTo(tab.path)}
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
