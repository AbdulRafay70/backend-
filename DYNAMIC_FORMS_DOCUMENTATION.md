# Dynamic Forms Module - Complete API Documentation

## Overview

The Dynamic Forms module allows creation of customizable lead capture forms that can be:
- Linked to blog posts for lead generation
- Used as standalone pages
- Displayed in different positions (end of blog, sidebar, popup)
- Automatically forward submissions to the Leads API

**Key Features:**
- ✅ Dynamic form structure (configurable fields, buttons, notes)
- ✅ Auto-generation of unique form URLs
- ✅ Blog integration support
- ✅ Public submission endpoint (no authentication)
- ✅ Automatic Lead record creation
- ✅ Submission tracking and analytics
- ✅ Organization/Branch scoping
- ✅ Full Swagger documentation

---

## Models

### 1. DynamicForm

Represents a dynamic form configuration.

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Auto-incrementing primary key |
| `form_unique_id` | CharField(100) | Auto-generated unique identifier from title |
| `form_title` | CharField(200) | Display name of the form |
| `linked_blog` | ForeignKey(Blog) | Optional: Blog post to link form with |
| `is_linked_with_blog` | Boolean | Whether form is linked to a blog |
| `form_page_url` | CharField(255) | Auto-generated unique URL path (e.g., /forms/umrah-leads-form) |
| `display_position` | CharField(20) | Where to display: end_of_blog/sidebar/popup/standalone |
| `fields` | JSONField | Array of field configurations |
| `buttons` | JSONField | Array of button configurations |
| `notes` | JSONField | Array of informational notes |
| `organization` | ForeignKey(Organization) | Owner organization |
| `branch` | ForeignKey(Branch) | Optional: Associated branch |
| `created_by` | ForeignKey(User) | User who created the form |
| `status` | CharField(20) | active/inactive/draft |
| `submission_count` | Integer | Total submissions received |
| `created_at` | DateTime | Creation timestamp |
| `updated_at` | DateTime | Last modification timestamp |

**Auto-Generated Fields:**
- `form_unique_id`: Created from title (slug) + 6-char UUID
- `form_page_url`: Generated as `/forms/{form_unique_id}`, ensures uniqueness

**Example Field Structure:**
```json
{
  "fields": [
    {
      "label": "Full Name",
      "type": "text",
      "placeholder": "Enter your full name",
      "required": true,
      "width": "full",
      "field_name": "full_name"
    },
    {
      "label": "Contact Number",
      "type": "tel",
      "placeholder": "+92 XXX XXXXXXX",
      "required": true,
      "width": "half",
      "field_name": "contact_number"
    },
    {
      "label": "Preferred Package",
      "type": "select",
      "required": false,
      "width": "full",
      "field_name": "preferred_package_type",
      "options": ["Umrah", "Hajj", "Tour Package"]
    }
  ],
  "buttons": [
    {
      "label": "Submit",
      "action": "submit",
      "style": "primary"
    }
  ],
  "notes": [
    {
      "type": "info",
      "content": "We'll contact you within 24 hours"
    }
  ]
}
```

### 2. FormSubmission

Tracks individual form submissions and links to created Lead records.

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | Integer | Primary key |
| `form` | ForeignKey(DynamicForm) | Associated form |
| `lead` | ForeignKey(Lead) | Created lead record (nullable) |
| `submission_data` | JSONField | Raw submission data |
| `ip_address` | GenericIPAddressField | Submitter's IP |
| `user_agent` | TextField | Browser user agent |
| `referrer` | URLField | Referring page URL |
| `submitted_at` | DateTime | Submission timestamp |

---

## API Endpoints

### Base URL: `/api/forms/`

All endpoints are tagged as **Dynamic Forms** in Swagger.

---

### 1. List Forms

**GET** `/api/forms/`

Retrieve all dynamic forms with filtering and pagination.

**Authentication:** Required (JWT)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `organization_id` | Integer | Filter by organization |
| `branch_id` | Integer | Filter by branch |
| `status` | String | Filter by status (active/inactive/draft) |
| `linked_blog_id` | Integer | Filter forms linked to specific blog |
| `is_standalone` | Boolean | Filter standalone forms (not linked to blog) |
| `limit` | Integer | Results per page (default: 10) |
| `offset` | Integer | Pagination offset (default: 0) |

