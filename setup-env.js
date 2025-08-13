const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 CONFIGURADOR DE VARIABLES DE ENTORNO');
console.log('========================================\n');

// Función para hacer pregunta
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Función para configurar variables de entorno
async function setupEnvironment() {
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');
  
  // Verificar si ya existe .env
  if (fs.existsSync(envPath)) {
    console.log('⚠️  El archivo .env ya existe.');
    const overwrite = await askQuestion('¿Quieres sobrescribirlo? (s/n): ');
    if (overwrite.toLowerCase() !== 's') {
      console.log('❌ Configuración cancelada.');
      rl.close();
      return;
    }
  }
  
  console.log('📧 Ingresa las credenciales para cada servicio:\n');
  
  let envContent = `# 🔐 CREDENCIALES DE SERVICIOS DE STREAMING
# ⚠️  IMPORTANTE: Reemplaza estos valores con tus credenciales reales
# 🔒  Este archivo contiene información sensible - NO lo subas a repositorios públicos

# JWT Secret (ya existía)
JWT_SECRET=tu-secreto-jwt-super-seguro

`;
  
  const services = [
    { key: 'PRIME', name: 'Prime Video' },
    { key: 'DISNEY', name: 'Disney+' },
    { key: 'HBO', name: 'HBO Max' },
    { key: 'PARAMOUNT', name: 'Paramount+' },
    { key: 'CRUNCHYROLL', name: 'Crunchyroll' },
    { key: 'NETFLIX', name: 'Netflix' }
  ];
  
  for (const service of services) {
    console.log(`\n🎬 ${service.name}:`);
    
    const email = await askQuestion(`   Email: `);
    const password = await askQuestion(`   Contraseña: `);
    const endDate = await askQuestion(`   Fecha de expiración (YYYY-MM-DD) [2024-12-31]: `) || '2024-12-31';
    
    envContent += `# 🎬 ${service.name}
${service.key}_EMAIL=${email}
${service.key}_PASSWORD=${password}
${service.key}_END_DATE=${endDate}

`;
  }
  
  // Guardar el archivo .env
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ ¡Archivo .env creado exitosamente!');
  console.log('\n📝 Para aplicar los cambios:');
  console.log('   1. El archivo .env ya está guardado');
  console.log('   2. Reinicia el servidor (npm run dev)');
  console.log('   3. Los servicios se actualizarán automáticamente');
  console.log('\n🔒 IMPORTANTE:');
  console.log('   - NO subas el archivo .env a repositorios públicos');
  console.log('   - Mantén este archivo seguro y privado');
  console.log('   - Las credenciales se mostrarán en la interfaz web');
  
  rl.close();
}

// Ejecutar el configurador
setupEnvironment().catch(console.error);
