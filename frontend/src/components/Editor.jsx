import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField } from '@mui/material';

export default function Editor({ selectedNote, onChangeNote, items, onSelectNote }) {
  // edição do título
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(selectedNote?.name || '');
  
  // Referência input do título
  const inputRef = useRef();

  // busca
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // título quando a nota muda
  useEffect(() => {
    setTitle(selectedNote?.name || '');
  }, [selectedNote]);

  // input ao entrar em edição
  useEffect(() => {
    if (editingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingTitle]);

  // realizar a busca nas notas
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const flatNotes = [];

    // recursiva coletar todas as notas
    const flattenNotes = (arr) => {
      arr.forEach(item => {
        if (item.type === 'note') {
          flatNotes.push(item);
        } else if (item.children) {
          flattenNotes(item.children);
        }
      });
    };

    flattenNotes(items || []);

    // filtra notas
    const matches = flatNotes.filter(note =>
      (note.name?.toLowerCase().includes(query) ||
      note.content?.toLowerCase().includes(query))
    );

    // parte do conteúdo destacando o termo buscado
    const createSnippet = (content = '', term) => {
      const lowerContent = content.toLowerCase();
      const idx = lowerContent.indexOf(term);
      if (idx === -1) return '';

      const snippetRadius = 30;
      const start = Math.max(0, idx - snippetRadius);
      const end = Math.min(content.length, idx + term.length + snippetRadius);
      const snippet = content.substring(start, end);

      // Destaca o termo encontrado no snippet
      const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedTerm, 'ig');

      return snippet.replace(regex, (match) => `<mark style="background-color: #90caf9; color: black;">${match}</mark>`);
    };

    // resultados com html
    const resultsWithSnippet = matches.map(note => ({
      ...note,
      snippet: createSnippet(note.content, query)
    }));

    setSearchResults(resultsWithSnippet);

  }, [searchQuery, items]);

  // Salva título da nota no back
  const handleTitleBlur = async () => {
    setEditingTitle(false);
    const trimmed = title.trim();

    if (trimmed === selectedNote.name) return;

    const updatedNote = {
      ...selectedNote,
      name: trimmed || 'Sem título'
    };

    onChangeNote(updatedNote);

    try {
      await fetch(`http://localhost:5000/items/${updatedNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNote)
      });
    } catch (err) {
      console.error('Erro ao salvar título:', err);
    }
  };

  // Salva conteúdo da nota no back
  const handleContentChange = async (e) => {
    const updatedNote = {
      ...selectedNote,
      content: e.target.value
    };

    onChangeNote(updatedNote);

    try {
      await fetch(`http://localhost:5000/items/${updatedNote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedNote)
      });
    } catch (err) {
      console.error('Erro ao salvar conteúdo:', err);
    }
  };

  return (
    <Box
      flex={1}
      p={3}
      color="white"
      bgcolor="#0e0e1a"
      sx={{
        borderRadius: 4,
        border: '1px solid #9c9c9c',
        height: '94.5%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Barra de pesquisa no topo, centralizada */}
      <Box display="flex" justifyContent="center" mb={2}>
        <TextField
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Pesquisar notas..."
          variant="outlined"
          size="small"
          sx={{
            width: '60%',
            backgroundColor: '#1e1e2e',
            input: { color: 'white' },
            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#444' },
          }}
        />
      </Box>

      {/* Lista de resultados da pesquisa */}
      {searchResults.length > 0 && (
        <Box
          mb={2}
          px={2}
          py={1}
          bgcolor="#1e1e2e"
          borderRadius={2}
          maxHeight={200}
          overflow="auto"
          sx={{
            '&::-webkit-scrollbar': { width: '6px' },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#555',
              borderRadius: '4px',
            },
          }}
        >
          <Typography variant="subtitle2" color="gray" mb={1}>
            Resultados:
          </Typography>
          {searchResults.map((note) => (
            <Box
              key={note.id}
              onClick={() => {
                onSelectNote(note);
                setSearchQuery('');
              }}
              sx={{
                cursor: 'pointer',
                '&:hover': { color: '#90caf9' },
                py: 0.5,
              }}
            >
              <Typography fontWeight="bold" fontSize="0.9rem">
                {note.name || 'Sem título'}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontStyle: 'italic', fontSize: '0.8rem' }}
                dangerouslySetInnerHTML={{ __html: note.snippet }}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* nenhuma nota selecionada */}
      {!selectedNote ? (
        <Box flex={1} display="flex" justifyContent="center" alignItems="center">
          <Typography variant="h6" color="gray">
            Nenhuma nota selecionada.
          </Typography>
        </Box>
      ) : (
        <>
          {/* editar o título da nota */}
          {editingTitle ? (
            <TextField
              inputRef={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') inputRef.current.blur();
              }}
              variant="standard"
              sx={{
                input: {
                  color: 'white',
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  borderBottom: '1px solid #90caf9',
                },
                mb: 2,
              }}
              fullWidth
            />
          ) : (
            <>
              <Box mb={2}>
                <Typography
                  variant="h4"
                  color="white"
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setEditingTitle(true)}
                >
                  {selectedNote.name || 'Sem título'}
                </Typography>

                {/* Linha decorativa título */}
                <Box
                  height="1px"
                  width="100%"
                  mt={1}
                  sx={{
                    background: 'linear-gradient(to right, transparent, #666 50%, transparent)',
                  }}
                />
              </Box>

              {/* Campo de conteúdo com rolagem */}
              <Box
                flex={1}
                overflow="auto"
                sx={{
                  '&::-webkit-scrollbar': { width: '6px' },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#555',
                    borderRadius: '4px',
                  },
                }}
              >
                <TextField
                  fullWidth
                  multiline
                  placeholder="Digite aqui..."
                  variant="standard"
                  value={selectedNote.content || ''}
                  onChange={handleContentChange}
                  InputProps={{
                    disableUnderline: true,
                    style: {
                      color: 'white',
                    },
                  }}
                  sx={{
                    width: '100%',
                  }}
                />
              </Box>
            </>
          )}
        </>
      )}
    </Box>
  );
}