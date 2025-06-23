const fs = require('fs');
const dotenv = require('dotenv');
const path = require('path');

const env = dotenv.config().parsed;

if (!env) {
  console.error('❌ .env file not found or invalid');
  process.exit(1);
}

const firebase = {
  apiKey: env.NG_APP_FIREBASE_API_KEY,
  authDomain: env.NG_APP_FIREBASE_AUTH_DOMAIN,
  projectId: env.NG_APP_FIREBASE_PROJECT_ID,
  storageBucket: env.NG_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NG_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NG_APP_FIREBASE_APP_ID,
};


const writeEnvFile = (targetPath, isProd) => {
  const content = `export const environment = ${JSON.stringify({ production: isProd, firebase }, null, 2)};\n`;
  fs.writeFileSync(targetPath, content);
};

writeEnvFile(path.resolve(__dirname, 'src/environments/environment.ts'), false);
writeEnvFile(path.resolve(__dirname, 'src/environments/environment.prod.ts'), true);

console.log('✅ Environment files generated from .env');
