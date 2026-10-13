# Product Requirements Document (PRD) - TODO App Upgrade

## 1. Overview

> Upgrade the basic TODO app so users can track deadlines and prioritize tasks using optional due dates, priority levels, and date-based filters. Keep the MVP simple and teachable, with task data stored locally and no backend changes.

---

## 2. MVP Scope

- Preserve the existing task title and completion state.
- Require a task `title`.
- Add an optional `dueDate` in ISO `YYYY-MM-DD` format. Ignore invalid due dates and treat them as absent.
- Add a `priority` value of `P1`, `P2`, or `P3`, defaulting to `P3`.
- Provide **All**, **Today**, and **Overdue** filters:
  - **All** displays tasks whether complete or incomplete.
  - **Today** displays incomplete tasks due on the current date.
  - **Overdue** displays incomplete tasks with a due date before the current date.
- Store tasks locally; do not add a backend or external storage.

---

## 3. Post-MVP Scope

- Visually highlight overdue tasks so they stand out.
- Sort tasks in this order:
  1. Overdue tasks first.
  2. Priority from `P1` to `P3`.
  3. Due date ascending.
  4. Tasks without a due date last.
- Show color-coded priority badges: red for `P1`, orange for `P2`, and gray for `P3`. This visual treatment was requested in the requirements meeting, but was not explicitly assigned a release phase in the scope-confirmation discussion; treat it as Post-MVP pending confirmation.

---

## 4. Out of Scope

- Notifications.
- Recurring tasks.
- Multi-user support.
- Keyboard navigation and special accessibility features.
- Backend changes or external storage; task data remains local.
