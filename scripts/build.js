import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');
const fs = require('fs');
const path = require('path');

// Ensure the database file exists in the correct location
function setupDatabase() {
  const dbPath = path.join(__dirname, '../backend/pharmacy.db');
  if (!fs.existsSync(dbPath)) {
    console.log('Initializing database...');
    execSync('node init_db.js', { cwd: path.join(__dirname, '../backend') });
  }
}

// Copy necessary files to dist
function copyFiles() {
  const filesToCopy = [
    { from: '../backend', to: '../dist/backend' },
    { from: '../electron', to: '../dist/electron' }
  ];

  filesToCopy.forEach(({ from, to }) => {
    const sourcePath = path.join(__dirname, from);
    const targetPath = path.join(__dirname, to);

    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }

    fs.readdirSync(sourcePath).forEach(file => {
      if (file !== 'node_modules' && file !== 'pharmacy.db') {
        const sourceFile = path.join(sourcePath, file);
        const targetFile = path.join(targetPath, file);
        fs.copyFileSync(sourceFile, targetFile);
      }
    });
  });
}

// Main build process
async function build() {
  try {
    console.log('Setting up database...');
    setupDatabase();

    console.log('Building frontend...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log('Copying files...');
    copyFiles();

    console.log('Building electron app...');
    execSync('electron-builder', { stdio: 'inherit' });

    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
