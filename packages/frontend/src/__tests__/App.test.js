import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { saveTasks, TASKS_STORAGE_KEY } from '../taskStorage';

let tasks;
const originalFetch = global.fetch;
const cachedTasks = () => JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY));
const priorityGroup = (title) => screen.getByRole('group', { name: `Priority for ${title}` });
const response = (status, body) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

beforeEach(() => {
  localStorage.clear();
  tasks = [{
    id: 1, title: 'Existing task', description: 'Description',
    due_date: '2026-10-20', priority: 'P3', completed: 0,
  }];
  global.fetch = jest.fn(async (url, options = {}) => {
    const body = options.body ? JSON.parse(options.body) : {};
    if (!options.method) return response(200, [...tasks]);
    if (options.method === 'POST') {
      const task = { ...body, id: 2, completed: 0 };
      tasks.push(task);
      return response(201, task);
    }
    if (options.method === 'DELETE') {
      tasks = tasks.filter(task => task.id !== 1);
      return response(204);
    }
    tasks = tasks.map(task => task.id === 1 ? { ...task, ...body } : task);
    return response(200, tasks[0]);
  });
});

afterEach(() => {
  jest.restoreAllMocks();
  global.fetch = originalFetch;
});

async function renderLoadedApp() {
  const view = render(<App />);
  await screen.findByText('Existing task');
  return view;
}

test('loads backend tasks and caches their priorities', async () => {
  await renderLoadedApp();
  expect(global.fetch).toHaveBeenCalledWith('/api/tasks', undefined);
  expect(cachedTasks()[0].priority).toBe('P3');
});

test('creates new tasks with default P3 and the backend-assigned ID', async () => {
  const user = userEvent.setup();
  await renderLoadedApp();
  await user.type(screen.getByTestId('title-input'), 'New task');
  await user.click(screen.getByTestId('submit-task'));
  await screen.findByText('New task');
  expect(global.fetch).toHaveBeenCalledWith('/api/tasks', expect.objectContaining({
    method: 'POST',
    body: expect.stringContaining('"priority":"P3"'),
  }));
  expect(cachedTasks()[1]).toMatchObject({ id: 2, title: 'New task', priority: 'P3' });
});

test.each(['P1', 'P2', 'P3'])('creates a task with selected priority %s', async priority => {
  const user = userEvent.setup();
  await renderLoadedApp();
  await user.type(screen.getByTestId('title-input'), 'Chosen priority');
  await user.click(within(screen.getByRole('group', { name: 'Task priority' }))
    .getByRole('button', { name: priority }));
  await user.click(screen.getByTestId('submit-task'));
  await screen.findByText('Chosen priority');
  expect(cachedTasks()[1].priority).toBe(priority);
});

test('updates priority using PUT, retains details, and keeps selection exclusive', async () => {
  const user = userEvent.setup();
  tasks[0].completed = 1;
  await renderLoadedApp();
  const p1 = within(priorityGroup('Existing task')).getByRole('button', { name: 'P1' });
  await user.click(p1);
  await waitFor(() => expect(p1).toHaveAttribute('aria-pressed', 'true'));
  expect(global.fetch).toHaveBeenCalledWith('/api/tasks/1/priority', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ priority: 'P1' }),
  });
  expect(within(priorityGroup('Existing task')).getByRole('button', { name: 'P3' }))
    .toHaveAttribute('aria-pressed', 'false');
  expect(cachedTasks()[0]).toMatchObject({
    title: 'Existing task', description: 'Description', completed: 1, priority: 'P1',
  });
  global.fetch.mockClear();
  await user.click(p1);
  expect(p1).toHaveAttribute('aria-pressed', 'true');
  expect(global.fetch).not.toHaveBeenCalled();
});

test('shows failed PUT and preserves previously confirmed priority', async () => {
  const user = userEvent.setup();
  await renderLoadedApp();
  global.fetch.mockResolvedValueOnce(response(400, { error: 'Invalid priority' }));
  await user.click(within(priorityGroup('Existing task')).getByRole('button', { name: 'P1' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Task request failed (400)');
  expect(cachedTasks()[0].priority).toBe('P3');
  expect(within(priorityGroup('Existing task')).getByRole('button', { name: 'P3' }))
    .toHaveAttribute('aria-pressed', 'true');
});

test('uses PUT when editing a task including its priority', async () => {
  const user = userEvent.setup();
  await renderLoadedApp();
  await user.click(screen.getByRole('button', { name: 'edit' }));
  await user.click(within(screen.getByRole('group', { name: 'Task priority' }))
    .getByRole('button', { name: 'P2' }));
  await user.click(screen.getByTestId('submit-task'));
  await waitFor(() => expect(cachedTasks()[0].priority).toBe('P2'));
  expect(global.fetch).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({
    method: 'PUT', body: expect.stringContaining('"priority":"P2"'),
  }));
});

test('preserves completion and deletion through the API', async () => {
  const user = userEvent.setup();
  await renderLoadedApp();
  await user.click(screen.getByRole('checkbox'));
  await waitFor(() => expect(cachedTasks()[0].completed).toBe(true));
  expect(global.fetch).toHaveBeenCalledWith('/api/tasks/1', expect.objectContaining({
    method: 'PATCH',
  }));
  await user.click(screen.getByRole('button', { name: 'delete' }));
  await screen.findByText('No tasks found.');
  expect(cachedTasks()).toEqual([]);
});

test('does not silently load stale local tasks when the API fails', async () => {
  global.fetch.mockResolvedValueOnce(response(500));
  render(<App />);
  expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load tasks');
  expect(screen.queryByTestId('submit-task')).not.toBeInTheDocument();
});

test('retains form input when task creation fails', async () => {
  const user = userEvent.setup();
  await renderLoadedApp();
  global.fetch.mockRejectedValueOnce(new Error('Network unavailable'));
  await user.type(screen.getByTestId('title-input'), 'Unsaved task');
  await user.click(screen.getByTestId('submit-task'));
  expect(await screen.findByRole('alert')).toHaveTextContent('Failed to save task');
  expect(screen.getByTestId('title-input')).toHaveValue('Unsaved task');
  expect(cachedTasks()).toHaveLength(1);
});

test('reports cache failure while displaying the confirmed backend update', async () => {
  const user = userEvent.setup();
  await renderLoadedApp();
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('Storage is full');
  });
  await user.click(within(priorityGroup('Existing task')).getByRole('button', { name: 'P1' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('local cache failed: Storage is full');
  expect(within(priorityGroup('Existing task')).getByRole('button', { name: 'P1' }))
    .toHaveAttribute('aria-pressed', 'true');
  expect(tasks[0].priority).toBe('P1');
});

test.each(['P4', '', null])('rejects invalid cached priority %s', priority => {
  expect(() => saveTasks([{ id: 1, title: 'Task', priority }]))
    .toThrow('Priority must be P1, P2, or P3');
});
