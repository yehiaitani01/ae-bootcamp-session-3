import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { loadTasks, saveTasks, TASKS_STORAGE_KEY } from '../taskStorage';

const storedTasks = () => JSON.parse(localStorage.getItem(TASKS_STORAGE_KEY));
const seedTasks = (tasks) => localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
const priorityGroup = (title) => screen.getByRole('group', { name: `Priority for ${title}` });
const originalCrypto = Object.getOwnPropertyDescriptor(window, 'crypto');
const originalFetch = global.fetch;

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, 'crypto', {
    configurable: true,
    value: { randomUUID: jest.fn(() => 'new-task-id') },
  });
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
  if (originalCrypto) Object.defineProperty(window, 'crypto', originalCrypto);
  else delete window.crypto;
  global.fetch = originalFetch;
});

describe('TODO App with local priority persistence', () => {
  test('renders the UI and empty state without requesting the API', () => {
    render(<App />);
    expect(screen.getByText('TODO App')).toBeInTheDocument();
    expect(screen.getByText('No tasks found.')).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  test('creates a task with default P3 and retains it after remount', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<App />);
    await user.type(screen.getByTestId('title-input'), 'New task');
    await user.type(screen.getByTestId('description-input'), 'Description');
    await user.click(screen.getByTestId('submit-task'));
    expect(storedTasks()[0]).toMatchObject({
      title: 'New task', description: 'Description', priority: 'P3', completed: false,
    });
    expect(within(priorityGroup('New task')).getByRole('button', { name: 'P3' }))
      .toHaveAttribute('aria-pressed', 'true');
    unmount();
    render(<App />);
    expect(screen.getByText('New task')).toBeInTheDocument();
  });

  test.each(['P1', 'P2', 'P3'])('creates a task with explicitly selected %s', async priority => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByTestId('title-input'), 'Chosen priority');
    await user.click(within(screen.getByRole('group', { name: 'Task priority' }))
      .getByRole('button', { name: priority }));
    await user.click(screen.getByTestId('submit-task'));
    expect(storedTasks()[0].priority).toBe(priority);
    expect(within(screen.getByRole('group', { name: 'Task priority' }))
      .getByRole('button', { name: 'P3' })).toHaveAttribute('aria-pressed', 'true');
  });

  test('row buttons are exclusive, use sketch colors, and persist changes', async () => {
    seedTasks([{ id: 1, title: 'Existing task', priority: 'P3', completed: true }]);
    const user = userEvent.setup();
    render(<App />);
    const group = priorityGroup('Existing task');
    const p1 = within(group).getByRole('button', { name: 'P1' });
    const p3 = within(group).getByRole('button', { name: 'P3' });
    expect(p1).toHaveStyle({ backgroundColor: '#7A7A7A' });
    expect(p3).toHaveStyle({ backgroundColor: '#07F2E6' });
    await user.click(p1);
    expect(p1).toHaveAttribute('aria-pressed', 'true');
    expect(p1).toHaveStyle({ backgroundColor: '#07F2E6' });
    expect(p3).toHaveAttribute('aria-pressed', 'false');
    expect(p3).toHaveStyle({ backgroundColor: '#7A7A7A' });
    await user.click(p1);
    expect(p1).toHaveAttribute('aria-pressed', 'true');
    expect(storedTasks()[0]).toMatchObject({ priority: 'P1', completed: true });
  });

  test('edits details without losing priority or completion', async () => {
    seedTasks([{
      id: 1, title: 'Existing task', description: 'Description',
      due_date: '2026-10-20', priority: 'P2', completed: true,
    }]);
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'edit' }));
    expect(within(screen.getByRole('group', { name: 'Task priority' }))
      .getByRole('button', { name: 'P2' })).toHaveAttribute('aria-pressed', 'true');
    await user.clear(screen.getByTestId('title-input'));
    await user.type(screen.getByTestId('title-input'), 'Edited task');
    await user.click(screen.getByTestId('submit-task'));
    expect(storedTasks()[0]).toMatchObject({
      id: 1, title: 'Edited task', description: 'Description',
      due_date: '2026-10-20', priority: 'P2', completed: true,
    });
  });

  test('persists completion and deletion', async () => {
    seedTasks([{ id: 1, title: 'Task', priority: 'P1', completed: false }]);
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('checkbox'));
    expect(storedTasks()[0]).toMatchObject({ completed: true, priority: 'P1' });
    await user.click(screen.getByRole('button', { name: 'delete' }));
    expect(storedTasks()).toEqual([]);
    expect(screen.getByText('No tasks found.')).toBeInTheDocument();
  });

  test('normalizes legacy tasks without priority to P3', () => {
    seedTasks([{ id: 1, title: 'Legacy task', completed: 0 }]);
    render(<App />);
    expect(storedTasks()[0].priority).toBe('P3');
  });

  test('does not save a whitespace-only title', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByTestId('title-input'), '   ');
    await user.click(screen.getByTestId('submit-task'));
    expect(screen.getByRole('alert')).toHaveTextContent('Title is required');
    expect(storedTasks()).toEqual([]);
  });

  test('reports invalid stored priorities without overwriting stored data', () => {
    const tasks = [{ id: 1, title: 'Invalid task', priority: 'P4' }];
    seedTasks(tasks);
    render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent('Priority must be P1, P2, or P3');
    expect(storedTasks()).toEqual(tasks);
    expect(screen.queryByTestId('submit-task')).not.toBeInTheDocument();
  });

  test('reports corrupt local storage without replacing it', () => {
    localStorage.setItem(TASKS_STORAGE_KEY, 'not JSON');
    render(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load tasks');
    expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBe('not JSON');
  });

  test('reports failed saves and retains form values for retry', async () => {
    const user = userEvent.setup();
    render(<App />);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage is full');
    });
    await user.type(screen.getByTestId('title-input'), 'Unsaved task');
    await user.click(screen.getByTestId('submit-task'));
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to save task: Storage is full');
    expect(screen.getByTestId('title-input')).toHaveValue('Unsaved task');
    expect(storedTasks()).toEqual([]);
  });

  test('reports failed row updates and keeps the previously saved priority', async () => {
    seedTasks([{ id: 1, title: 'Task', priority: 'P3' }]);
    const user = userEvent.setup();
    render(<App />);
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage is unavailable');
    });
    await user.click(within(priorityGroup('Task')).getByRole('button', { name: 'P1' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Failed to update task');
    expect(storedTasks()[0].priority).toBe('P3');
    expect(within(priorityGroup('Task')).getByRole('button', { name: 'P3' }))
      .toHaveAttribute('aria-pressed', 'true');
  });

  test.each(['P4', '', null])('rejects invalid priority %s when persisting tasks', priority => {
    expect(() => saveTasks([{ id: 1, title: 'Task', priority }]))
      .toThrow('Priority must be P1, P2, or P3');
    expect(localStorage.getItem(TASKS_STORAGE_KEY)).toBeNull();
  });

  test('rejects malformed task collections', () => {
    localStorage.setItem(TASKS_STORAGE_KEY, '{}');
    expect(loadTasks).toThrow('Stored tasks must be an array');
    seedTasks([{ id: 1, title: 'Task' }, { id: 1, title: 'Duplicate' }]);
    expect(loadTasks).toThrow('Stored task data is invalid');
  });
});
