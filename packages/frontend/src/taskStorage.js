import { PRIORITIES } from './PriorityControl';

export const TASKS_STORAGE_KEY = 'todo-tasks';

export function validatePriority(priority) {
  if (!PRIORITIES.includes(priority)) {
    throw new Error('Priority must be P1, P2, or P3');
  }
}

export function loadTasks() {
  const stored = localStorage.getItem(TASKS_STORAGE_KEY);
  if (stored === null) return [];
  const tasks = JSON.parse(stored);
  if (!Array.isArray(tasks)) throw new Error('Stored tasks must be an array');
  const ids = new Set();
  return tasks.map(task => {
    if (!task || !['string', 'number'].includes(typeof task.id) ||
        typeof task.title !== 'string' || !task.title.trim() ||
        ids.has(task.id)) {
      throw new Error('Stored task data is invalid');
    }
    ids.add(task.id);
    const priority = task.priority === undefined ? 'P3' : task.priority;
    validatePriority(priority);
    return { ...task, priority };
  });
}

export function saveTasks(tasks) {
  tasks.forEach(task => validatePriority(task.priority));
  localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}