**Response:**
```json
{
  "count": 15,
  "next": "http://api.example.com/api/forms/?limit=10&offset=10",
  "previous": null,
  "results": [
    {
      "id": 1,
      "form_unique_id": "umrah-leads-form-a3f5d2",
      "form_title": "Umrah Package Interest Form",
      "form_page_url": "/forms/umrah-leads-form-a3f5d2",
      "linked_blog": 45,
      "linked_blog_title": "Complete Guide to Umrah 2024",
      "is_linked_with_blog": true,
      "display_position": "end_of_blog",
      "fields": [...],
      "buttons": [...],
      "notes": [...],
      "organization": 1,
      "organization_name": "Saer Travels",
      "branch": 3,
      "branch_name": "Karachi Branch",
      "status": "active",
      "submission_count": 47,
      "created_by": 12,
      "created_by_name": "Ahmed Ali",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:22:00Z"
    }
  ]
}
```

**User Scoping:**
- Regular users see only forms from their organization
- Superusers see all forms

---

### 2. Create Form

**POST** `/api/forms/`

Create a new dynamic form.

**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "form_title": "Hajj Package Interest Form",
  "linked_blog_id": 52,
  "is_linked_with_blog": true,
  "display_position": "sidebar",
  "fields": [
    {
      "label": "Full Name",
      "type": "text",
      "placeholder": "Your full name as per passport",
      "required": true,
      "width": "full",
      "field_name": "full_name"
    },
    {
      "label": "Email Address",
      "type": "email",
      "placeholder": "your.email@example.com",
      "required": true,
      "width": "half",
      "field_name": "email"
    },
    {
      "label": "Contact Number",
      "type": "tel",
      "placeholder": "+92 XXX XXXXXXX",
      "required": true,
      "width": "half",
      "field_name": "contact_number"
    },
    {
      "label": "Passport Number",
      "type": "text",
      "placeholder": "AB1234567",
      "required": false,
      "width": "half",
      "field_name": "passport_number"
    },
    {
      "label": "CNIC Number",
      "type": "text",
      "placeholder": "XXXXX-XXXXXXX-X",
      "required": false,
      "width": "half",
      "field_name": "cnic"
    },
    {
      "label": "Additional Message",
      "type": "textarea",
      "placeholder": "Any specific requirements?",
      "required": false,
      "width": "full",
      "field_name": "message"
    }
  ],
  "buttons": [
    {
      "label": "Get Quote",
      "action": "submit",
      "style": "primary"
    }
  ],
  "notes": [
    {
      "type": "info",
      "content": "Our Hajj expert will contact you within 2 hours"
    }
  ],
  "status": "active"
}
```

**Response:** `201 Created`
```json
{
  "id": 8,
  "form_unique_id": "hajj-package-interest-form-b7c8e1",
  "form_title": "Hajj Package Interest Form",
  "form_page_url": "/forms/hajj-package-interest-form-b7c8e1",
  "linked_blog": 52,
  "linked_blog_title": "Hajj 2024: Complete Guide",
  "is_linked_with_blog": true,
  "display_position": "sidebar",
  "fields": [...],
  "buttons": [...],
  "notes": [...],
  "organization": 1,
  "organization_name": "Saer Travels",
  "branch": 3,
  "branch_name": "Karachi Branch",
  "status": "active",
  "submission_count": 0,
  "created_by": 12,
  "created_by_name": "Ahmed Ali",
  "created_at": "2024-01-21T09:15:00Z",
  "updated_at": "2024-01-21T09:15:00Z"
}
```

**Field Validation:**
- `fields` must be an array of objects with: label, type, field_name, required, width
- Supported field types: text, email, tel, number, textarea, select, checkbox, radio, date
- `field_name` must match Lead model fields for auto-forwarding
- `buttons` must be an array with: label, action
- Supported actions: submit, reset, cancel

---

### 3. Retrieve Form

**GET** `/api/forms/{id}/`

Get details of a specific form.

**Authentication:** Required (JWT)

**Response:** `200 OK`
```json
{
  "id": 1,
  "form_unique_id": "umrah-leads-form-a3f5d2",
  "form_title": "Umrah Package Interest Form",
  "form_page_url": "/forms/umrah-leads-form-a3f5d2",
  "linked_blog": 45,
  "linked_blog_title": "Complete Guide to Umrah 2024",
  "is_linked_with_blog": true,
  "display_position": "end_of_blog",
  "fields": [...],
  "buttons": [...],
  "notes": [...],
  "organization": 1,
  "organization_name": "Saer Travels",
  "branch": 3,
  "branch_name": "Karachi Branch",
  "status": "active",
  "submission_count": 47,
  "created_by": 12,
  "created_by_name": "Ahmed Ali",
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-20T14:22:00Z"
}
```

---

### 4. Update Form

**PUT/PATCH** `/api/forms/{id}/`

Update an existing form.

**Authentication:** Required (JWT)

**Request Body:** (Same as Create, all fields optional for PATCH)

**Response:** `200 OK` (Same structure as Retrieve)

---

### 5. Delete Form

**DELETE** `/api/forms/{id}/`

Delete a form (soft delete recommended, but hard delete supported).

**Authentication:** Required (JWT)

**Response:** `204 No Content`

---

### 6. Get Form Submissions

**GET** `/api/forms/{id}/submissions/`

Retrieve all submissions for a specific form.

**Authentication:** Required (JWT)

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | Integer | Results per page |
| `offset` | Integer | Pagination offset |

**Response:** `200 OK`
```json
{
  "count": 47,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 125,
      "form": 1,
      "lead": 892,
      "submission_data": {
        "full_name": "Fatima Khan",
        "contact_number": "+923001234567",
        "email": "fatima@example.com",
        "passport_number": "AB1234567",
        "message": "Interested in family Umrah package for 4 people"
      },
      "ip_address": "103.244.178.23",
      "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
      "referrer": "https://saer.pk/blog/umrah-guide-2024",
      "submitted_at": "2024-01-20T14:22:35Z"
    }
  ]
}
```

---

### 7. Get Forms by Blog

**GET** `/api/forms/by-blog/{blog_id}/`

Retrieve all forms linked to a specific blog post.

**Authentication:** Required (JWT)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "form_unique_id": "umrah-leads-form-a3f5d2",
    "form_title": "Umrah Package Interest Form",
    "display_position": "end_of_blog",
    "fields": [...],
    "buttons": [...],
    "submission_count": 47,
    "status": "active"
  },
  {
    "id": 5,
    "form_unique_id": "quick-contact-form-d9e2f3",
    "form_title": "Quick Contact Form",
    "display_position": "sidebar",
    "fields": [...],
    "buttons": [...],
    "submission_count": 12,
    "status": "active"
  }
]
```

