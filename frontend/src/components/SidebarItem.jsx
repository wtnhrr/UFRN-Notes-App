import {
  ListItem, ListItemIcon, ListItemText, Collapse, TextField
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import DescriptionIcon from '@mui/icons-material/Description';
import { useDrag, useDrop } from 'react-dnd';
import { useEffect, useRef, useState } from 'react';

const ITEM_TYPE = 'ITEM';

export default function SidebarItem({
  item,
  moveItem,
  level,
  onContextMenu,
  toggleFolder,
  openFolders,
  renderChildren,
  onRenameFinish,
  onSelect,
  isSelected
}) {
  const [, dragRef] = useDrag({ type: ITEM_TYPE, item: { id: item.id, type: item.type } });

  const [, dropRef] = useDrop({
    accept: ITEM_TYPE,
    drop: (dragged) => {
      if (dragged.id !== item.id && item.type === 'folder') {
        moveItem(dragged.id, item.id);
      }
    }
  });

  const ref = (el) => dragRef(dropRef(el));

  const [editing, setEditing] = useState(item._editing || false);
  const [name, setName] = useState(item.name);
  const inputRef = useRef();

  useEffect(() => {
    setEditing(item._editing || false);
  }, [item._editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleRename = () => {
    if (!name.trim()) return;
    setEditing(false);
    onRenameFinish(item.id, name);
  };

  return (
    <>
      <ListItem
        ref={ref}
        onContextMenu={(e) => onContextMenu(e, item)}
        onClick={() => {
          if (item.type === 'folder') {
            toggleFolder(item.id);
          } else if (item.type === 'note') {
            onSelect && onSelect(item);
          }
        }}
        sx={{
          pl: `${level * 10}px`,
          py: 0.2,
          color: 'white',
          borderRadius: '6px',
          bgcolor: isSelected ? 'rgba(255,255,255,0.12)' : 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.05)',
            cursor: 'pointer'
          }
        }}
      >
        {item.type === 'folder' && (
          <ListItemIcon sx={{ color: 'white', minWidth: 30 }}>
            {openFolders[item.id] ? <FolderOpenIcon /> : <FolderIcon />}
          </ListItemIcon>
        )}

        {editing ? (
          <TextField
            inputRef={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => onRenameFinish(item.id, name)}
            onKeyDown={(e) => e.key === 'Enter' && onRenameFinish(item.id, name)}
            variant="standard"
            size="small"
            sx={{ input: { color: 'white', fontSize: '0.9rem', padding: 0 } }}
          />
        ) : (
          <ListItemText
            primary={item.name}
            primaryTypographyProps={{ fontSize: '0.9rem' }}
          />
        )}
      </ListItem>

      {item.type === 'folder' && (
        <Collapse in={openFolders[item.id]} timeout="auto" unmountOnExit>
          {renderChildren(item.children, level + 2)}
        </Collapse>
      )}
    </>
  );
}