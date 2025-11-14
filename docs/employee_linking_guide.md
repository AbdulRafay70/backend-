# Employee Linking System - Admin Guide

## Overview
This system allows you to manage employees and their relationships with Organizations, Branches, and Agencies.

## User Types

### 1. **Admins** (All Users)
- Found in: **Admin and Employees** section
- These are all system users
- Can be linked to organizations as employees

### 2. **Employees** (Linked Users)
- Found in: **Organization** section
- These are users linked to Agency → Branch → Organization chain
- Same users as Admins, but shown in organizational context

## Organizational Hierarchy

```
Organization (ORG-0001)
    ↓
Branch (BRN-0001)
    ↓
Agency (AGN-0001)
    ↓
Employee (User)
```

## How to Create and Link Employees

### Option 1: Create Employee First, Then Link
1. Go to **Organization → Employees**
2. Click **Add Employee**
3. Fill in employee details (username, email, name, etc.)
4. **Link to Agency/Branch/Organization:**
   - Scroll to inline sections
   - Add Agency link(s)
   - Add Branch link(s)
   - Add Organization link(s)
5. Click **Save**

### Option 2: Link Employees from Organization/Branch/Agency
1. Go to **Organization → Organizations** (or Branches/Agencies)
2. Open an existing organization
3. Find **"Linked Employees"** section
4. Select employees from the dropdown
5. Click **Save**

## Employee Admin Features

### When Viewing Employee:
- **Agencies Tab**: Shows all agencies this employee is linked to
- **Branches Tab**: Shows all branches this employee is linked to
- **Organizations Tab**: Shows all organizations this employee is linked to

### When Viewing Organization/Branch/Agency:
- **Linked Employees Section**: Dropdown to select/add employees
- **Employee Count**: Shows "X employee(s)" in list view

## Direct Linking Options

### In Employee Admin:
```
┌─────────────────────────────────────┐
│ Employee: john.doe                  │
├─────────────────────────────────────┤
│ Agencies (Direct Link)              │
│ [+] Add another Agency              │
│ Agency: AGN-0001 [Select...]        │
├─────────────────────────────────────┤
│ Branches (Direct Link)              │
│ [+] Add another Branch              │
│ Branch: BRN-0001 [Select...]        │
├─────────────────────────────────────┤
│ Organizations (Direct Link)         │
│ [+] Add another Organization        │
│ Organization: ORG-0001 [Select...]  │
└─────────────────────────────────────┘
```

### In Organization/Branch/Agency Admin:
```
┌─────────────────────────────────────┐
│ Organization: ABC Company           │
├─────────────────────────────────────┤
│ Linked Employees                    │
│ Select employees to link directly   │
│ to this organization                │
│                                     │
│ [john.doe] [jane.smith] [admin]    │
│                                     │
│ Hold Ctrl to select multiple        │
└─────────────────────────────────────┘
```

## List View Features

### Employee List Shows:
- Username
- Email
- First Name / Last Name
- **Agencies**: All linked agencies
- **Branches**: All linked branches
- **Organizations**: All linked organizations
- Active status

### Organization/Branch/Agency List Shows:
- ID, Code, Name
- Contact details
- **"X employee(s)"**: Count of linked employees

## Example Workflow

### Scenario: Hire new employee for ABC Agency

**Step 1: Create Employee**
```
Organization → Employees → Add Employee
- Username: john.doe
- Email: john@example.com
- First name: John
- Last name: Doe
- Password: [set password]
```

**Step 2: Link to Agency (Method A - From Employee)**
```
In same form, scroll down to:
┌─────────────────────────────┐
│ Agencies (Direct Link)      │
│ Agency: ABC Agency (AGN-001)│
└─────────────────────────────┘
```

**Step 2: Link to Agency (Method B - From Agency)**
```
Organization → Agencies → ABC Agency
┌──────────────────────────────┐
│ Linked Employees             │
│ Selected: [john.doe] ←       │
└──────────────────────────────┘
```

**Result:**
- Employee john.doe is now linked to ABC Agency
- ABC Agency shows "1 employee(s)"
- john.doe's employee profile shows "ABC Agency (AGN-001)"

## Benefits

✅ **Flexible Linking**: Link employees from either direction
✅ **Multiple Links**: One employee can be linked to multiple agencies/branches/organizations
✅ **Visual Indicators**: See employee counts and linked entities at a glance
✅ **Easy Management**: Use filter_horizontal widget for easy multi-selection
✅ **Chain Visibility**: See complete organizational chain for each employee

## Notes

1. **Employees ARE Users**: The Employee section shows the same User model, just in organizational context
2. **Direct Links**: You can link employees directly without following the strict hierarchy
3. **Multiple Assignments**: An employee can belong to multiple agencies, branches, or organizations
4. **Filter Horizontal**: The employee selection uses a searchable multi-select widget
5. **Auto-Count**: Employee counts update automatically when you add/remove links

## Technical Details

### Models:
- `User` (Django's built-in user model) = Admin
- `Employee` (Proxy model for User) = Employee view in Organization section
- `Organization.user` = ManyToMany relationship
- `Branch.user` = ManyToMany relationship
- `Agency.user` = ManyToMany relationship

### Admin Features:
- `filter_horizontal`: Easy employee selection
- Inline forms: Add links directly in employee form
- Custom methods: Show employee counts and linked entities
- Custom fieldsets: Organized sections for better UX