---

### 8. Submit Form (Public Endpoint)

**POST** `/api/forms/{form_unique_id}/submit/`

Public endpoint for form submissions. **No authentication required.**

**Request Body:**
```json
{
  "full_name": "Ahmed Hassan",
  "contact_number": "+923001234567",
  "email": "ahmed@example.com",
  "passport_number": "AB9876543",
  "cnic": "42101-1234567-8",
  "preferred_package_type": "Umrah",
  "message": "Looking for Umrah package for 2 adults in Ramadan 2024"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "message": "Form submitted successfully",
  "submission_id": 126,
  "lead_id": 893,
  "form_title": "Umrah Package Interest Form"
}
```

**Auto-Actions:**
1. **Validates submission data** against form field configuration
2. **Creates Lead record** using LeadSerializer with field mapping:
   - `full_name` → `customer_full_name`
   - `contact_number` → `contact_number`
   - `email` → `email`
   - `passport_number` → `passport_number`
   - `cnic` → `cnic_number`
   - `message` → `remarks`
   - `preferred_package_type` → `interested_in`
3. **Creates FormSubmission record** linking to the Lead
4. **Increments submission_count** on the form
5. **Captures metadata**: IP address, user agent, referrer

**Field Mapping Logic:**
```python
field_mapping = {
    'full_name': 'customer_full_name',
    'contact_number': 'contact_number',
    'email': 'email',
    'passport_number': 'passport_number',
    'cnic': 'cnic_number',
    'message': 'remarks',
    'preferred_package_type': 'interested_in',
}
```

**Error Responses:**

`404 Not Found` - Form doesn't exist:
```json
{
  "error": "Form not found"
}
```

