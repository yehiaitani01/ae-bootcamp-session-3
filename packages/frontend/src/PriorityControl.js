import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

export const PRIORITIES = ['P1', 'P2', 'P3'];

function PriorityControl({ value, onChange, label }) {
  return (
    <ToggleButtonGroup
      exclusive
      value={value}
      aria-label={label}
      size="small"
      onChange={(_, priority) => {
        if (priority !== null) onChange(priority);
      }}
    >
      {PRIORITIES.map(priority => (
        <ToggleButton
          key={priority}
          value={priority}
          aria-label={priority}
          sx={{
            backgroundColor: '#7A7A7A',
            color: '#fff',
            '&:hover': { backgroundColor: '#7A7A7A' },
            '&.Mui-selected': {
              backgroundColor: '#07F2E6',
              color: '#212121',
              '&:hover': { backgroundColor: '#07F2E6' },
            },
          }}
        >
          {priority}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

export default PriorityControl;
