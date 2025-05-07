const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const db = new sqlite3.Database('./db.sqlite', (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos', err);
  } else {
    console.log('Conectado a la base de datos SQLite');
  }
});

// Migración: agregar columnas si no existen
// Tabla de usuarios con teléfono y foto de perfil
// Si ya existe, solo añade las columnas si faltan
// (esto es seguro para SQLite)
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    email TEXT UNIQUE,
    password TEXT,
    telefono TEXT,
    fotoPerfil TEXT DEFAULT 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
    isAdmin INTEGER DEFAULT 0
  )`);
  db.run(`ALTER TABLE users ADD COLUMN telefono TEXT`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN fotoPerfil TEXT DEFAULT 'https://cdn-icons-png.flaticon.com/512/149/149071.png'`, () => {});
  db.run(`ALTER TABLE users ADD COLUMN isAdmin INTEGER DEFAULT 0`, () => {});
  db.run(`CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    fecha TEXT,
    servicio TEXT,
    userId INTEGER,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )`);
});

// Crear usuario admin si no existe
const adminEmail = 'admin@gmail.com';
const adminPass = 'admin';
db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, user) => {
  if (!user) {
    const hashedPassword = bcrypt.hashSync(adminPass, 10);
    db.run(
      'INSERT INTO users (username, email, password, telefono, isAdmin) VALUES (?, ?, ?, ?, 1)',
      ['Administrador', adminEmail, hashedPassword, '+59100000000']
    );
    console.log('Usuario administrador creado: admin@gmail.com / admin');
  }
});

// Registro
app.post('/api/register', (req, res) => {
  const { username, email, password, telefono } = req.body;
  if (!/^\+591\d{8}$/.test(telefono)) {
    return res.status(400).json({ error: 'El teléfono debe comenzar con +591 y tener 8 dígitos' });
  }
  const hashedPassword = bcrypt.hashSync(password, 10);
  const fotoPerfil = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
  db.run(
    'INSERT INTO users (username, email, password, telefono, fotoPerfil) VALUES (?, ?, ?, ?, ?)',
    [username, email, hashedPassword, telefono, fotoPerfil],
    function (err) {
      if (err) {
        return res.status(400).json({ error: 'Usuario o email ya existe' });
      }
      res.json({ success: true });
    }
  );
});

// Login por email
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  db.get(
    'SELECT * FROM users WHERE email = ?',
    [email],
    (err, user) => {
      if (err || !user) {
        return res.status(400).json({ error: 'Usuario no encontrado' });
      }
      const valid = bcrypt.compareSync(password, user.password);
      if (!valid) {
        return res.status(400).json({ error: 'Contraseña incorrecta' });
      }
      // Crea el token
      const token = jwt.sign({ id: user.id, username: user.username, email: user.email, isAdmin: user.isAdmin }, 'secreto', { expiresIn: '2h' });
      res.json({ token });
    }
  );
});

function auth(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  jwt.verify(token, 'secreto', (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
}

function adminOnly(req, res, next) {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'Solo el administrador puede acceder' });
  }
  next();
}

// Perfil del usuario
app.get('/api/profile', auth, (req, res) => {
  db.get('SELECT id, username, email, telefono, fotoPerfil, isAdmin FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err || !user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  });
});

// Actualizar foto de perfil
app.post('/api/profile/foto', auth, (req, res) => {
  const { fotoPerfil } = req.body;
  db.run('UPDATE users SET fotoPerfil = ? WHERE id = ?', [fotoPerfil, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: 'Error al actualizar la foto de perfil' });
    res.json({ success: true, fotoPerfil });
  });
});

// Guardar reserva (usuario logueado)
app.post('/api/reservas', auth, (req, res) => {
  const { nombre, fecha, servicio } = req.body;
  db.run(
    'INSERT INTO reservas (nombre, fecha, servicio, userId) VALUES (?, ?, ?, ?)',
    [nombre, fecha, servicio, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error al guardar la reserva' });
      res.json({ success: true });
    }
  );
});

// Ver reservas (solo admin)
app.get('/api/admin/reservas', auth, adminOnly, (req, res) => {
  db.all('SELECT r.*, u.username, u.email, u.telefono FROM reservas r LEFT JOIN users u ON r.userId = u.id ORDER BY r.createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al obtener reservas' });
    res.json(rows);
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
});

