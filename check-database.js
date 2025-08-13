const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    process.exit(1);
  } else {
    console.log('Conectado a la base de datos SQLite');
    checkDatabase();
  }
});

function checkDatabase() {
  console.log('\n=== VERIFICACIÓN DE BASE DE DATOS ===\n');
  
  // Verificar usuarios
  db.all('SELECT id, username, created_at FROM users', (err, users) => {
    if (err) {
      console.error('Error al consultar usuarios:', err);
    } else {
      console.log(`📊 USUARIOS (${users.length}):`);
      users.forEach(user => {
        console.log(`   ID: ${user.id}, Usuario: ${user.username}, Creado: ${user.created_at}`);
      });
    }
    
    // Verificar servicios
    db.all('SELECT id, name, email, end_date, created_at FROM services ORDER BY name', (err, services) => {
      if (err) {
        console.error('Error al consultar servicios:', err);
      } else {
        console.log(`\n📊 SERVICIOS (${services.length}):`);
        
        // Agrupar por nombre para detectar duplicados
        const serviceGroups = {};
        services.forEach(service => {
          if (!serviceGroups[service.name]) {
            serviceGroups[service.name] = [];
          }
          serviceGroups[service.name].push(service);
        });
        
        Object.entries(serviceGroups).forEach(([name, serviceList]) => {
          console.log(`\n   🎬 ${name} (${serviceList.length} instancias):`);
          serviceList.forEach(service => {
            console.log(`      ID: ${service.id}, Email: ${service.email}, Expira: ${service.end_date}`);
          });
          
          if (serviceList.length > 1) {
            console.log(`      ⚠️  DUPLICADO DETECTADO: ${serviceList.length} instancias`);
          }
        });
        
        // Mostrar resumen de duplicados
        const duplicates = Object.values(serviceGroups).filter(group => group.length > 1);
        if (duplicates.length > 0) {
          console.log(`\n🚨 PROBLEMAS DETECTADOS:`);
          console.log(`   Servicios con duplicados: ${duplicates.length}`);
          const totalDuplicates = duplicates.reduce((sum, group) => sum + group.length - 1, 0);
          console.log(`   Total de entradas duplicadas: ${totalDuplicates}`);
          console.log(`\n💡 SOLUCIÓN: Usa el botón "Limpiar Duplicados" en la interfaz web`);
        } else {
          console.log(`\n✅ No se detectaron duplicados`);
        }
      }
      
      db.close();
    });
  });
}
