# Functional Requirements for TODO App

This summary is based on:

- `docs/artifacts/09162025-requirements-meeting.vtt`
- `docs/artifacts/09172025-slack-conversation-export.txt`

## MVP Requirements

1. Tasks support an optional `dueDate` field stored as ISO `YYYY-MM-DD`.
2. Invalid `dueDate` values are ignored and treated as absent.
3. Tasks support a `priority` field with allowed values `P1`, `P2`, and `P3`.
4. New tasks default to priority `P3` when no priority is provided.
5. Users can filter tasks by:
   - All
   - Today
   - Overdue
6. The All filter can include completed tasks; Today and Overdue filters show incomplete tasks only.
7. The app continues to use local storage only; no backend or external storage changes are included in the MVP.
8. Existing task basics remain in place, including required task titles and completion status.

## Post-MVP Requirements

1. Visually highlight overdue tasks so they stand out.
2. Display priority with color-coded badges:
   - `P1`: red
   - `P2`: orange
   - `P3`: gray
3. Sort tasks using the following order:
   - Overdue tasks first
   - Priority order from `P1` to `P3`
   - Due date ascending
   - Tasks without due dates last

## Out of Scope

The following items are not part of the current MVP or Post-MVP scope:

- Notifications
- Recurring tasks
- Multi-user support
- Keyboard navigation enhancements
- Backend changes or external storage
