# Product Requirements Document (PRD) - TODO App Upgrade

## 1. Overview

Upgrade the basic TODO app from title/completed-only tasks to a simple, teachable task-management experience. The MVP focuses on local-only due dates, priorities, and task filters. Post-MVP work captures enhancements that were requested but explicitly parked for a later phase.

---

## 2. MVP Scope

- Add an optional `dueDate` field for each task.
  - Store valid due dates as ISO `YYYY-MM-DD`.
  - Treat invalid due date values as absent.
- Add a `priority` field for each task.
  - Support only `P1`, `P2`, and `P3`.
  - Default new tasks to `P3` when no priority is provided.
- Add filters for task views:
  - `All`
  - `Today`
  - `Overdue`
- Keep task storage local.
  - Do not add backend changes.
  - Do not add external storage.
- Continue supporting the existing required task title.

---

## 3. Post-MVP Scope

- Visually highlight overdue tasks so they stand out.
- Add sorting using the agreed order:
  - overdue tasks first
  - then priority from `P1` to `P3`
  - then due date ascending
  - undated tasks last

---

## 4. Out of Scope

- Notifications.
- Recurring tasks.
- Multi-user support.
- Keyboard navigation or special accessibility enhancements.
- Backend changes.
- External storage.
