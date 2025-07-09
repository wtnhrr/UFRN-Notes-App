import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import CalendarPanel from '../components/CalendarPanel';
import Editor from '../components/Editor';
import { Box } from '@mui/material';

export default function Home() {
  const [selectedNote, setSelectedNote] = useState(null);
  const [items, setItems] = useState([]);
  const [version, setVersion] = useState(0);
  const [noteDates, setNoteDates] = useState([]);

  // Buscar os dados do backend ao carregar
  useEffect(() => {
    fetch('http://localhost:5000/items')
      .then((res) => res.json())
      .then((flatItems) => {
        const buildTree = (items, parentId = null) =>
          items
            .filter((item) => item.parentId === parentId && item.name?.trim() !== '')
            .map((item) => {
              const { _editing, ...rest } = item;
              return {
                ...rest,
                children: item.type === 'folder' ? buildTree(items, item.id) : undefined,
              };
            });

        const tree = buildTree(flatItems);
        setItems(tree);
      })
      .catch((err) => console.error('Erro ao carregar itens:', err));
  }, []);

  // Atualiza o conteúdo da nota dentro de items
  const updateNoteContent = (updatedNote) => {
    const update = (arr) =>
      arr.map((item) => {
        if (item.id === updatedNote.id) {
          return { ...item, name: updatedNote.name, content: updatedNote.content }; // importante!
        }
        if (item.children) {
          return { ...item, children: update(item.children) };
        }
        return item;
      });
    setItems((prev) => update(prev));
    console.log("Atualizando nota:", updatedNote);
  };

  const createNoteFromDate = async (title) => {
    const newNote = {
      type: 'note',
      name: title,
      content: '',
      parentId: null
    };

    try {
      const res = await fetch('http://localhost:5000/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newNote)
      });

      const createdNote = await res.json();
      setItems((prev) => [...prev, createdNote]);
      setSelectedNote(createdNote);
    } catch (err) {
      console.error('Erro ao criar nota por data:', err);
    }
  };




  return (
    <Box
      display="flex"
      height="98vh"
      bgcolor="#0e0e1a"
      borderRadius={4}
      overflow="hidden"
      sx={{
        gap: '30px',
        backgroundColor: 'transparent',
      }}
        >
      <Sidebar
        onSelectNote={setSelectedNote}
        items={items}
        setItems={setItems}
        selectedNote={selectedNote}
        version={version}
      />
      <Box
        sx={{
          flex: 1,
          minWidth: 0
        }}
      >
        <Editor
          selectedNote={selectedNote}
          onChangeNote={(note) => {
            setSelectedNote(note);
            updateNoteContent(note.id, note.content);
          }}
          items={items}
          onSelectNote={setSelectedNote}
        />
      </Box>

      <CalendarPanel createNote={createNoteFromDate} />
    </Box>
  );
}