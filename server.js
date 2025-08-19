const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Crear conexión a la base de datos
// Permite configurar la ruta mediante la variable de entorno DATABASE_PATH (útil para Railway Volumes)
const databasePath = process.env.DATABASE_PATH || './database.sqlite';
const db = new sqlite3.Database(databasePath, (err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
  } else {
    console.log(`Conectado a la base de datos SQLite en: ${databasePath}`);
    initDatabase();
  }
});

// Inicializar la base de datos
function initDatabase() {
  db.serialize(() => {
    // Tabla de usuarios
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Tabla de servicios
    db.run(`CREATE TABLE IF NOT EXISTS services (
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
      db.run('DELETE FROM services', function(err) {
        if (err) {
          console.error('Error eliminando servicios:', err);
          return;
        }
        
        console.log(`Servicios existentes eliminados: ${this.changes}`);
        
        // 2. Insertar exactamente 5 servicios únicos
        const insertService = db.prepare('INSERT INTO services (name, email, password, end_date, image_url) VALUES (?, ?, ?, ?, ?)');
        
        let insertedCount = 0;
        services.forEach(service => {
          insertService.run(service.name, service.email, service.password, service.end_date, service.image_url, function(err) {
            if (err) {
              console.error(`Error insertando ${service.name}:`, err);
            } else {
              insertedCount++;
              console.log(`✅ Servicio insertado: ${service.name}`);
            }
            
            if (insertedCount === services.length) {
              insertService.finalize();
              console.log(`🎯 Base de datos inicializada con ${insertedCount} servicios únicos`);
            }
          });
        });
      });
    }

    // Ejecutar la función de limpieza automática
    ensureUniqueServices();
  });
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

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Error del servidor' });
    }

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
  });
});

app.get('/api/services', authenticateToken, (req, res) => {
  // Usar DISTINCT para evitar duplicados por nombre
  db.all('SELECT DISTINCT id, name, image_url, end_date FROM services ORDER BY name', (err, services) => {
    if (err) {
      return res.status(500).json({ error: 'Error del servidor' });
    }
    res.json(services);
  });
});

app.get('/api/services/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM services WHERE id = ?', [id], (err, service) => {
    if (err) {
      return res.status(500).json({ error: 'Error del servidor' });
    }
    
    if (!service) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    
    res.json(service);
  });
});

// Health check para Railway
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});



app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});