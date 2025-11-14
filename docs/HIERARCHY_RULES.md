# Universal Registration - Strict Hierarchy Rules

## 📊 Organizational Hierarchy (Enforced)

```
┌─────────────────────────────┐
│      ORGANIZATION           │
│      (No parent)            │
│                             │
│  ID: ORG-0001               │
│  organization_id: ORG-0001  │
│  branch_id: null            │
└──────────────┬──────────────┘
               │
               │ ✅ Can have
               │
       ┌───────┴────────┐
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│   BRANCH    │  │   BRANCH    │
│             │  │             │
│ BRN-0001    │  │ BRN-0002    │
│ org: ORG-01 │  │ org: ORG-01 │
└──────┬──────┘  └──────┬──────┘
       │                │
       │ ✅ Can have   │ ✅ Can have
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│   AGENT     │  │   AGENT     │
│             │  │             │
│ AGT-0001    │  │ AGT-0002    │
│ org: ORG-01 │  │ org: ORG-01 │
│ br: BRN-01  │  │ br: BRN-02  │
└──────┬──────┘  └──────┬──────┘
       │                │
       │ ✅ Can have   │ ✅ Can have
       │                │
┌──────▼──────┐  ┌──────▼──────┐
│  EMPLOYEE   │  │  EMPLOYEE   │
│             │  │             │
│ EMP-0001    │  │ EMP-0002    │
│ org: ORG-01 │  │ org: ORG-01 │
│ br: BRN-01  │  │ br: BRN-02  │
└─────────────┘  └─────────────┘
```

---

## 🔗 Parent-Child Relationships (STRICT)

| Entity Type | Can Select as Parent | Cannot Select | Auto-Inherited IDs |
|-------------|---------------------|---------------|-------------------|
| **Organization** | ❌ None (no parent) | N/A | organization_id (generated) |
| **Branch** | ✅ Organization ONLY | ❌ Branch, Agent, Employee | organization_id from parent |
| **Agent** | ✅ Branch ONLY | ❌ Organization, Agent, Employee | organization_id + branch_id from parent |
| **Employee** | ✅ Agent ONLY | ❌ Organization, Branch, Employee | organization_id + branch_id from parent |

---

## ✅ What's Enforced

### In API (Serializer)
```python
# Agent trying to select Organization - REJECTED ❌
{
  "type": "agent",
  "parent": "ORG-0001"  # Error: Agent parent must be a branch
}

# Agent selecting Branch - ACCEPTED ✅
{
  "type": "agent",
  "parent": "BRN-0001"  # ✓ Correct
}
```

### In Django Admin
When you:
1. Select **Type: Organization** → Parent dropdown is **EMPTY** (disabled)
2. Select **Type: Branch** → Parent dropdown shows **ONLY Organizations**
3. Select **Type: Agent** → Parent dropdown shows **ONLY Branches**
4. Select **Type: Employee** → Parent dropdown shows **ONLY Agents**

---

## 📋 Step-by-Step Creation Flow

### Step 1: Create Organization
```
✅ Create Organization "ABC Travel"
   → No parent needed
   → Gets: organization_id = ORG-0001
```

### Step 2: Create Branch under Organization
```
✅ Create Branch "Lahore Branch"
   → MUST select parent: ABC Travel (ORG-0001)
   → Gets: branch_id = BRN-0001
   → Inherits: organization_id = ORG-0001
```

### Step 3: Create Agent under Branch
```
✅ Create Agent "Ahmed Hassan"
   → MUST select parent: Lahore Branch (BRN-0001)
   → Gets: id = AGT-0001
   → Inherits: branch_id = BRN-0001
   → Inherits: organization_id = ORG-0001 (through branch)
```

### Step 4: Create Employee under Agent
```
✅ Create Employee "Sara Malik"
   → MUST select parent: Ahmed Hassan (AGT-0001)
   → Gets: id = EMP-0001
   → Inherits: branch_id = BRN-0001 (from agent's branch)
   → Inherits: organization_id = ORG-0001 (from agent's org)
```

---

## ❌ What's NOT Allowed

### Agent Cannot Select Organization Directly
```
❌ WRONG:
Organization (ORG-0001)
    └── Agent (trying to link directly) ← BLOCKED

✅ CORRECT:
Organization (ORG-0001)
    └── Branch (BRN-0001)
        └── Agent (AGT-0001) ← Must go through Branch
```

### Employee Cannot Select Branch or Organization Directly
```
❌ WRONG:
Branch (BRN-0001)
    └── Employee (trying to link directly) ← BLOCKED

✅ CORRECT:
Branch (BRN-0001)
    └── Agent (AGT-0001)
        └── Employee (EMP-0001) ← Must go through Agent
```

---

## 🔄 How IDs Flow Through Hierarchy

### Example: Creating Employee under Agent

```
Organization: ABC Travel
├── ID: ORG-0001
├── organization_id: ORG-0001
└── branch_id: null

    ↓ Creates

Branch: Lahore Branch
├── ID: BRN-0001
├── parent: ORG-0001
├── organization_id: ORG-0001 ← Inherited
└── branch_id: BRN-0001 ← Auto-generated

    ↓ Creates

Agent: Ahmed Hassan
├── ID: AGT-0001
├── parent: BRN-0001
├── organization_id: ORG-0001 ← Inherited from branch
└── branch_id: BRN-0001 ← Inherited from branch

    ↓ Creates

Employee: Sara Malik
├── ID: EMP-0001
├── parent: AGT-0001
├── organization_id: ORG-0001 ← Inherited from agent
└── branch_id: BRN-0001 ← Inherited from agent
```

---

## 🎯 Key Points

1. **Organization** = Top level, no parent needed
2. **Branch** → Linked to **Organization** (creates branch_id)
3. **Agent** → Linked to **Branch** (inherits org_id + branch_id through branch)
4. **Employee** → Linked to **Agent** (inherits org_id + branch_id through agent)

5. **Agent CANNOT select Organization** - must go through Branch
6. **Employee CANNOT select Organization or Branch** - must go through Agent

7. All IDs are **auto-generated** or **auto-inherited**
8. Users **cannot input** organization_id or branch_id

---

## 💻 Implementation

### API Validation
- `universal/serializers.py` - Enforces parent type rules
- Rejects invalid parent selections with clear error messages

### Django Admin
- `universal/admin.py` - `formfield_for_foreignkey()` filters parent dropdown
- Shows only valid parent types based on selected entity type

### Available Parents Endpoint
- `GET /api/universal/available-parents/?type=<type>`
- Returns filtered list of valid parents for each entity type

---

## 📱 Mobile App Usage

```javascript
// For Agent registration
GET /api/universal/available-parents/?type=agent
// Returns: Only Branches (no Organizations)

// For Employee registration
GET /api/universal/available-parents/?type=employee
// Returns: Only Agents (no Organizations or Branches)
```

---

**This strict hierarchy ensures data integrity and proper organizational structure!**

Last Updated: November 1, 2025