`400 Bad Request` - Validation error:
```json
{
  "error": "Validation failed",
  "details": {
    "contact_number": ["This field is required"]
  }
}
```

`400 Bad Request` - Lead creation failed:
```json
{
  "error": "Failed to create lead",
  "details": "Organization field is required"
}
```

---

### 9. Get Form by URL (Public Endpoint)

**GET** `/api/forms/by-url/?url={form_page_url}`

Retrieve form configuration by its public URL. **No authentication required.**

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | String | Yes | Form page URL (e.g., /forms/umrah-leads-form-a3f5d2) |

**Example Request:**
```
GET /api/forms/by-url/?url=/forms/umrah-leads-form-a3f5d2
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "form_unique_id": "umrah-leads-form-a3f5d2",
  "form_title": "Umrah Package Interest Form",
  "form_page_url": "/forms/umrah-leads-form-a3f5d2",
  "display_position": "standalone",
  "fields": [
    {
      "label": "Full Name",
      "type": "text",
      "placeholder": "Enter your full name",
      "required": true,
      "width": "full",
      "field_name": "full_name"
    },
    {
      "label": "Contact Number",
      "type": "tel",
      "placeholder": "+92 XXX XXXXXXX",
      "required": true,
      "width": "half",
      "field_name": "contact_number"
    },
    {
      "label": "Email",
      "type": "email",
      "placeholder": "your.email@example.com",
      "required": true,
      "width": "half",
      "field_name": "email"
    }
  ],
  "buttons": [
    {
      "label": "Submit",
      "action": "submit",
      "style": "primary"
    }
  ],
  "notes": [
    {
      "type": "info",
      "content": "We'll contact you within 24 hours"
    }
  ],
  "status": "active"
}
```

**Use Case:** Frontend routing - when user visits `/forms/umrah-leads-form-a3f5d2`, frontend calls this endpoint to load form configuration.

**Error Response:**

`404 Not Found`:
```json
{
  "error": "Form not found with the given URL"
}
```

---

## Usage Examples

### Creating a Standalone Lead Capture Form

```python
import requests

url = "https://api.saer.pk/api/forms/"
headers = {
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json"
}

data = {
    "form_title": "Newsletter Signup Form",
    "is_linked_with_blog": False,
    "display_position": "standalone",
    "fields": [
        {
            "label": "Full Name",
            "type": "text",
            "placeholder": "Your name",
            "required": True,
            "width": "full",
            "field_name": "full_name"
        },
        {
            "label": "Email",
            "type": "email",
            "placeholder": "your@email.com",
            "required": True,
            "width": "full",
            "field_name": "email"
        }
    ],
    "buttons": [
        {
            "label": "Subscribe",
            "action": "submit",
            "style": "primary"
        }
    ],
    "status": "active"
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

### Submitting a Form (Public)

```javascript
// Frontend JavaScript example
async function submitForm(formUniqueId, formData) {
  const url = `https://api.saer.pk/api/forms/${formUniqueId}/submit/`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log(`Lead created with ID: ${result.lead_id}`);
    alert('Thank you for your submission!');
  } else {
    console.error('Submission failed:', result.error);
  }
}

// Usage
const formData = {
  full_name: "Ali Ahmed",
  contact_number: "+923001234567",
  email: "ali@example.com",
  message: "Interested in Hajj packages"
};

submitForm("umrah-leads-form-a3f5d2", formData);
```

### Loading Form by URL (Public)

```javascript
// Frontend router integration
async function loadFormByURL(pageUrl) {
  const url = `https://api.saer.pk/api/forms/by-url/?url=${encodeURIComponent(pageUrl)}`;
  
  const response = await fetch(url);
  const formConfig = await response.json();
  
  if (formConfig.error) {
    console.error('Form not found');
    return null;
  }
  
  // Render form using formConfig.fields, formConfig.buttons, etc.
  renderDynamicForm(formConfig);
}

// When user visits /forms/umrah-leads-form-a3f5d2
loadFormByURL('/forms/umrah-leads-form-a3f5d2');
```

### Linking Form to Blog

```python
import requests

url = "https://api.saer.pk/api/forms/"
headers = {
    "Authorization": "Bearer YOUR_JWT_TOKEN",
    "Content-Type": "application/json"
}

