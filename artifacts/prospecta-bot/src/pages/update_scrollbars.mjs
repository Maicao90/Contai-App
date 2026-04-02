import fs from 'fs';
import path from 'path';
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx')) results.push(file);
    }
  });
  return results;
}
const files = walk('artifacts/prospecta-bot/src/pages');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // replace where it starts a map
  content = content.replace(/<CardContent className="space-y-3">\s*\{[a-zA-Z0-9_?.]*\.map\(/g, match => {
      return match.replace('"space-y-3"', '"space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar"');
  });
  
  content = content.replace(/<CardContent className="space-y-4">\s*\{[a-zA-Z0-9_?.]*\.map\(/g, match => {
      return match.replace('"space-y-4"', '"space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar"');
  });
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log('Updated ' + file);
  }
});
