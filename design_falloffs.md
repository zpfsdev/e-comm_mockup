# Dashboard UX & Architectural Design Falloffs

Following the review of the "Manage User" modal, I explored the rest of the Admin and Seller dashboards. I found several recurring design patterns that cause friction, risk accidental data mutation, or pose security concerns.

Here is a comprehensive list of design falloffs and recommended changes.

## 1. Missing Action Confirmations (High Risk)
Across both dashboards, clicking action buttons instantly triggers API mutations. There are no confirmation dialogues for high-impact or destructive actions.

**Instances Found:**
- **Admin Dashboard**: Approving/Rejecting/Suspending shops.
- **Admin Disputes**: Approving refunds (which permanently voids seller commissions) and rejecting disputes.
- **Admin Users**: Elevating user roles and resetting passwords.
- **Seller Dashboard**: Confirming or Canceling customer orders, and marking them as Delivered.

> [!WARNING] 
> Instant mutations on destructive actions lead to accidental clicks that customer support or engineers have to manually revert in the database.

**Recommendation**: Implement a reusable `<ConfirmModal />` component. For instance, clicking "Cancel Order" should open a modal: *"Are you sure you want to cancel this order? This action cannot be undone."* before triggering the mutation.

## 2. Insecure & Hardcoded Password Resets
In `admin/dashboard/page.tsx`, the "Force Password Reset" button hardcodes the new password to `welcome123`.

> [!CAUTION]
> Setting a known plaintext password allows anyone who knows the pattern (or has access to the codebase) to hijack user accounts.

**Recommendation**: 
Instead of setting a hardcoded password, the button should trigger an API endpoint that generates a secure, time-limited reset token and emails it to the user. If an instant reset is strictly required for this mockup, the system should generate a random password, display it once in the admin UI, and force the user to change it upon next login.

## 3. Disconnect Between UI State and Database Schema
The database schema allows for relationships that the UI does not accurately reflect or manage.

**Instances Found:**
- **User Roles**: The `schema.prisma` allows multiple roles per user (`UserRole` table). However, the Admin UI uses mutually exclusive buttons ("Make Admin", "Make Seller", "Make Customer") which implies a user can only hold one role.
- **Missing Status Controls**: The Admin Users table shows if a user is `Active` or `Suspended`, but the Manage User modal lacks the buttons to toggle this status.

**Recommendation**: 
Change the Role Management UI to use toggle switches or checkboxes so an Admin can assign multiple roles (e.g., a user can be both a Customer and a Seller). Add "Suspend User" and "Activate User" buttons to the Manage User modal.

## 4. Suboptimal User Feedback (UX)
The application relies heavily on state resets or browser-native alerts to communicate success, which feels disjointed in a modern web app.

**Instances Found:**
- **Admin Payouts**: Successfully settling a seller's payout triggers a native browser `alert()` dialog.
- **Admin Disputes**: Success merely removes the item from the list without explicitly confirming to the user that the refund was processed.

> [!TIP]
> Use a unified Toast notification system (like `react-hot-toast` or `sonner`) for success and error messages.

**Recommendation**: Replace `alert()` and silent successes with toast notifications (e.g., *"✅ Successfully settled payouts for [Shop Name]"*).

## 5. Inflexible Payouts System
In `admin/payouts/page.tsx`, the "Settle Payout" button groups **all** unpaid commissions for a given seller and settles them under a single reference number. 

**Recommendation**: Add the ability to expand a seller's row to view itemized unpaid commissions. Allow the admin to select specific commissions to settle, rather than forcing an all-or-nothing payout.

## 6. Confusing "Banned" Shop State
When a shop is `Pending`, an Admin can click "Reject", which sets the shop's status to `Banned`. However, once banned, the UI displays an "Activate" button. Clicking "Activate" on a banned shop feels unintuitive.

**Recommendation**: Add an "Unban Shop" button specifically for the `Banned` state, or explicitly label the action to prevent confusion.
