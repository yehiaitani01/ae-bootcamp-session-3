# Story: Add priority field with default P3

## Acceptance Criteria

- New tasks created without an explicit priority are stored with priority value "P3".
- Priority field supports only values "P1", "P2", "P3".

## Technical Requirements

- Extend in-memory task object shape in frontend state to include `priority`.
- Persist tasks, including `priority`, in browser localStorage under `todo-tasks`.
- Default new tasks and previously stored tasks without a priority to `P3`.
- Use exclusive P1/P2/P3 controls in the creation/edit form and on each task row.
- Unselected controls use `#7A7A7A`; the selected control uses `#07F2E6`.
- Preserve task editing, completion, deletion, and due-date display with local persistence.
- Surface storage failures without discarding form input or overwriting corrupt stored data.

## UI Reference

![Priority controls: gray when unselected, blue when selected](priority-field-ui-sketch.png)

## Implementation Notes

The original story referenced `/api/items` returning `{id,name}`, but this repository
implements `/api/tasks` instead. Task persistence has moved to browser localStorage
as requested; no API requests are made by the frontend and the backend is unchanged.
Task details retain the current `due_date` field. The sketch's selection colors are
distinct from the deferred red/orange/gray priority badges in the PRD.
