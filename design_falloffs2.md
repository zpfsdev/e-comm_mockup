# Dashboard UX & Architectural Design Falloffs

Following the review of the "Manage User" modal, I explored the rest of the Admin and Seller dashboards, as well as the Customer-facing views (Cart, Checkout, Sign Up, etc.). I found several recurring design patterns that cause friction, risk accidental data mutation, or pose security concerns.

Here is a comprehensive list of design falloffs and recommended changes.

## 1. Missing Action Confirmations (High Risk)
Across the dashboards, clicking action buttons instantly triggers API mutations. There are no confirmation dialogues for high-impact or destructive actions.

**Instances Found:**
- **Admin Dashboard**: Approving/Rejecting/Suspending shops.
- **Admin Disputes**: Approving refunds (which permanently voids seller commissions) and rejecting disputes.
- **Admin Users**: Elevating user roles and resetting passwords.
- **Seller Dashboard**: Confirming or Canceling customer orders, and marking them as Delivered.
- **Customer Cart**: Removing items from the cart deletes them instantly without a confirmation prompt or an "Undo" toast.

> [!WARNING] 
> Instant mutations on destructive actions lead to accidental clicks that customer support or engineers have to manually revert in the database.

**Recommendation**: Implement a reusable `<ConfirmModal />` component. For instance, clicking "Cancel Order" should open a modal: *"Are you sure you want to cancel this order? This action cannot be undone."* before triggering the mutation. For low-stakes actions like cart removal, use an "Undo" toast notification.

## 2. Unsaved Form Exit Warnings & Destructive File Uploads
In `seller/products/new/page.tsx` and the corresponding `edit` page, clicking "Cancel" instantly routes the user back to the dashboard, destroying all form progress.

Furthermore, when a user clicks "Remove Image" while filling out the form, it *immediately* sends a `DELETE` request to the `/api/upload` endpoint. If they are editing an existing product and click "Remove Image", but then click "Cancel" to discard changes, the image is already permanently deleted from the server, breaking the live product listing!

**Recommendation**: 
- Prompt the user with an "Unsaved Changes" warning if they try to navigate away from a dirty form.
- Decouple file deletion from the UI state. Removing an image from the UI shouldn't send the `DELETE` API call until the form is officially "Saved". 

## 3. Insecure & Hardcoded Password Resets
In `admin/dashboard/page.tsx`, the "Force Password Reset" button hardcodes the new password to `welcome123`.

> [!CAUTION]
> Setting a known plaintext password allows anyone who knows the pattern (or has access to the codebase) to hijack user accounts.

**Recommendation**: 
Instead of setting a hardcoded password, the button should trigger an API endpoint that generates a secure, time-limited reset token and emails it to the user.

## 4. Disconnect Between UI State and Database Schema
The database schema allows for relationships that the UI does not accurately reflect or manage.

**Instances Found:**
- **User Roles**: The `schema.prisma` allows multiple roles per user (`UserRole` table). However, the Admin UI uses mutually exclusive buttons ("Make Admin", "Make Seller", "Make Customer") which implies a user can only hold one role.
- **Missing Status Controls**: The Admin Users table shows if a user is `Active` or `Suspended`, but the Manage User modal lacks the buttons to toggle this status.

**Recommendation**: 
Change the Role Management UI to use toggle switches or checkboxes so an Admin can assign multiple roles. Add "Suspend User" and "Activate User" buttons to the Manage User modal.

## 5. Suboptimal User Feedback & Blocking UX
The application relies heavily on state resets, browser-native alerts, or artificial delays to communicate success.

**Instances Found:**
- **Admin Payouts**: Successfully settling a seller's payout triggers a native browser `alert()` dialog.
- **Admin Disputes**: Success merely removes the item from the list without explicitly confirming to the user that the refund was processed.
- **Checkout Page**: When an order is placed, the user is locked on a screen that says "Order Placed" via a hardcoded `setTimeout` of 2.5 seconds before being routed to their orders page.

> [!TIP]
> Use a unified Toast notification system (like `react-hot-toast` or `sonner`) for success and error messages.

**Recommendation**: Replace `alert()`, silent successes, and artificial timeouts with toast notifications. Navigation should be instant, with the toast carrying over to the next page.

## 6. Inflexible Payouts System
In `admin/payouts/page.tsx`, the "Settle Payout" button groups **all** unpaid commissions for a given seller and settles them under a single reference number. 

**Recommendation**: Add the ability to expand a seller's row to view itemized unpaid commissions. Allow the admin to select specific commissions to settle, rather than forcing an all-or-nothing payout.

## 7. Confusing "Banned" Shop State
When a shop is `Pending`, an Admin can click "Reject", which sets the shop's status to `Banned`. However, once banned, the UI displays an "Activate" button. Clicking "Activate" on a banned shop feels unintuitive.

**Recommendation**: Add an "Unban Shop" button specifically for the `Banned` state, or explicitly label the action to prevent confusion.

## 8. Weak Input Validation on Auth
The Zod schema for signing up allows for some logically invalid states:
- `dateOfBirth` doesn't check if the date is in the future.
- `contactNumber` only checks for a minimum of 7 characters, without validating formatting (like enforcing a specific format for Philippine numbers, e.g., `+639...` or `09...`).

**Recommendation**: Apply stricter Zod refinements (e.g., `.max(new Date())` for DOB and a regex for local phone numbers).
