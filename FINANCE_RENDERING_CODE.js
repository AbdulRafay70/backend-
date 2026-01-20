/*
 * FINANCE RENDERING CODE TO BE INSERTED
 * Location: d:\Saerpk\admin\src\pages\admin\UpdatePermissions.jsx
 * Insert at: Line 1574 (between Payments and Pax Movement sections)
 * Insert BEFORE the line: ) : section.id === 'Pax Movement' ? (
 */

) : section.id === 'Finance' ? (
    // Render Finance permissions with sub-groups
    (() => {
        const financeGroups = organizeFinancePermissions(filteredPermissions);
        const subGroupMeta = {
            recent_transactions: { label: 'Recent Transactions', icon: '📊' },
            profit_loss_reports: { label: 'Profit & Loss Reports', icon: '📈' },
            financial_ledger: { label: 'Financial Ledger', icon: '📒' },
            expense_management: { label: 'Expense Management', icon: '💸' },
            manual_posting: { label: 'Manual Posting', icon: '✍️' },
            tax_reports_fbr: { label: 'Tax Reports (FBR)', icon: '🏛️' },
            balance_sheet: { label: 'Balance Sheet', icon: '⚖️' },
            audit_trail: { label: 'Audit Trail', icon: '🔍' }
        };

        return Object.entries(financeGroups).map(([groupKey, groupPerms]) => {
            if (groupPerms.length === 0) return null;

            return (
                <React.Fragment key={groupKey}>
                    <tr className="table-secondary">
                        <td colSpan="3" className="fw-bold py-2">
                            <span className="me-2">{subGroupMeta[groupKey].icon}</span>
                            {subGroupMeta[groupKey].label}
                        </td>
                    </tr>
                    {groupPerms.map((perm, permIndex) => (
                        <tr key={`${section.id}-${perm}-${permIndex}`}>
                            <td className="text-center">
                                <input
                                    className="form-check-input border border-dark"
                                    type="checkbox"
                                    checked={permissions?.[section.id]?.[perm] || false}
                                    onChange={() => handlePermissionChange(section.id, perm)}
                                    id={`${section.id}-${perm}-${permIndex}`}
                                />
                            </td>
                            <td>
                                <label
                                    className="mb-0 w-100"
                                    htmlFor={`${section.id}-${perm}-${permIndex}`}
                                    style={{ cursor: "pointer" }}
                                >
                                    {permissionNameMap[perm] || perm}
                                </label>
                            </td>
                            <td>
                                <code className="text-muted small">{perm}</code>
                            </td>
                        </tr>
                    ))}
                </React.Fragment>
            );
        });
    })()
