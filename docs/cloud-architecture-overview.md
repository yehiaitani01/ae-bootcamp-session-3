# Cloud Architecture Overview

## Current System Context

This monorepo contains a React frontend and an Express API backed by an in-memory SQLite store. These diagrams describe the current implementation, not a proposed cloud deployment or the PRD's future browser-local persistence.

```mermaid
flowchart LR
    user["User"]
    subgraph monorepo["TODO application monorepo"]
        frontend["React frontend<br/>Browser UI"]
        api["Express API<br/>Node.js server"]
        store[("In-memory SQLite<br/>better-sqlite3")]
    end
    user -->|"Create, edit, complete, and delete tasks"| frontend
    frontend -->|"HTTP requests to /api/tasks"| api
    api -->|"JSON responses"| frontend
    api -->|"SQL reads and writes"| store
    store -->|"Task records"| api
```

- **Frontend:** [App.js](../packages/frontend/src/App.js) coordinates saving and list refreshes; [TaskForm.js](../packages/frontend/src/TaskForm.js) collects task details; [TaskList.js](../packages/frontend/src/TaskList.js) fetches and displays tasks.
- **API:** [app.js](../packages/backend/src/app.js) implements task CRUD routes. [index.js](../packages/backend/src/index.js) starts the server on `PORT`, defaulting to `3030`.
- **Development routing:** The React development server proxies API requests to `http://localhost:3030`, as configured in [package.json](../packages/frontend/package.json).
- **Store:** SQLite runs inside the API process using `new Database(':memory:')`. Task data is lost when that process stops; there is no durable database or browser-local task storage in the current implementation.

## Creating a TODO

The following sequence shows a successful creation request. The title is required; description and due date are optional. The current API field name is `due_date`, and priority is not yet implemented.

```mermaid
sequenceDiagram
    actor User
    participant Form as React TaskForm
    participant App as React App
    participant API as Express API
    participant Store as In-memory SQLite
    participant List as React TaskList

    User->>Form: Enter task details and click Add Task
    Form->>Form: Validate non-empty title
    Form->>App: onSave(title, description, due_date)
    App->>API: POST /api/tasks with JSON task details
    API->>API: Validate required title
    API->>Store: INSERT task
    Store-->>API: New task ID
    API->>Store: SELECT task by new ID
    Store-->>API: Created task with completed = 0
    API-->>App: 201 Created with JSON task
    App->>App: Increment refreshKey
    App-->>Form: Save callback resolves
    Form->>Form: Clear form fields
    App->>List: Remount list with updated key
    List->>API: GET /api/tasks
    API->>Store: SELECT tasks ordered by due date, then creation time
    Store-->>API: Task records
    API-->>List: 200 OK with JSON task list
    List-->>User: Display list including the new TODO
```

For invalid titles, the form blocks submission and the API independently returns `400` if such a request reaches it. The diagram is deliberately limited to the successful path: the current save handler awaits the request but does not check its HTTP status or consume the returned task before refreshing the list.
