const { execSync } = require('child_process');

// Test different environment variable combinations
const testCases = [
  {},
  { NODE_ENV: 'production' },
  { NETLIFY: 'true' },
  { NODE_ENV: 'production', NETLIFY: 'true' },
];

testCases.forEach((envVars, index) => {
  console.log(`\nTest ${index + 1}: ${JSON.stringify(envVars)}`);
  
  const envString = Object.entries(envVars)
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');
  
  try {
    const result = execSync(`${envString} npx tsx -e "
      const config = require('./next.config.ts');
      console.log('Output:', config.default?.output);
      console.log('NODE_ENV:', process.env.NODE_ENV);
      console.log('NETLIFY:', process.env.NETLIFY);
    "`, { encoding: 'utf8', timeout: 10000 });
    
    console.log(result.trim());
  } catch (error) {
    console.log('Error:', error.message.split('\n')[0]);
  }
});