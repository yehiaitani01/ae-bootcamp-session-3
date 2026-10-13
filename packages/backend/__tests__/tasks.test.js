const request = require('supertest');
const { app, db } = require('../src/app');

afterAll(() => {
  if (db) db.close();
});

describe('Tasks API', () => {
  let taskId;

  it('should create a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test Task', description: 'A test task', due_date: '2025-09-30' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Test Task');
    expect(res.body.description).toBe('A test task');
    expect(res.body.due_date).toBe('2025-09-30');
    expect(res.body.completed).toBe(0);
    expect(res.body.priority).toBe('P3');
    taskId = res.body.id;
  });

  describe('Task priorities', () => {
    let task;

    beforeEach(async () => {
      const res = await request(app).post('/api/tasks').send({
        title: 'Priority task', description: 'Keep details', due_date: '2026-10-20',
      });
      task = res.body;
    });

    afterEach(() => db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id));

    it.each(['P1', 'P2', 'P3'])('updates priority to %s without altering other fields', async priority => {
      const res = await request(app).put(`/api/tasks/${task.id}/priority`).send({ priority });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ...task, priority });
      const loaded = await request(app).get(`/api/tasks/${task.id}`);
      expect(loaded.body.priority).toBe(priority);
    });

    it.each(['P4', '', null, 1])('rejects invalid priority %s', async priority => {
      const res = await request(app).put(`/api/tasks/${task.id}/priority`).send({ priority });
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Priority must be P1, P2, or P3');
      expect(db.prepare('SELECT priority FROM tasks WHERE id = ?').get(task.id).priority).toBe('P3');
    });

    it('rejects a missing priority', async () => {
      const res = await request(app).put(`/api/tasks/${task.id}/priority`).send({});
      expect(res.status).toBe(400);
    });

    it('returns 404 for a missing task', async () => {
      const res = await request(app).put('/api/tasks/999999/priority').send({ priority: 'P1' });
      expect(res.status).toBe(404);
    });

    it('creates a task with explicit priority', async () => {
      const res = await request(app).post('/api/tasks').send({ title: 'High', priority: 'P1' });
      expect(res.status).toBe(201);
      expect(res.body.priority).toBe('P1');
      db.prepare('DELETE FROM tasks WHERE id = ?').run(res.body.id);
    });

    it('rejects invalid priority on create and full edit', async () => {
      const created = await request(app).post('/api/tasks').send({ title: 'Invalid', priority: 'P4' });
      expect(created.status).toBe(400);
      const updated = await request(app).put(`/api/tasks/${task.id}`)
        .send({ title: 'Invalid', priority: 'P4' });
      expect(updated.status).toBe(400);
    });

    it('updates priority through full edit and preserves it when omitted', async () => {
      const updated = await request(app).put(`/api/tasks/${task.id}`)
        .send({ title: task.title, priority: 'P2' });
      expect(updated.status).toBe(200);
      expect(updated.body.priority).toBe('P2');
      const edited = await request(app).put(`/api/tasks/${task.id}`).send({ title: 'Renamed' });
      expect(edited.status).toBe(200);
      expect(edited.body.priority).toBe('P2');
    });
  });

  it('should get all tasks', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should get a single task by id', async () => {
    const res = await request(app).get(`/api/tasks/${taskId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(taskId);
  });

  it('should update a task', async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ title: 'Updated Task', description: 'Updated', due_date: '2025-10-01' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated Task');
    expect(res.body.description).toBe('Updated');
    expect(res.body.due_date).toBe('2025-10-01');
  });

  it('should mark a task as completed', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${taskId}`)
      .send({ completed: true });
    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(1);
  });

  it('should delete a task', async () => {
    const res = await request(app).delete(`/api/tasks/${taskId}`);
    expect(res.status).toBe(204);
  });
});
