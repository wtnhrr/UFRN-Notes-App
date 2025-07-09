const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const DB_FILE = './db.json';

function readDB() {
  const data = fs.readFileSync(DB_FILE);
  return JSON.parse(data);
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// get
app.get('/items', (req, res) => {
  const data = readDB();
  res.json(data);
});

// POST novo item
app.post('/items', (req, res) => {
  const data = readDB();
  const newItem = { id: uuidv4(), ...req.body };
  data.push(newItem);
  writeDB(data);
  res.status(201).json(newItem);
});

// PUT atualizar item
app.put('/items/:id', (req, res) => {
  const data = readDB();
  const updated = data.map(item =>
    item.id === req.params.id ? { ...item, ...req.body } : item
  );
  writeDB(updated);
  res.json({ success: true });
});

// DELETE item
app.delete('/items/:id', (req, res) => {
  const data = readDB();
  const filtered = data.filter(item => item.id !== req.params.id);
  writeDB(filtered);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
