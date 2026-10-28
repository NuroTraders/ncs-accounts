/**
 * NCS Accounts & POS - Modular Build Engine
 * Compiles /src into standalone, offline-ready root index.html
 * 
 * Usage:
 *   node scripts/build.js          # Single build
 *   node scripts/build.js --watch  # Watch mode
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const srcDir = path.join(root, 'src');
const templatePath = path.join(srcDir, 'template.html');
const cssPath = path.join(srcDir, 'styles', 'main.css');
const markupPath = path.join(srcDir, 'markup', 'app.html');
const jsDir = path.join(srcDir, 'js');
const outHtmlPath = path.join(root, 'index.html');

function build() {
  const start = Date.now();
  
  if (!fs.existsSync(templatePath)) throw new Error('Missing template: ' + templatePath);
  if (!fs.existsSync(cssPath)) throw new Error('Missing CSS: ' + cssPath);
  if (!fs.existsSync(markupPath)) throw new Error('Missing markup: ' + markupPath);
  if (!fs.existsSync(jsDir)) throw new Error('Missing JS dir: ' + jsDir);

  const template = fs.readFileSync(templatePath, 'utf8');
  const css = fs.readFileSync(cssPath, 'utf8');
  const markup = fs.readFileSync(markupPath, 'utf8');

  // Read and sort all JS modules (01-core.js, 02-calc.js, etc.)
  const jsFiles = fs.readdirSync(jsDir)
    .filter(f => f.endsWith('.js'))
    .sort();

  const scriptParts = jsFiles.map(f => {
    const code = fs.readFileSync(path.join(jsDir, f), 'utf8');
    return `/* --- Module: ${f} --- */\n` + code;
  });
  const fullScript = scriptParts.join('\n\n');

  // Syntax validation check
  try {
    new vm.Script(fullScript, { filename: 'compiled_bundle.js' });
  } catch (err) {
    console.error('❌ Build failed! JavaScript syntax error in modules:\n', err.message);
    process.exit(1);
  }

  // Assemble HTML
  let output = template
    .replace('/* @@STYLES@@ */', () => css)
    .replace('<!-- @@MARKUP@@ -->', () => markup)
    .replace('/* @@SCRIPTS@@ */', () => fullScript);

  fs.writeFileSync(outHtmlPath, output, 'utf8');
  const duration = Date.now() - start;
  const sizeKb = (Buffer.byteLength(output, 'utf8') / 1024).toFixed(1);

  console.log(`✅ Compiled ${jsFiles.length} JS modules into index.html (${sizeKb} KB) in ${duration}ms`);
}

// Watch mode support
if (process.argv.includes('--watch')) {
  console.log('👀 Watching src/ for changes...');
  build();
  let timer = null;
  fs.watch(srcDir, { recursive: true }, (eventType, filename) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      console.log(`\n🔄 Change detected in ${filename}, rebuilding...`);
      try {
        build();
      } catch (e) {
        console.error('Build error:', e.message);
      }
    }, 100);
  });
} else {
  build();
}
