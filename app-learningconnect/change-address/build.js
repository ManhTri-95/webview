const fs = require('fs');
const path = require('path');

/**
 * Build script to inline CSS and JS into HTML files
 * Usage: node build.js <html-file-name>
 * Example: node build.js help-main.html
 */

function getDateSuffix() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

function buildHtmlFile(htmlFileName) {
  console.log(`\n🚀 Building ${htmlFileName}...`);
  
  // Read source HTML
  const sourcePath = path.join(__dirname, htmlFileName);
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ Source file not found: ${sourcePath}`);
    process.exit(1);
  }

  let html = fs.readFileSync(sourcePath, 'utf-8');
  
  // Process CSS files - improved regex to handle various attribute orders
  const cssRegex = /<link\s+[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/gs;
  html = html.replace(cssRegex, (match, href) => {
    // Skip external URLs (http, https, //)
    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
      console.warn(`⚠️  Skipping external CSS: ${href}`);
      return match;
    }
    
    const cssPath = path.join(__dirname, href);
    if (!fs.existsSync(cssPath)) {
      console.warn(`⚠️  CSS file not found: ${cssPath}`);
      return match;
    }
    const cssContent = fs.readFileSync(cssPath, 'utf-8');
    console.log(`✅ Inlined: ${href}`);
    return `<style>\n${cssContent}\n</style>`;
  });

  // Process JS files - improved regex to handle various attribute orders
  const scriptRegex = /<script[^>]*src="([^"]+)"[^>]*>\s*<\/script>/gs;
  html = html.replace(scriptRegex, (match, src) => {
    // Skip external URLs (http, https, //)
    if (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('//')) {
      console.warn(`⚠️  Skipping external JS: ${src}`);
      return match;
    }
    
    const scriptPath = path.join(__dirname, src);
    if (!fs.existsSync(scriptPath)) {
      console.warn(`⚠️  JS file not found: ${scriptPath}`);
      return match;
    }
    const scriptContent = fs.readFileSync(scriptPath, 'utf-8');
    console.log(`✅ Inlined: ${src}`);
    return `<script type="text/javascript">\n${scriptContent}\n</script>`;
  });

  // Generate output file name with date suffix
  const baseName = htmlFileName.replace(/\.html$/, '');
  const dateSuffix = getDateSuffix();
  const outputFileName = `${baseName}-build-${dateSuffix}.html`;
  const outputPath = path.join(__dirname, 'build', outputFileName);

  // Ensure build directory exists
  if (!fs.existsSync(path.join(__dirname, 'build'))) {
    fs.mkdirSync(path.join(__dirname, 'build'), { recursive: true });
  }

  // Write output file
  fs.writeFileSync(outputPath, html, 'utf-8');
  console.log(`✅ Build completed: build/${outputFileName}`);
  console.log(`📦 File size: ${(html.length / 1024).toFixed(2)} KB\n`);
}

// Get file name from command line argument
const arg = process.argv[2];
if (!arg) {
  console.error('\n❌ Please provide HTML file name');
  console.error('Usage: node build.js <html-file-name>');
  console.error('Example: node build.js help-main.html\n');
  process.exit(1);
}

buildHtmlFile(arg);