data = {
    "form_title": "Tour Package Interest Form",
    "linked_blog_id": 78,  # Blog post ID
    "is_linked_with_blog": True,
    "display_position": "end_of_blog",
    "fields": [
        {
            "label": "Name",
            "type": "text",
            "required": True,
            "width": "full",
            "field_name": "full_name"
        },
        {
            "label": "Phone",
            "type": "tel",
            "required": True,
            "width": "half",
            "field_name": "contact_number"
        },
        {
            "label": "Email",
            "type": "email",
            "required": True,
            "width": "half",
            "field_name": "email"
        },
        {
            "label": "Preferred Destination",
            "type": "select",
            "required": False,
            "width": "full",
            "field_name": "preferred_package_type",
            "options": ["Dubai", "Turkey", "Malaysia", "Europe"]
        }
    ],
    "buttons": [
        {
            "label": "Get Quote",
            "action": "submit"
        }
    ],
    "notes": [
        {
            "type": "info",
            "content": "Free consultation within 24 hours"
        }
    ],
    "status": "active"
}

response = requests.post(url, json=data, headers=headers)
form = response.json()

print(f"Form created: {form['form_page_url']}")
print(f"Linked to blog ID: {form['linked_blog']}")
```

---

## Admin Interface

**Access:** Django Admin → Forms → Dynamic Forms

**Features:**
- Create/Edit forms with visual field configuration
- View submission count per form
- Filter by status, organization, branch
- Search by title or unique ID
- View all submissions (read-only)
- Monitor IP addresses and referrers

**Fieldsets:**
1. **Basic Information**: Title, Blog Link, Display Position
2. **Display Configuration**: Position, Status
3. **Form Structure**: Fields, Buttons, Notes (JSON editors)
4. **Metadata**: Organization, Branch, Submission Count, Timestamps

---

## Field Types Reference

### Supported Field Types

| Type | HTML Input | Use Case | Validation |
|------|-----------|----------|------------|
| `text` | `<input type="text">` | General text input | Max 255 chars |
| `email` | `<input type="email">` | Email addresses | Email format |
| `tel` | `<input type="tel">` | Phone numbers | Phone format |
| `number` | `<input type="number">` | Numeric values | Integer/decimal |
| `textarea` | `<textarea>` | Long text | Max 2000 chars |
| `select` | `<select>` | Dropdown selection | Must have options |
| `checkbox` | `<input type="checkbox">` | Boolean/multi-select | True/false |
| `radio` | `<input type="radio">` | Single selection | Must have options |
| `date` | `<input type="date">` | Date picker | Date format |

### Field Width Options

| Width | Description | Grid Span |
|-------|-------------|-----------|
| `full` | Full width | 12 columns |
| `half` | Half width | 6 columns |
| `third` | One-third width | 4 columns |
| `quarter` | Quarter width | 3 columns |

---

## Display Position Options

| Position | Description | Recommended Use |
|----------|-------------|-----------------|
| `end_of_blog` | After blog content | Primary lead capture |
| `sidebar` | Blog sidebar widget | Quick contact forms |
| `popup` | Modal/overlay | High-intent offers |
| `standalone` | Dedicated page | Landing pages, campaigns |

---

## Integration with Leads Module

### Automatic Lead Creation

When a form is submitted:

1. **Field Mapping:** Submission data is mapped to Lead model fields:
   ```python
   {
     'full_name': 'customer_full_name',
     'contact_number': 'contact_number',
     'email': 'email',
     'passport_number': 'passport_number',
     'cnic': 'cnic_number',
     'message': 'remarks',
     'preferred_package_type': 'interested_in',
   }
   ```

2. **Lead Creation:** Uses existing `LeadSerializer` with organization/branch from form

3. **Metadata Appended:** Form information added to Lead.remarks:
   ```
   Original message from user...
   
   ---
   Submitted via form: Umrah Package Interest Form
   Form URL: /forms/umrah-leads-form-a3f5d2
   ```

4. **Lead Source:** Set to "Web Form" automatically

5. **FormSubmission Record:** Links submission to created Lead for tracking

### Benefits

- ✅ Single source of truth for leads
- ✅ Unified lead management workflow
- ✅ No duplicate data entry
- ✅ Track conversion from form to booking
- ✅ Form-specific analytics via submission_count

---

## Testing Guide

### 1. Create a Test Form

```bash
curl -X POST https://api.saer.pk/api/forms/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "form_title": "Test Lead Form",
    "is_linked_with_blog": false,
    "display_position": "standalone",
    "fields": [
      {
        "label": "Name",
        "type": "text",
        "required": true,
        "width": "full",
        "field_name": "full_name"
      },
      {
        "label": "Phone",
        "type": "tel",
        "required": true,
        "width": "full",
        "field_name": "contact_number"
      }
    ],
    "buttons": [{"label": "Submit", "action": "submit"}],
    "status": "active"
  }'
