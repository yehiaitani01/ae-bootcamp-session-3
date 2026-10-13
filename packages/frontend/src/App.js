import React, { useEffect, useState } from 'react';
import { Alert, CssBaseline, Container, AppBar, Toolbar, Typography, Box } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import TaskList from './TaskList';
import TaskForm from './TaskForm';
import { loadTasks, saveTasks, validatePriority } from './taskStorage';

function App() {
  const [editingTask, setEditingTask] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [storageReady, setStorageReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const storedTasks = loadTasks();
      saveTasks(storedTasks);
      setTasks(storedTasks);
      setStorageReady(true);
    } catch (err) {
      setError(`Failed to load tasks: ${err.message}`);
    }
  }, []);

  const persistTasks = (nextTasks) => {
    saveTasks(nextTasks);
    setTasks(nextTasks);
    setError(null);
  };

  const handleSave = (task) => {
    const priority = task.priority === undefined ? 'P3' : task.priority;
    validatePriority(priority);
    if (editingTask) {
      persistTasks(tasks.map(existing => existing.id === editingTask.id
        ? { ...existing, ...task, priority } : existing));
      setEditingTask(null);
    } else {
      persistTasks([...tasks, {
        ...task,
        priority,
        id: crypto.randomUUID(),
        completed: false,
        created_at: new Date().toISOString(),
      }]);
    }
  };

  const handleUpdate = (id, changes) => {
    try {
      persistTasks(tasks.map(task => task.id === id ? { ...task, ...changes } : task));
      if (editingTask?.id === id) setEditingTask(task => ({ ...task, ...changes }));
    } catch (err) {
      setError(`Failed to update task: ${err.message}`);
    }
  };

  const handleDelete = (id) => {
    try {
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
