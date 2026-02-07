# Step-by-Step Guide to Access Control

This document explains how role-based access control is implemented in your application. The system is designed to differentiate between three main roles: `client`, `staff`, and `admin`.

---

### Part 1: Defining User Roles (The Data Layer)

The foundation of our access control is the `role` property on a user's record.

**1. Data Structure:**
In `docs/backend.json`, the `User` entity is defined with a `role` property. This establishes that every user will have a role associated with them.

```json
"User": {
  "type": "object",
  "properties": {
    "email": { ... },
    "name": { ... },
    "role": {
      "type": "string",
      "description": "The user's role within the application (e.g., 'client', 'admin', 'staff').",
      "enum": ["client", "admin", "staff"]
    }
  },
  ...
}
```

**2. Assigning a Default Role:**
When a new user signs up, they are automatically assigned the `client` role. This logic is in `src/components/auth/register-form.tsx`.

```tsx
// src/components/auth/register-form.tsx

const newUser: Omit<AppUser, 'id'> = {
  uid: firebaseUser.uid,
  name: values.name,
  email: values.email,
  role: 'client', // New users are always clients
};
await setDoc(userDocRef, newUser);
```

**3. How to Make a User an Admin or Staff:**
You can grant a user elevated privileges in two ways:
- **In the App (Recommended):** As an admin, navigate to the "Manage Users" page from the homepage. You can use the dropdown next to any user's name to change their role to `staff` or `admin`.
- **Manually in Firestore:** Go to the Firebase Console, navigate to the `users` collection, find the user's document, and edit the `role` field to `'staff'` or `'admin'`.

---

### Part 2: Loading User Roles on the Frontend (The Auth Provider)

When a user logs in, we need to fetch their role and make it available throughout the app.

**File:** `src/components/auth-provider.tsx`

This component listens for authentication changes. When a user logs in, it fetches their corresponding document from the `users` collection in Firestore and stores their complete profile (including the `role`) in the auth context.

This user object is then accessible in any component by calling the `useAuth()` hook.

```tsx
// src/components/auth-provider.tsx

const { user, loading } = useAuth();
// user object now contains: { uid, name, email, role }
```

---

### Part 3: Controlling UI Visibility (Conditional Rendering)

With the user's role available, we can now easily show or hide parts of the user interface.

**Files:** `src/components/layout/header.tsx`, `src/app/page.tsx`

You will see this pattern used frequently:

```tsx
// Show to Admins AND Staff
{(user?.role === 'admin' || user?.role === 'staff') && (
  <ActionCard
    href="/overview"
    icon={<LayoutDashboard />}
    title="Overview"
    description="View key stats and charts."
  />
)}

// Show ONLY to Admins
{user?.role === 'admin' && (
  <ActionCard
    href="/admin/users"
    icon={<Users />}
    title="Manage Users"
    description="Change user roles."
  />
)}
```
This is a standard React pattern for conditional rendering. This is how we hide admin-only links and buttons from regular clients and staff.

---

### Part 4: Protecting Pages (Route Guards)

Hiding a link is not enough. A user could still try to access a page by typing the URL directly. We prevent this using "route guards".

**Files:**
- `src/components/admin/admin-route.tsx` (for admin-only pages)
- `src/components/admin/staff-admin-route.tsx` (for pages accessible by staff and admins)

These components wrap any page that should be protected. For example, `src/app/admin/users/page.tsx` is wrapped in `AdminRoute` because only admins should manage users. Conversely, `src/app/overview/page.tsx` is wrapped in `StaffAdminRoute` because both staff and admins should see it.

If an unauthorized user tries to access a protected page, the route guard automatically redirects them to the homepage.

---

### Part 5: Enforcing Security on the Backend (Firestore Rules)

This is the most critical part of access control. Frontend controls can be bypassed, but backend rules cannot.

**File:** `firestore.rules`

These rules are the ultimate source of truth for your data security. They run on Google's servers and cannot be tampered with by users.

We have helper functions like `isAdmin()` and `isStaff()` to check the user's role directly from the database.

```rules
function isStaffOrAdmin() {
  return isAdmin() || isStaff();
}

match /appointments/{appointmentId} {
  // An admin or staff member can read any appointment.
  allow get: if isStaffOrAdmin() || resource.data.clientId == request.auth.uid;
  
  // Only admins or staff can update or delete an appointment.
  allow update, delete: if isStaffOrAdmin();
}
```

This ensures that even if a client could somehow try to modify an appointment that isn't theirs, your Firestore Security Rules would block the request.

---

### Summary

By combining these five steps, you have a complete, multi-layered security model:
- **Data Layer:** The `role` is defined and stored.
- **Auth Provider:** The `role` is loaded into the app.
- **Conditional UI:** The UI adapts based on the `role`.
- **Route Guards:** Pages are protected from unauthorized access.
- **Firestore Rules:** The backend enforces data access policies, providing the ultimate security.
