const readline = require('readline');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔐 ACTUALIZADOR DE CREDENCIALES DE SERVICIOS');
console.log('=============================================\n');

// Función para hacer pregunta
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Función para actualizar credenciales
async function updateCredentials() {
  const configPath = path.join(__dirname, 'config-services.js');
  
  // Leer el archivo actual
  let configContent = fs.readFileSync(configPath, 'utf8');
  
  const services = [
    'Prime Video',
    'Disney+',
    'HBO Max',
    'Paramount+',
    'Crunchyroll',
    'Netflix'
  ];
  
  console.log('📧 Ingresa las credenciales para cada servicio:\n');
  
  for (const service of services) {
    console.log(`\n🎬 ${service}:`);
    
    const email = await askQuestion(`   Email: `);
    const password = await askQuestion(`   Contraseña: `);
    
    // Actualizar el archivo de configuración
    const emailPattern = new RegExp(`email: 'tu-email-real-${service.toLowerCase().replace(/[^a-z]/g, '')}@gmail\\.com'`, 'i');
    const passwordPattern = new RegExp(`password: 'tu-contraseña-real-${service.toLowerCase().replace(/[^a-z]/g, '')}'`, 'i');
    
    configContent = configContent.replace(emailPattern, `email: '${email}'`);
    configContent = configContent.replace(passwordPattern, `password: '${password}'`);
  }
  
  // Guardar el archivo actualizado
  fs.writeFileSync(configPath, configContent);
  
  console.log('\n✅ ¡Credenciales actualizadas exitosamente!');
  console.log('\n📝 Para aplicar los cambios:');
  console.log('   1. Guarda el archivo config-services.js');
  console.log('   2. Reinicia el servidor (npm run dev)');
  console.log('   3. Los servicios se actualizarán automáticamente');
  
  rl.close();
}

// Ejecutar el actualizador
updateCredentials().catch(console.error);
