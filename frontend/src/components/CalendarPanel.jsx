import React, { useState } from 'react';
import {
  Box, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, Button
} from '@mui/material';
import { LocalizationProvider, DateCalendar } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

export default function CalendarPanel({ createNote }) {
  // Estado para data selecionada no calendário
  const [value, setValue] = useState(dayjs());
  
  // controla se o diálogo está aberto
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // data clicada para criação de nota
  const [selectedDate, setSelectedDate] = useState(null);

  // diálogo de confirmação
  const handleDateClick = (newDate) => {
    setSelectedDate(newDate);
    setDialogOpen(true);
  };

  // Cria uma nova nota com a data selecionada como título
  const handleCreateNote = () => {
    const dateStr = selectedDate.format('DD/MM/YYYY');
    createNote && createNote(dateStr); // chama função passada via props
    setDialogOpen(false); // fecha o diálogo
  };

  return (
    <Box width={320} bgcolor="#141421" color="white" p={2} borderRadius={5} sx={{ border: '1px solid #9c9c9c'}}>
      {/* titulo mês/ano */}
      <Typography variant="h6" align="center" gutterBottom>
        {value.format('MMMM YYYY')}
      </Typography>

      {/* Calendário com suporte a clique de data */}
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <DateCalendar
          value={value}
          onChange={(newVal) => {
            setValue(newVal);
            handleDateClick(newVal);
          }}
          views={['day', 'month', 'year']}
          sx={{
            bgcolor: '#1e1e2e',
            borderRadius: '8px',
            '& .MuiPickersDay-root': {
              color: '#aaa',
              borderRadius: '4px',
            },
            '& .MuiPickersDay-root:hover': {
              backgroundColor: 'rgba(255,255,255,0.08)',
            },
            '& .MuiPickersDay-root.Mui-selected': {
              backgroundColor: '#90caf9',
              color: '#000',
            },
            '& .MuiDayCalendar-weekDayLabel': {
              color: '#888',
            },
            '& .MuiPickersCalendarHeader-label': {
              color: '#ccc',
              fontWeight: 'bold',
            }
          }}
        />
      </LocalizationProvider>

      {/* Diálogo de criação de nota */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        PaperProps={{
          sx: {
            bgcolor: '#1e1e2e',
            color: 'white',
            borderRadius: 2,
            px: 3,
            py: 2
          }
        }}
      >
        <DialogTitle>
          Criar nota para {selectedDate?.format('DD/MM/YYYY')}?
        </DialogTitle>
        <DialogContent>
          <Typography>Deseja criar uma nova nota com esta data como título?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'gray' }}>
            Esquecer
          </Button>
          <Button onClick={handleCreateNote} sx={{ color: '#90caf9' }}>
            Criar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
