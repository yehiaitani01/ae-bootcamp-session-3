import React, { useEffect, useState } from 'react';
import { Alert, CssBaseline, Container, AppBar, Toolbar, Typography, Box } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TaskList from './TaskList';
import TaskForm from './TaskForm';
import { saveTasks, validatePriority } from './taskStorage';
import './App.css';

async function requestTask(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Task request failed (${response.status})`);
  }
  return response.status === 204 ? null : response.json();
}

function taskRequest(method, task) {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  };
}

function App() {
  const [editingTask, setEditingTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [storageReady, setStorageReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    requestTask('/api/tasks').then(serverTasks => {
      if (!active) return;
      setTasks(serverTasks);
      setStorageReady(true);
      try {
        saveTasks(serverTasks);
      } catch (err) {
        setError(`Tasks loaded, but local cache failed: ${err.message}`);
      }
    }).catch(err => {
      if (active) setError(`Failed to load tasks: ${err.message}`);
    });
    return () => { active = false; };
  }, []);

  const persistTasks = (nextTasks) => {
    setTasks(nextTasks);
    setError(null);
    try {
      saveTasks(nextTasks);
    } catch (err) {
      setError(`Task saved to API, but local cache failed: ${err.message}`);
    }
  };

  const handleSave = async (task) => {
    const priority = task.priority === undefined ? 'P3' : task.priority;
    validatePriority(priority);
    if (editingTask) {
      const updatedTask = await requestTask(
        `/api/tasks/${editingTask.id}`, taskRequest('PUT', { ...task, priority })
      );
      persistTasks(tasks.map(existing => existing.id === editingTask.id
        ? updatedTask : existing));
      setEditingTask(null);
    } else {
      const newTask = await requestTask('/api/tasks', taskRequest('POST', { ...task, priority }));
      persistTasks([...tasks, newTask]);
    }
  };

  const handleUpdate = async (id, changes) => {
    try {
      const updatedTask = changes.priority !== undefined
        ? await requestTask(`/api/tasks/${id}/priority`, taskRequest('PUT', changes))
        : await requestTask(`/api/tasks/${id}`, taskRequest('PATCH', changes));
      persistTasks(tasks.map(task => task.id === id ? updatedTask : task));
      if (editingTask?.id === id) setEditingTask(updatedTask);
    } catch (err) {
      setError(`Failed to update task: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      await requestTask(`/api/tasks/${id}`, { method: 'DELETE' });
      persistTasks(tasks.filter(task => task.id !== id));
      if (editingTask?.id === id) setEditingTask(null);
    } catch (err) {
      setError(`Failed to delete task: ${err.message}`);
    }
  };

  return (
    <>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: '#f5f5f5',
          pb: 4
        }}
      >
        <AppBar
          position="static"
          sx={{
            background: '#1976d2',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
          }}
        >
          <Toolbar>
            <CheckCircleOutlineIcon sx={{ mr: 2, fontSize: 28 }} />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                letterSpacing: '0.5px'
              }}
            >
              TODO App
            </Typography>
          </Toolbar>
        </AppBar>
        <Container 
          maxWidth="md" 
          sx={{ 
            mt: 4,
            height: 'calc(100vh - 120px)', 
            display: 'flex', 
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ mb: 2, flexShrink: 0 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {storageReady && <TaskForm onSave={handleSave} initialTask={editingTask} />}
          </Box>
          <Box sx={{ flexGrow: 1, minHeight: 0, overflow: 'hidden' }}>
            {storageReady && (
              <TaskList
                tasks={tasks}
                onEdit={setEditingTask}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            )}
          </Box>
        </Container>
      </Box>
    </>
  );
}

export default App;
