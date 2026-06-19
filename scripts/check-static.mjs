import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
console.log(`scripts: ${scripts.length}`);

scripts.forEach((script, index) => {
  try {
    new Function(script);
    console.log(`script ${index + 1}: syntax ok`);
  } catch (error) {
    console.error(`script ${index + 1}: syntax error`);
    console.error(error);
    process.exit(1);
  }
});

for (const file of ['data/knowledge.json', 'data/sources.json']) {
  JSON.parse(fs.readFileSync(file, 'utf8'));
  console.log(`${file}: json ok`);
}

console.log('static checks passed');