```

### 2. Submit Test Data (Public)

```bash
curl -X POST https://api.saer.pk/api/forms/test-lead-form-abc123/submit/ \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "contact_number": "+923001234567"
  }'
```

### 3. Verify Lead Created

```bash
curl -X GET https://api.saer.pk/api/leads/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Check Submissions

```bash
curl -X GET https://api.saer.pk/api/forms/1/submissions/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Security Considerations

### Authentication

- **Public Endpoints:** `/submit/` and `/by-url/` (intentionally no auth for lead capture)
- **Protected Endpoints:** All CRUD operations require JWT authentication
- **User Scoping:** Users can only manage forms from their organization

### Data Validation

- Field structure validated against schema
- Required fields enforced on submission
- Email/phone format validation
- XSS protection on all text inputs
- CSRF protection via Django middleware

### Rate Limiting

**Recommended:** Implement rate limiting on public submission endpoint:
```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',  # For form submissions
        'user': '1000/hour'
    }
}
```

---

## Performance Optimization

### Database Indexes

Created on:
- `form_unique_id` (for fast lookups)
- `status, created_at` (for filtered lists)
- `organization, status` (for user-scoped queries)

### Caching Strategy

```python
# Cache form configuration for public access
from django.core.cache import cache

def get_form_by_url(url):
    cache_key = f'form_config_{url}'
    form = cache.get(cache_key)
    
    if not form:
        form = DynamicForm.objects.get(form_page_url=url)
        cache.set(cache_key, form, timeout=3600)  # 1 hour
    
    return form
```

### Query Optimization

- `select_related('organization', 'branch', 'created_by')` on list views
- `prefetch_related('submissions')` for submission counts
- Database-level submission counting (no N+1 queries)

---

## Troubleshooting

### Issue: Form Submission Returns 404

**Cause:** Incorrect `form_unique_id` in URL

**Solution:** Verify form exists and use exact unique ID:
```bash
curl https://api.saer.pk/api/forms/ -H "Authorization: Bearer TOKEN"
```

### Issue: Lead Not Created After Submission

**Cause:** Field mapping mismatch or missing required fields

**Solution:** 
1. Check FormSubmission record (should exist even if Lead creation failed)
2. Review field_name values in form configuration
3. Ensure organization/branch are set on form

### Issue: Form URL Not Unique

**Cause:** Multiple forms with similar titles

**Solution:** System auto-appends counter, but verify with:
```python
DynamicForm.objects.filter(form_page_url__startswith='/forms/test-form')
```

---

## Future Enhancements

### Planned Features
- [ ] Conditional field display (show field X if field Y = value)
- [ ] Multi-step forms
- [ ] File upload fields
- [ ] CAPTCHA integration
- [ ] Email notifications on submission
- [ ] Webhook support for real-time integrations
- [ ] Form analytics dashboard
- [ ] A/B testing for form variations
- [ ] Auto-response emails
- [ ] Zapier/Make.com integration

---

## API Response Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Form/submission created |
| 204 | No Content | Form deleted |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Form doesn't exist |
| 500 | Internal Server Error | Server error |

---

## Related Documentation

- [Leads API Documentation](LEADS_API_DOCUMENTATION.md)
- [Blog API Documentation](BLOG_API_DOCUMENTATION.md)
- [Hotel Outsourcing API Documentation](HOTEL_OUTSOURCING_DOCUMENTATION.md)
- [Public Order Details API Documentation](PUBLIC_ORDER_DETAILS_DOCUMENTATION.md)
- [Pax Movement Dashboard API Documentation](PAX_MOVEMENT_DOCUMENTATION.md)

---

**Module Version:** 1.0.0  
**Last Updated:** January 2024  
**Status:** ✅ Fully Implemented and Tested
