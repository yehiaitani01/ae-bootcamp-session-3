# Story: Add priority field with default P3

## Acceptance Criteria

- New tasks created without an explicit priority are stored with priority value "P3".
- Priority field supports only values "P1", "P2", "P3".

## Technical Requirements

- Extend in-memory task object shape in frontend state to include `priority`.
- Persist tasks through `/api/tasks` and cache the confirmed task collection,
  including `priority`, in browser localStorage under `todo-tasks`.
- Default new tasks without a priority to `P3` in both the form and API.
- Update row priorities with `PUT /api/tasks/:id/priority`; accept only P1/P2/P3
  and return the updated task without changing its other fields.
- Use exclusive P1/P2/P3 controls in the creation/edit form and on each task row.
- Define unselected `#7A7A7A` and selected `#07F2E6` in `App.css`.
- Preserve task editing, completion, deletion, and due-date display through the API.
- Surface API failures without changing the confirmed selection or clearing unsaved input.
- Report cache failures separately from successful API updates.

## UI Reference

![Priority controls: gray when unselected, blue when selected](priority-field-ui-sketch.png)

## Implementation Notes

The original story referenced `/api/items` returning `{id,name}`, but this repository
implements `/api/tasks` instead. The success criteria require API-backed priority updates. The API is now the source
of truth, with localStorage retained as a cache rather than an offline store.
Previously browser-only tasks are not automatically imported into the API.
Task details retain the current `due_date` field. The sketch's selection colors are
distinct from the deferred red/orange/gray priority badges in the PRD.
