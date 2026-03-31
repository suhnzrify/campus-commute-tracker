const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) { 
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  if (file.includes('api.ts')) return;
  let text = fs.readFileSync(file, 'utf8');
  if (text.includes('localhost:4000/api')) {
    // Add import if not present
    if (!text.includes('import { API_URL }')) {
      const match = text.match(/import\s+(?:(?!\n\n).)*\n/s); // Just append after imports
      if (match) {
        text = text.replace(match[0], match[0] + `import { API_URL } from '@/lib/api';\n`);
      } else {
        text = `import { API_URL } from '@/lib/api';\n` + text;
      }
    }
    
    // Replace all occurrences: '/api/route' -> `${API_URL}/route`
    text = text.replace(/['"`]http:\/\/localhost:4000\/api([^'"`]*)['"`]/g, '`${API_URL}$1`');

    fs.writeFileSync(file, text, 'utf8');
    console.log('Updated', file);
  }
});
