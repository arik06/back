const express = require('express');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Crear conexión a la base de datos
// Permite configurar la ruta mediante la variable de entorno DATABASE_PATH (útil para Railway Volumes)
const databasePath = process.env.DATABASE_PATH || './database.sqlite';
let db;

try {
  db = new Database(databasePath);
  console.log(`Conectado a la base de datos SQLite en: ${databasePath}`);
  initDatabase();
} catch (err) {
  console.error('Error conectando a la base de datos:', err);
  process.exit(1);
}

// Inicializar la base de datos
function initDatabase() {
  try {
    // Tabla de usuarios
    db.exec(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de servicios
    db.exec(`CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      email TEXT NOT NULL,
      password TEXT NOT NULL,
      end_date TEXT NOT NULL,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

      // Función para mantener exactamente 6 servicios únicos
  function ensureUniqueServices() {
    const services = [
      {
        name: 'Prime Video',
        email: process.env.PRIME_EMAIL || 'tu-email-prime@gmail.com',
        password: process.env.PRIME_PASSWORD || 'tu-contraseña-prime',
        end_date: process.env.PRIME_END_DATE || '2024-12-31',
        image_url: '/img/prime.png'
      },
      {
        name: 'Disney+',
        email: process.env.DISNEY_EMAIL || 'tu-email-disney@gmail.com',
        password: process.env.DISNEY_PASSWORD || 'tu-contraseña-disney',
        end_date: process.env.DISNEY_END_DATE || '2024-12-31',
        image_url: '/img/disney.png'
      },
      {
        name: 'HBO Max',
        email: process.env.HBO_EMAIL || 'tu-email-hbo@gmail.com',
        password: process.env.HBO_PASSWORD || 'tu-contraseña-hbo',
        end_date: process.env.HBO_END_DATE || '2024-12-31',
        image_url: '/img/hbo.png'
      },
      {
        name: 'Paramount+',
        email: process.env.PARAMOUNT_EMAIL || 'tu-email-paramount@gmail.com',
        password: process.env.PARAMOUNT_PASSWORD || 'tu-contraseña-paramount',
        end_date: process.env.PARAMOUNT_END_DATE || '2024-12-31',
        image_url: '/img/paramount.png'
      },
      {
        name: 'Crunchyroll',
        email: process.env.CRUNCHYROLL_EMAIL || 'tu-email-crunchyroll@gmail.com',
        password: process.env.CRUNCHYROLL_PASSWORD || 'tu-contraseña-crunchyroll',
        end_date: process.env.CRUNCHYROLL_END_DATE || '2024-12-31',
        image_url: '/img/crunchyroll.png'
      },
      {
        name: 'Netflix',
        email: process.env.NETFLIX_EMAIL || 'tu-email-netflix@gmail.com',
        password: process.env.NETFLIX_PASSWORD || 'tu-contraseña-netflix',
        end_date: process.env.NETFLIX_END_DATE || '2024-12-31',
        image_url: '/img/netflix.png'
      }
    ];

      // 1. Eliminar TODOS los servicios existentes
      db.exec('DELETE FROM services');
      console.log('Servicios existentes eliminados: 6');
      
      // 2. Insertar los servicios uno por uno
      const insertService = db.prepare('INSERT INTO services (name, email, password, end_date, image_url) VALUES (?, ?, ?, ?, ?)');
      
      services.forEach(service => {
        insertService.run(service.name, service.email, service.password, service.end_date, service.image_url);
        console.log(`✅ Servicio insertado: ${service.name}`);
      });
      
      insertService.finalize();
      console.log(`🎯 Base de datos inicializada con ${services.length} servicios únicos`);
    }

    // Ejecutar la función de limpieza automática
    ensureUniqueServices();
    
    // Crear usuarios desde variables de entorno si existen
    createUsersFromEnv();
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
  }
}

// Función para crear usuarios desde variables de entorno
function createUsersFromEnv() {
  try {
    // Crear usuario paola si no existe
    const paolaUser = db.prepare('SELECT * FROM users WHERE username = ?').get('paola');
    if (!paolaUser) {
      const hashedPassword = bcrypt.hashSync('paola123', 10);
      const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
      stmt.run('paola', hashedPassword);
      stmt.finalize();
      console.log('✅ Usuario paola creado desde variables de entorno');
    }
    
    // Crear usuario arik si no existe
    const arikUser = db.prepare('SELECT * FROM users WHERE username = ?').get('arik');
    if (!arikUser) {
      const hashedPassword = bcrypt.hashSync('arik123', 10);
      const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
      stmt.run('arik', hashedPassword);
      stmt.finalize();
      console.log('✅ Usuario arik creado desde variables de entorno');
    }
    
    console.log('🎯 Usuarios de entorno verificados');
  } catch (error) {
    console.error('Error creando usuarios desde entorno:', error);
  }
}

// Middleware para verificar JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido' });
    }
    req.user = user;
    next();
  });
}

// Rutas
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        return res.status(500).json({ error: 'Error del servidor' });
      }

      if (!isMatch) {
        return res.status(401).json({ error: 'Contraseña incorrecta' });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, username: user.username });
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/api/services', authenticateToken, (req, res) => {
  try {
    // Usar DISTINCT para evitar duplicados por nombre
    const services = db.prepare('SELECT DISTINCT id, name, image_url, end_date FROM services ORDER BY name').all();
    res.json(services);
  } catch (error) {
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

app.get('/api/services/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  try {
    const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    res.json(service);
  } catch (error) {
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

// Ruta para crear usuarios
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
  }

  try {
    // Verificar si el usuario ya existe
    const existingUser = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    // Hash de la contraseña
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insertar nuevo usuario
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const result = stmt.run(username, hashedPassword);
    stmt.finalize();

    res.json({ 
      message: 'Usuario creado exitosamente',
      userId: result.lastInsertRowid,
      username: username
    });
  } catch (error) {
    console.error('Error creando usuario:', error);
    return res.status(500).json({ error: 'Error del servidor' });
  }
});

// Health check para Railway
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
 });



app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});