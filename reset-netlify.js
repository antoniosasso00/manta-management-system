const { execSync } = require('child_process');

// Imposta l'URL del database Netlify
process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_LuCzkr35cRiF@ep-ancient-sky-a9836wyd-pooler.gwc.azure.neon.tech/neondb?sslmode=require';

console.log('🔄 Reset del database Netlify in corso...');
console.log('Database:', process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@'));

try {
  // Reset del database
  execSync('npx prisma db push --force-reset --skip-generate', {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL
    }
  });
  
  console.log('✅ Database resettato con successo!');
  console.log('');
  console.log('Ora puoi eseguire il seed con:');
  console.log('DATABASE_URL="postgresql://..." npm run db:seed-complete');
  
} catch (error) {
  console.error('❌ Errore durante il reset:', error.message);
  process.exit(1);
}