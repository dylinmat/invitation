#!/usr/bin/env node
/**
 * Patch @radix-ui/react-slot to fix React.Children.only(null) bug
 * This fixes React error #143
 */
const fs = require('fs');
const path = require('path');

function findFiles(dir, pattern, callback) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      findFiles(fullPath, pattern, callback);
    } else if (pattern.test(fullPath)) {
      callback(fullPath);
    }
  }
}

function patchFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('React.Children.only(null)')) {
      content = content.replace(/React\.Children\.only\(null\)/g, 'null');
      fs.writeFileSync(filePath, content);
      console.log(`✓ Patched: ${filePath}`);
      return true;
    }
  } catch (err) {
    console.error(`✗ Failed to patch ${filePath}:`, err.message);
  }
  return false;
}

console.log('Patching @radix-ui/react-slot files...\n');

// Find and patch all react-slot files
let patchedCount = 0;
const nodeModulesPath = path.join(__dirname, 'node_modules');

if (fs.existsSync(nodeModulesPath)) {
  findFiles(nodeModulesPath, /@radix-ui\/react-slot\/dist\/index\.js$/, (filePath) => {
    if (patchFile(filePath)) {
      patchedCount++;
    }
  });
}

// Also check parent node_modules
const parentNodeModulesPath = path.join(__dirname, '..', '..', 'node_modules');
if (fs.existsSync(parentNodeModulesPath)) {
  findFiles(parentNodeModulesPath, /@radix-ui\/react-slot\/dist\/index\.js$/, (filePath) => {
    if (patchFile(filePath)) {
      patchedCount++;
    }
  });
}

console.log(`\n✓ Patched ${patchedCount} file(s)`);
process.exit(0);
