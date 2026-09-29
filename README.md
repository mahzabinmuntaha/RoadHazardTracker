# Road Hazard Reporting & Tracking System
**University Individual Project — Full-Stack Web Application**

## 1. Project Concept & Academic Scope
This is a community-based **Road Hazard Reporting & Tracking System** built for a university individual project.
The application empowers citizens to report, manage, assign, and track road and public infrastructure hazards (such as potholes, open manholes, broken traffic signals, waterlogging, damaged street lights, and fallen trees).

> **Important Academic Scope:** This system is an educational prototype. It does NOT claim to be officially connected to any government agency or municipal authority. Generic prototype departments (e.g. *Road & Infrastructure Department*, *Drainage & Water Management Department*, *Traffic Management Department*) are utilized to demonstrate the assignment concept.

---

## 2. Technology Stack
* **Frontend:** Semantic HTML5, Vanilla CSS3 (modern responsive design), Vanilla JavaScript (ES6+).
* **Backend & Database:** Supabase (PostgreSQL Database, Supabase Authentication, Supabase Storage for hazard photo uploads).
* **No External Frontend Frameworks:** No React, Next.js, PHP, or MySQL are used in application runtime logic. Clean, beginner-friendly vanilla architecture.

---

## 3. Main Workflow
$$\text{Citizen} \xrightarrow{\text{Submit Hazard}} \text{System Auto-Suggests Dept} \xrightarrow{\text{Admin Verifies}} \text{Admin Assigns Authority} \xrightarrow{\text{Status Updates}} \text{Citizen Tracks Resolution}$$

### Lifecycle Status Progression:
$$\text{Reported} \longrightarrow \text{Verified} \longrightarrow \text{Assigned} \longrightarrow \text{In Progress} \longrightarrow \text{Resolved}$$
*(Alternatively: **Rejected** if determined duplicate or out of scope)*

---

## 4. System Architecture & Database (ER) Structure

### PostgreSQL Tables:
1. **`profiles`**
   - `id` (UUID, references `auth.users(id)` ON DELETE CASCADE)
   - `full_name` (TEXT)
   - `email` (TEXT)
   - `role` (TEXT, CHECK `role IN ('user', 'admin')`)
   - `created_at` (TIMESTAMPTZ)

2. **`departments`**
   - `id` (UUID, Primary Key)
   - `department_name` (TEXT, UNIQUE)
   - `description` (TEXT)
   - `created_at` (TIMESTAMPTZ)

3. **`area_department_mapping`**
   - `id` (UUID, Primary Key)
   - `area` (TEXT)
   - `hazard_type` (TEXT)
   - `department_id` (UUID, Foreign Key to `departments.id`)
   - *UNIQUE constraint on `(area, hazard_type)`*

4. **`hazards`**
   - `id` (UUID, Primary Key)
   - `user_id` (UUID, Foreign Key to `auth.users(id)`)
   - `hazard_type` (TEXT)
   - `area` (TEXT)
   - `road_name` (TEXT)
   - `landmark` (TEXT)
   - `severity` (TEXT, CHECK `severity IN ('Low', 'Medium', 'High')`)
   - `description` (TEXT)
   - `image_url` (TEXT)
   - `suggested_department_id` (UUID, Foreign Key to `departments.id`)
   - `assigned_department_id` (UUID, Foreign Key to `departments.id`)
   - `status` (TEXT, CHECK `status IN ('Reported', 'Verified', 'Assigned', 'In Progress', 'Resolved', 'Rejected')`)
   - `admin_note` (TEXT)
   - `created_at` (TIMESTAMPTZ)
   - `updated_at` (TIMESTAMPTZ)

5. **`status_history`**
   - `id` (UUID, Primary Key)
   - `hazard_id` (UUID, Foreign Key to `hazards.id` ON DELETE CASCADE)
   - `status` (TEXT)
   - `changed_by` (TEXT)
   - `note` (TEXT)
   - `changed_at` (TIMESTAMPTZ)

---

## 5. Row Level Security (RLS) Design
- **`profiles`**: Public profiles readable by authenticated users; users can only update their own profile.
- **`departments`**: All users can read departments; only admin can create/delete departments.
- **`area_department_mapping`**: Read by all; updated only by admin.
- **`hazards`**:
  - `SELECT`: Publicly viewable for community awareness.
  - `INSERT`: Authenticated users can submit reports with their `user_id`.
  - `UPDATE`: Normal citizens can update their own report **only while status is 'Reported'**; Administrators can update any report at any lifecycle stage.
  - `DELETE`: Normal citizens can delete their own report **only while status is 'Reported'**; Administrators can remove duplicate/inappropriate reports.
- **`status_history`**: Audit trail readable by everyone; appended on every status change.
- **Storage Bucket (`hazard-images`)**: Authenticated upload, public read.

---

## 6. Project Folder Structure
```
road-hazard-system/
├── index.html               # Home page with stats, hero, workflow, recent reports
├── login.html               # Supabase Authentication login with role redirection
├── register.html            # Citizen registration with client-side validation
├── dashboard.html           # Citizen dashboard with metrics and recent items
├── report.html              # Hazard submission form with dynamic department suggestion
├── reports.html             # Public registry with search, filtering & card/table toggle
├── my-reports.html          # User's own hazard submissions with edit/delete actions
├── report-details.html      # Visual 5-step status tracker & timestamped audit trail
├── setup-guide.html         # Supabase setup guide, credential tester & SQL viewer
│
├── admin/
│   ├── dashboard.html       # Admin 7-status KPI breakdown & triage overview
│   ├── reports.html         # Verification, department assignment, admin note, delete
│   └── departments.html     # Area-Department mapping and department management
│
├── css/
│   ├── style.css            # Civic tech theme, variables, navbar, badges, modals
│   ├── auth.css             # Authentication layouts, quick test buttons
│   ├── dashboard.css        # Visual status tracker, data tables, suggestion card
│   └── responsive.css       # Mobile and tablet breakpoints
│
├── js/
│   ├── supabase.js          # Supabase client, database service & offline demo fallback
│   ├── auth.js              # Auth state manager, navbar renderer, toast alerts
│   ├── dashboard.js         # User dashboard metrics and recent table controller
│   ├── report.js            # Dynamic suggestion engine & photo upload
│   ├── reports.js           # Multi-criteria filter, search, grid/table switcher
│   ├── my-reports.js        # User report editor and delete controls
│   ├── report-details.js    # Visual pipeline progression & audit timeline
│   └── admin.js             # Admin triage modal, status updates, mapping manager
│
└── supabase_schema.sql      # Complete SQL script for Supabase SQL Editor
```

---

## 7. Pre-configured Demo Accounts for Presentation
The system provides ready-to-use demo accounts so you can demonstrate both roles during your defense without setup friction:

1. **Citizen User:**
   - Email: `citizen@example.com`
   - Password: `password123`
   - Role: `user`
2. **System Administrator:**
   - Email: `admin@example.com`
   - Password: `adminpassword`
   - Role: `admin`

*(Quick autofill buttons are available right on the login screen!)*
