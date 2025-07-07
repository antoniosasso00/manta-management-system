// Test script to debug Next.js config
const { execSync } = require('child_process');

console.log('Testing Next.js config with different environment variables...\n');

// Test different environment combinations
const testCases = [
  { NODE_ENV: 'development' },
  { NODE_ENV: 'production' },
  { NODE_ENV: 'production', NETLIFY: 'true' },
  { NETLIFY: 'true' },
];

testCases.forEach((env, index) => {
  console.log(`Test ${index + 1}: Environment variables:`, env);
  
  const envVars = Object.entries(env).map(([key, value]) => `${key}=${value}`).join(' ');
  
  try {
    const result = execSync(`${envVars} node -e "
      const config = require('./next.config.ts');
      console.log('output:', config.default?.output || 'undefined');
      console.log('NODE_ENV:', process.env.NODE_ENV);
      console.log('NETLIFY:', process.env.NETLIFY);
    "`, { encoding: 'utf8', timeout: 5000 });
    
    console.log('Result:', result);
  } catch (error) {
    console.log('Error:', error.message);
  }
  
  console.log('---\n');
});