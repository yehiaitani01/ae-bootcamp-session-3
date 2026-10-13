import React from 'react';
import {
  List, ListItem, ListItemText, IconButton, Checkbox, Typography, Box, Paper, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import EventIcon from '@mui/icons-material/Event';
import PriorityControl from './PriorityControl';

function TaskList({ tasks, onEdit, onUpdate, onDelete }) {
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.due_date && b.due_date) return 1;
    if (a.due_date && !b.due_date) return -1;
    return (a.due_date || '').localeCompare(b.due_date || '') ||
      (a.created_at || '').localeCompare(b.created_at || '');
  });

  const formatDueDate = (dateString) => {
    if (!dateString) return null;
    // Parse as local date to avoid timezone offset issues
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        mt: 3, 
        p: 2, 
        width: '100%', 
        maxHeight: '60vh', 
        overflow: 'auto',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 3,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(0, 0, 0, 0.05)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(25, 118, 210, 0.5)',
          borderRadius: '4px',
          '&:hover': {
            background: 'rgba(25, 118, 210, 0.7)',
          }
        }
      }}
    >
      <Typography 
        variant="subtitle1" 
        sx={{ 
          fontWeight: 600,
          color: '#1976d2',
          mb: 1.5
        }}
      >
        Tasks
      </Typography>
      <List sx={{ p: 0 }}>
        {tasks.length === 0 && (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 4,
              color: '#9e9e9e' 
            }}
          >
            <Typography variant="body2">No tasks found.</Typography>
          </Box>
        )}
        {sortedTasks.map(task => (
          <ListItem 
            key={task.id} 
            sx={{ 
              flexWrap: 'wrap',
              gap: 1,
              py: 1,
              mb: 1,
              borderRadius: 2,
              background: task.completed 
                ? 'rgba(158, 158, 158, 0.08)' 
                : 'rgba(25, 118, 210, 0.05)',
              border: '1px solid',
              borderColor: task.completed 
                ? 'rgba(158, 158, 158, 0.15)' 
                : 'rgba(25, 118, 210, 0.15)',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                background: task.completed 
                  ? 'rgba(158, 158, 158, 0.12)' 
                  : 'rgba(25, 118, 210, 0.1)',
                transform: 'translateX(4px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              }
            }}
          >
            <Checkbox
              edge="start"
              checked={!!task.completed}
              onChange={() => onUpdate(task.id, { completed: !task.completed })}
              inputProps={{ 'aria-label': 'Mark task complete' }}
              size="small"
              sx={{
                color: '#1976d2',
                py: 0,
                '&.Mui-checked': {
                  color: '#1976d2',
                }
              }}
            />
            <ListItemText
              primary={
                <Typography 
                  variant="body2"
                  sx={{ 
                    textDecoration: task.completed ? 'line-through' : 'none', 
                    color: task.completed ? '#9e9e9e' : '#212121',
                    fontWeight: task.completed ? 400 : 600,
                    fontSize: '1rem'
                  }}
                >
                  {task.title}
                </Typography>
              }
              secondary={
                task.description && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: task.completed ? '#bdbdbd' : '#616161',
                      fontSize: '0.85rem',
                      mt: 0.25
                    }}
                  >
                    {task.description}
                  </Typography>
                )
              }
            />
            <Box 
              sx={{ 
                display: 'flex',
                flexWrap: 'wrap',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 1
              }}
            >
              <PriorityControl
                value={task.priority}
                onChange={priority => onUpdate(task.id, { priority })}
                label={`Priority for ${task.title}`}
              />
              {task.due_date && (
                <Chip
                  icon={<EventIcon sx={{ fontSize: 14 }} />}
                  label={formatDueDate(task.due_date)}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    background: 'linear-gradient(135deg, #ff9800 0%, #ff6f00 100%)',
                    color: 'white',
                    '& .MuiChip-icon': {
                      color: 'white'
                    }
                  }}
                />
              )}
              <Box 
                sx={{ 
                  display: 'flex', 
                  gap: 0.5,
                  opacity: 0.7,
                  transition: 'opacity 0.2s',
                  '&:hover': {
                    opacity: 1
                  }
                }}
              >
                <IconButton 
                  aria-label="edit" 
                  onClick={() => onEdit(task)}
                  size="small"
                  sx={{
                    color: '#1976d2',
                    '&:hover': {
                      background: 'rgba(25, 118, 210, 0.1)',
                    }
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton 
                  aria-label="delete" 
                  onClick={() => onDelete(task.id)}
                  size="small"
                  sx={{
                    color: '#f44336',
                    '&:hover': {
                      background: 'rgba(244, 67, 54, 0.1)',
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}

export default TaskList;
