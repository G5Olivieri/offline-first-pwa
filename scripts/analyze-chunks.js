#!/usr/bin/env node

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const distDir = 'dist/js';
const chunks = readdirSync(distDir)
  .filter(file => file.endsWith('.js'))
  .map(file => {
    const path = join(distDir, file);
    const size = readFileSync(path).length;
    return { file, size, path };
  })
  .sort((a, b) => b.size - a.size);

console.log('📊 Chunk Analysis Report\n');
console.log('Chunk File\t\t\t\tSize\t\tGzipped (est.)');
console.log('─'.repeat(80));

chunks.forEach(chunk => {
  const sizeKB = (chunk.size / 1024).toFixed(2);
  const gzipEstKB = (chunk.size / 3).toFixed(2); // Rough gzip estimate
  const fileName = chunk.file.padEnd(40);
  console.log(`${fileName}\t${sizeKB} KB\t\t~${gzipEstKB} KB`);
});

console.log('\n🎯 Optimization Suggestions:');
console.log('1. Chunks > 100KB should be split further');
console.log('2. Look for opportunities to lazy-load features');
console.log('3. Consider dynamic imports for large components');

const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
console.log(`\n📈 Total JS Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
