const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    process.exit(1);
  } else {
    console.log('Conectado a la base de datos SQLite');
    createUser();
  }
});

function createUser() {
  rl.question('Ingresa el nombre de usuario: ', (username) => {
    rl.question('Ingresa la contraseña: ', async (password) => {
      try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              console.error('❌ Error: El usuario ya existe');
            } else {
              console.error('❌ Error al crear usuario:', err.message);
            }
          } else {
            console.log('✅ Usuario creado exitosamente');
            console.log(`   Usuario: ${username}`);
            console.log(`   ID: ${this.lastID}`);
          }
          
          rl.close();
          db.close();
        });
      } catch (error) {
        console.error('❌ Error al hashear la contraseña:', error);
        rl.close();
        db.close();
      }
    });
  });
}
