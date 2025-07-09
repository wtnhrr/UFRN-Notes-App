import {
  Box, IconButton, Typography, Menu, MenuItem,
  List, Tooltip, ListItemIcon
} from '@mui/material';
import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SidebarItem from './SidebarItem';
import { useDrop } from 'react-dnd';

export default function Sidebar({ items, setItems, onSelectNote, selectedNote }) {
  const [contextMenu, setContextMenu] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openFolders, setOpenFolders] = useState({});
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [selectedNoteContent, setSelectedNoteContent] = useState('');
  const ITEM_TYPE = 'ITEM';

  async function copyItemBackend(item, parentId = null) {
    const { id, children, ...rest } = item;

    const newItem = {
      ...rest,
      name: rest.name + ' (Cópia)',
      parentId: parentId,
    };

    const res = await fetch('http://localhost:5000/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newItem),
    });

    const createdItem = await res.json();

    if (item.type === 'folder' && item.children?.length) {
      for (const child of item.children) {
        await copyItemBackend(child, createdItem.id);
      }
    }

    return createdItem;
  }

  const handleCopy = async () => {
    if (!selectedItem) return;

    try {
      await copyItemBackend(selectedItem, selectedItem.parentId);

      const res = await fetch('http://localhost:5000/items');
      const flatItems = await res.json();

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
      handleCloseMenu();
    } catch (err) {
      console.error('Erro ao copiar item:', err);
    }
  };

  const handleSelectNote = (item) => {
    if (item.type === 'note') {
      setSelectedNoteId(item.id);
      setSelectedNoteContent(item.content || '');
      onSelectNote && onSelectNote(item);
    } else {
      setSelectedNoteId(null);
      setSelectedNoteContent('');
      onSelectNote && onSelectNote(null);
    }
  };

  const onRenameFinish = async (id, newName) => {
    const trimmed = newName.trim();

    if (!trimmed) {
      const remove = (arr) =>
        arr.filter(i => i.id !== id).map(i =>
          i.children ? { ...i, children: remove(i.children) } : i
        );
      setItems(prev => remove(prev));
      return;
    }

    const rename = (arr) =>
      arr.map(i => {
        if (i.id === id) {
          const { _editing, ...rest } = i;
          const updated = { ...rest, name: trimmed };

          fetch(`http://localhost:5000/items/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated)
          }).catch((err) => console.error('Erro ao renomear:', err));

          return updated;
        }
        if (i.children) return { ...i, children: rename(i.children) };
        return i;
      });

    setItems(prev => rename(prev));
  };

  const handleToggleFolder = (id) => {
    setOpenFolders(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleContextMenu = (event, item) => {
    event.preventDefault();
    setSelectedItem(item);
    setContextMenu({
      mouseX: event.clientX + 2,
      mouseY: event.clientY - 4,
    });
  };

  const handleCloseMenu = () => {
    setContextMenu(null);
    setSelectedItem(null);
  };

  const createItem = async (type, parentId = null) => {
    const newItem = {
      type,
      name: '',
      content: type === 'note' ? '' : undefined,
      _editing: true,
      ...(type === 'folder' ? { children: [] } : {}),
      parentId: parentId
    };

    try {
      const res = await fetch('http://localhost:5000/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      const createdItem = await res.json();

      if (parentId) {
        const insertItem = (arr) =>
          arr.map(item => {
            if (item.id === parentId && item.type === 'folder') {
              return { ...item, children: [...(item.children || []), createdItem] };
            } else if (item.children) {
              return { ...item, children: insertItem(item.children) };
            }
            return item;
          });
        setItems(prev => insertItem(prev));
      } else {
        setItems(prev => [...prev, createdItem]);
      }

    } catch (err) {
      console.error('Erro ao criar item:', err);
    }

    handleCloseMenu();
  };

  const handleDelete = async () => {
    if (!selectedItem) return;

    const flattenItems = (items) => {
      let flat = [];
      for (const item of items) {
        const { children, ...rest } = item;
        flat.push(rest);
        if (children) {
          flat = flat.concat(flattenItems(children));
        }
      }
      return flat;
    };

    const getAllDescendants = (itemsList, parentId) => {
      let descendants = [];
      const directChildren = itemsList.filter(item => item.parentId === parentId);
      for (const child of directChildren) {
        descendants.push(child.id);
        descendants = descendants.concat(getAllDescendants(itemsList, child.id));
      }
      return descendants;
    };

    const flatItems = flattenItems(items);
    const idsToDelete = [selectedItem.id, ...getAllDescendants(flatItems, selectedItem.id)];

    const removeFromState = (arr) =>
      arr.filter(item => !idsToDelete.includes(item.id)).map(item => ({
        ...item,
        children: item.children ? removeFromState(item.children) : undefined,
      }));

    try {
      await Promise.all(
        idsToDelete.map(id =>
          fetch(`http://localhost:5000/items/${id}`, { method: 'DELETE' })
            .then(res => {
              if (!res.ok) throw new Error(`Erro ao deletar item ${id}: ${res.statusText}`);
            })
        )
      );

      setItems(prev => removeFromState(prev));
      handleCloseMenu();
    } catch (err) {
      console.error('Erro ao deletar itens:', err);
    }
  };

  const handleRename = () => {
    if (!selectedItem) return;

    const rename = (arr) => arr.map(i => {
      if (i.id === selectedItem.id) return { ...i, _editing: true };
      if (i.children) return { ...i, children: rename(i.children) };
      return i;
    });

    setItems(prev => rename(prev));
    handleCloseMenu();
  };

  const moveItem = (dragId, dropFolderId) => {
    let draggedItem = null;

    const remove = (arr) => {
      return arr.filter(i => {
        if (i.id === dragId) {
          draggedItem = { ...i };
          delete draggedItem._editing;
          return false;
        }
        if (i.children) {
          i.children = remove(i.children);
        }
        return true;
      });
    };

    const insert = (arr) => {
      if (dropFolderId === null) {
        return [...arr, draggedItem];
      }
      return arr.map(i => {
        if (i.id === dropFolderId && i.type === 'folder') {
          return {
            ...i,
            children: [...(i.children || []), draggedItem],
          };
        }
        if (i.children) {
          return {
            ...i,
            children: insert(i.children),
          };
        }
        return i;
      });
    };

    setItems(prev => {
      const newTree = insert(remove([...prev]));

      const updateParentId = (items) =>
        items.map(item => {
          if (item.id === dragId) {
            return { ...item, parentId: dropFolderId };
          }
          if (item.children) {
            return { ...item, children: updateParentId(item.children) };
          }
          return item;
        });

      const updatedTree = updateParentId(newTree);

      const findItemById = (items, id) => {
        for (const item of items) {
          if (item.id === id) return item;
          if (item.children) {
            const found = findItemById(item.children, id);
            if (found) return found;
          }
        }
        return null;
      };

      const updateOnServer = async () => {
        try {
          const itemToUpdate = findItemById(updatedTree, dragId);
          await fetch(`http://localhost:5000/items/${dragId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(itemToUpdate),
          });
        } catch (err) {
          console.error('Erro ao atualizar parentId:', err);
        }
      };

      updateOnServer();

      return updatedTree;
    });
  };

  const renderItems = (arr, level = 0) =>
    arr.map(item => (
      <SidebarItem
        key={item.id}
        item={item}
        level={level}
        moveItem={moveItem}
        onContextMenu={handleContextMenu}
        toggleFolder={handleToggleFolder}
        openFolders={openFolders}
        renderChildren={renderItems}
        onRenameFinish={onRenameFinish}
        onSelect={handleSelectNote}
        isSelected={selectedNote?.id === item.id}
      />
    ));

  const [{ isOverRoot, canDropRoot }, dropRootRef] = useDrop({
    accept: ITEM_TYPE,
    drop: (dragged, monitor) => {
      if (monitor.isOver({ shallow: true })) {
        moveItem(dragged.id, null);
      }
    },
    collect: (monitor) => ({
      isOverRoot: monitor.isOver({ shallow: true }),
      canDropRoot: monitor.canDrop(),
    }),
  });

  return (
    <Box
      ref={dropRootRef}
      width={250}
      bgcolor="#141421"
      color="white"
      p={2}
      overflow="auto"
      borderRadius={5}
      sx={{ border: '1px solid #9c9c9c' }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" fontSize="1rem">Notas</Typography>
        <Box>
          <Tooltip title="Nova Nota">
            <IconButton size="small" onClick={() => createItem('note')}>
              <NoteAddIcon sx={{ color: 'white' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Nova Pasta">
            <IconButton size="small" onClick={() => createItem('folder')}>
              <CreateNewFolderIcon sx={{ color: 'white' }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {renderItems(items)}

      <Menu
        open={contextMenu !== null}
        onClose={handleCloseMenu}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
        PaperProps={{
          sx: {
            bgcolor: '#1e1e2e',
            color: 'white',
            borderRadius: 2,
            boxShadow: 3,
            minWidth: 180,
            '& .MuiMenuItem-root': {
              fontSize: '0.9rem',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.08)',
              },
            }
          }
        }}
      >
        <MenuItem onClick={() => createItem('note', selectedItem?.id)}>
          <ListItemIcon><NoteAddIcon fontSize="small" sx={{ color: 'white' }} /></ListItemIcon>
          Nova nota
        </MenuItem>
        <MenuItem onClick={() => createItem('folder', selectedItem?.id)}>
          <ListItemIcon><CreateNewFolderIcon fontSize="small" sx={{ color: 'white' }} /></ListItemIcon>
          Nova pasta
        </MenuItem>
        <MenuItem onClick={handleCopy}>
          <ListItemIcon><ContentCopyIcon fontSize="small" sx={{ color: 'white' }} /></ListItemIcon>
          Fazer uma cópia
        </MenuItem>
        <MenuItem onClick={handleRename}>
          <ListItemIcon><EditIcon fontSize="small" sx={{ color: 'white' }} /></ListItemIcon>
          Renomear
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon><DeleteIcon fontSize="small" sx={{ color: 'crimson' }} /></ListItemIcon>
          <span style={{ color: 'crimson' }}>Apagar</span>
        </MenuItem>
      </Menu>
    </Box>
  );
}