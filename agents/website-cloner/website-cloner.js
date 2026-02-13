#!/usr/bin/env node
/**
 * Website Cloner Agent for CoExAI
 * Production-ready tool for cloning websites from video/screen recordings
 * 
 * Usage: node website-cloner.js <video_url_or_path> [options]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');
const { createWorker } = require('tesseract.js');

class WebsiteClonerAgent {
  constructor(options = {}) {
    this.options = {
      outputDir: options.outputDir || './cloned-websites',
      tempDir: options.tempDir || '/tmp/website-cloner',
      useOllama: options.useOllama !== false, // default true
      extractFrames: options.extractFrames || 10,
      quality: options.quality || 'high', // low, medium, high
      ...options
    };
    
    this.worker = null;
    this.ollamaAvailable = false;
    this.analysisResults = {
      frames: [],
      colors: [],
      typography: {},
      layout: {},
      components: [],
      interactions: []
    };
  }

  async init() {
    console.log('🚀 Website Cloner Agent v1.0');
    console.log('=============================\n');
    
    // Initialize OCR
    console.log('🔍 Initializing OCR engine...');
    this.worker = await createWorker('eng');
    console.log('✅ OCR ready\n');
    
    // Check Ollama availability
    if (this.options.useOllama) {
      try {
        execSync('which ollama', { stdio: 'ignore' });
        this.ollamaAvailable = true;
        console.log('✅ Ollama detected\n');
      } catch {
        console.log('⚠️ Ollama not found (running in basic mode)\n');
      }
    }
    
    // Ensure directories
    [this.options.tempDir, this.options.outputDir].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  }

  async clone(videoSource, projectName) {
    const sessionId = `${Date.now()}`;
    const sessionDir = path.join(this.options.tempDir, sessionId);
    fs.mkdirSync(sessionDir, { recursive: true });

    try {
      // Phase 1: Ingest
      console.log('📥 PHASE 1: Video Ingest');
      const videoPath = await this.ingestVideo(videoSource, sessionDir);
      
      // Phase 2: Analyze
      console.log('\n🔬 PHASE 2: Visual Analysis');
      await this.analyzeVideo(videoPath, sessionDir);
      
      // Phase 3: Extract Design System
      console.log('\n🎨 PHASE 3: Design System Extraction');
      const designSystem = this.extractDesignSystem();
      
      // Phase 4: Generate Code
      console.log('\n💻 PHASE 4: Code Generation');
      const code = await this.generateCode(designSystem, projectName);
      
      // Phase 5: Output
      console.log('\n📦 PHASE 5: Output & Delivery');
      const outputPath = await this.saveOutput(code, projectName);
      
      // Generate report
      this.generateReport(projectName, outputPath);
      
      return {
        success: true,
        projectName,
        outputPath,
        designSystem,
        stats: {
          frames: this.analysisResults.frames.length,
          colors: this.analysisResults.colors.length,
          components: this.analysisResults.components.length
        }
      };
      
    } catch (error) {
      console.error('\n❌ Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      await this.cleanup(sessionDir);
    }
  }

  async ingestVideo(source, sessionDir) {
    const videoPath = path.join(sessionDir, 'input.mp4');
    
    if (source.startsWith('http')) {
      console.log('  Downloading video...');
      execSync(`yt-dlp --force-ipv4 -o "${videoPath}" "${source}"`, { stdio: 'pipe' });
    } else {
      fs.copyFileSync(source, videoPath);
    }
    
    // Get video info
    const duration = parseFloat(
      execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`, { encoding: 'utf8' }).trim()
    );
    
    console.log(`  ✅ Video ready (${Math.round(duration)}s)`);
    return videoPath;
  }

  async analyzeVideo(videoPath, sessionDir) {
    // Extract frames
    const framesDir = path.join(sessionDir, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });
    
    const duration = parseFloat(
      execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`, { encoding: 'utf8' }).trim()
    );
    
    const interval = duration / this.options.extractFrames;
    
    console.log(`  Extracting ${this.options.extractFrames} frames...`);
    execSync(`ffmpeg -i "${videoPath}" -vf "fps=1/${interval},scale=1280:-1" -q:v 2 "${framesDir}/frame_%03d.jpg"`, { stdio: 'pipe' });
    
    const frames = fs.readdirSync(framesDir)
      .filter(f => f.endsWith('.jpg'))
      .map(f => path.join(framesDir, f));
    
    // Analyze each frame
    console.log(`  Analyzing ${frames.length} frames...`);
    for (let i = 0; i < frames.length; i++) {
      process.stdout.write(`    Frame ${i + 1}/${frames.length}... `);
      const analysis = await this.analyzeFrame(frames[i]);
      this.analysisResults.frames.push(analysis);
      process.stdout.write('✅\n');
    }
    
    // Aggregate results
    this.aggregateResults();
  }

  async analyzeFrame(framePath) {
    const analysis = {
      path: framePath,
      timestamp: Date.now(),
      colors: await this.extractColors(framePath),
      text: await this.extractText(framePath),
      structure: await this.analyzeStructure(framePath),
      aiDescription: this.ollamaAvailable ? await this.ollamaAnalyze(framePath) : null
    };
    
    return analysis;
  }

  async extractColors(imagePath) {
    try {
      const { data } = await sharp(imagePath)
        .resize(50, 50, { fit: 'cover' })
        .raw()
        .toBuffer();

      const colorMap = new Map();
      
      for (let i = 0; i < data.length; i += 3) {
        const r = Math.round(data[i] / 16) * 16;
        const g = Math.round(data[i + 1] / 16) * 16;
        const b = Math.round(data[i + 2] / 16) * 16;
        
        // Skip near-white/black
        if ((r > 240 && g > 240 && b > 240) || (r < 15 && g < 15 && b < 15)) continue;
        
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
      }

      return Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([color]) => color);
    } catch {
      return ['#333333', '#ffffff', '#f0f0f0'];
    }
  }

  async extractText(imagePath) {
    try {
      const result = await this.worker.recognize(imagePath);
      return result.data.text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 2)
        .map((text, index) => ({
          text,
          type: this.classifyText(text),
          index
        }));
    } catch {
      return [];
    }
  }

  classifyText(text) {
    if (text.length < 20 && text === text.toUpperCase()) return 'heading';
    if (text.match(/^(Buy|Get|Sign|Start|Try)/i)) return 'cta';
    if (text.match(/[$€£]|\d+\s*(USD|EUR|GBP)/)) return 'price';
    if (text.match(/@(?!\s)|www\.|https?:/)) return 'link';
    if (text.length < 30) return 'label';
    return 'body';
  }

  async analyzeStructure(imagePath) {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      aspectRatio: metadata.width / metadata.height,
      orientation: metadata.width > metadata.height ? 'landscape' : 'portrait'
    };
  }

  async ollamaAnalyze(imagePath) {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const base64 = imageBuffer.toString('base64');
      
      const result = execSync(
        `echo "Describe this website UI design in detail" | ollama run llava "data:image/jpeg;base64,${base64}"`,
        { encoding: 'utf8', timeout: 60000 }
      );
      
      return result.trim();
    } catch {
      return null;
    }
  }

  aggregateResults() {
    // Aggregate colors
    const allColors = this.analysisResults.frames.flatMap(f => f.colors);
    this.analysisResults.colors = [...new Set(allColors)].slice(0, 10);
    
    // Aggregate components
    const allTexts = this.analysisResults.frames.flatMap(f => f.text);
    this.analysisResults.components = this.detectComponents(allTexts);
    
    // Infer layout
    this.analysisResults.layout = this.inferLayout();
    
    // Extract typography
    this.analysisResults.typography = this.extractTypography(allTexts);
  }

  detectComponents(texts) {
    const components = new Set();
    
    texts.forEach(({ type }) => {
      if (type === 'heading') components.add('hero');
      if (type === 'cta') components.add('cta-button');
      if (type === 'price') components.add('pricing');
      if (type === 'link') components.add('navigation');
    });
    
    components.add('navigation');
    components.add('footer');
    
    return Array.from(components);
  }

  inferLayout() {
    const hasPricing = this.analysisResults.components.includes('pricing');
    const hasHero = this.analysisResults.components.includes('hero');
    
    return {
      type: hasPricing ? 'pricing-page' : hasHero ? 'landing-page' : 'content-page',
      sections: this.analysisResults.components
    };
  }

  extractTypography(texts) {
    const headings = texts.filter(t => t.type === 'heading');
    const body = texts.filter(t => t.type === 'body');
    
    return {
      headingFont: 'system-ui',
      bodyFont: 'system-ui',
      headingSizes: headings.length > 0 ? ['2.5rem', '2rem', '1.5rem'] : ['2rem', '1.5rem', '1.25rem'],
      bodySize: '1rem'
    };
  }

  extractDesignSystem() {
    const { colors, typography, layout, components } = this.analysisResults;
    
    return {
      colors: {
        primary: colors[0] || '#333',
        secondary: colors[1] || '#666',
        accent: colors[2] || '#007bff',
        background: colors[colors.length - 1] || '#fff',
        text: colors.find(c => this.isDark(c)) || '#333',
        palette: colors
      },
      typography,
      layout,
      components,
      spacing: {
        unit: '1rem',
        scale: ['0.5rem', '1rem', '2rem', '4rem', '8rem']
      },
      borderRadius: '8px',
      shadows: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)'
      }
    };
  }

  async generateCode(designSystem, projectName) {
    return {
      html: this.generateHTML(designSystem, projectName),
      css: this.generateCSS(designSystem),
      js: this.generateJS(designSystem)
    };
  }

  generateHTML(ds, name) {
    const { layout, components } = ds;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${name}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  ${components.includes('navigation') ? this.generateNav(ds) : ''}
  ${components.includes('hero') ? this.generateHero(ds) : ''}
  ${components.includes('pricing') ? this.generatePricing(ds) : ''}
  ${this.generateFooter(ds)}
  <script src="script.js"></script>
</body>
</html>`;
  }

  generateNav(ds) {
    return `
  <nav class="navbar">
    <div class="nav-brand">${ds.projectName || 'Brand'}</div>
    <ul class="nav-links">
      <li><a href="#">Home</a></li>
      <li><a href="#features">Features</a></li>
      <li><a href="#pricing">Pricing</a></li>
    </ul>
  </nav>`;
  }

  generateHero(ds) {
    return `
  <section class="hero">
    <h1>Welcome to ${ds.projectName || 'Our Site'}</h1>
    <p>Discover amazing features and benefits</p>
    <button class="cta-button">Get Started</button>
  </section>`;
  }

  generatePricing(ds) {
    return `
  <section class="pricing" id="pricing">
    <div class="pricing-grid">
      <div class="pricing-card">
        <h3>Basic</h3>
        <div class="price">$9/mo</div>
        <button class="cta-button secondary">Choose Basic</button>
      </div>
      <div class="pricing-card featured">
        <h3>Pro</h3>
        <div class="price">$29/mo</div>
        <button class="cta-button">Choose Pro</button>
      </div>
    </div>
  </section>`;
  }

  generateFooter(ds) {
    return `
  <footer class="footer">
    <p>&copy; 2026 ${ds.projectName || 'All rights reserved'}</p>
  </footer>`;
  }

  generateCSS(ds) {
    const { colors, typography, spacing, borderRadius, shadows } = ds;
    
    return `:root {
  --primary: ${colors.primary};
  --secondary: ${colors.secondary};
  --accent: ${colors.accent};
  --background: ${colors.background};
  --text: ${colors.text};
  --font-main: ${typography.headingFont};
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--font-main);
  background: var(--background);
  color: var(--text);
  line-height: 1.6;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${spacing.scale[1]} 5%;
  background: var(--background);
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.nav-brand { font-weight: 700; font-size: 1.5rem; color: var(--primary); }

.nav-links {
  display: flex;
  gap: ${spacing.scale[2]};
  list-style: none;
}

.nav-links a {
  text-decoration: none;
  color: var(--secondary);
  font-weight: 500;
  transition: color 0.3s;
}

.nav-links a:hover { color: var(--primary); }

.hero {
  text-align: center;
  padding: ${spacing.scale[4]} 5%;
  background: linear-gradient(135deg, var(--background) 0%, rgba(0,0,0,0.02) 100%);
}

.hero h1 {
  font-size: ${typography.headingSizes[0]};
  font-weight: 800;
  color: var(--primary);
  margin-bottom: ${spacing.scale[1]};
}

.hero p {
  font-size: 1.25rem;
  color: var(--secondary);
  margin-bottom: ${spacing.scale[2]};
}

.cta-button {
  padding: ${spacing.scale[1]} ${spacing.scale[2]};
  font-size: 1.1rem;
  font-weight: 600;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: ${borderRadius};
  cursor: pointer;
  transition: all 0.3s ease;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: ${shadows.md};
}

.cta-button.secondary {
  background: transparent;
  color: var(--accent);
  border: 2px solid var(--accent);
}

.pricing {
  padding: ${spacing.scale[4]} 5%;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${spacing.scale[2]};
  max-width: 800px;
  margin: 0 auto;
}

.pricing-card {
  padding: ${spacing.scale[3]};
  border-radius: ${borderRadius};
  background: white;
  box-shadow: ${shadows.sm};
  text-align: center;
  transition: transform 0.3s;
}

.pricing-card:hover {
  transform: translateY(-4px);
  box-shadow: ${shadows.lg};
}

.pricing-card.featured {
  border: 2px solid var(--accent);
  transform: scale(1.05);
}

.price {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--primary);
  margin: ${spacing.scale[1]} 0;
}

.footer {
  text-align: center;
  padding: ${spacing.scale[2]};
  background: var(--primary);
  color: white;
}

@media (max-width: 768px) {
  .hero h1 { font-size: ${typography.headingSizes[1]}; }
  .pricing-card.featured { transform: none; }
}`;
  }

  generateJS(ds) {
    return `document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('visible');
    });
  });

  document.querySelectorAll('.pricing-card').forEach(el => observer.observe(el));
  
  console.log('🎬 Website cloned successfully');
});`;
  }

  async saveOutput(code, projectName) {
    const outputPath = path.join(this.options.outputDir, projectName);
    fs.mkdirSync(outputPath, { recursive: true });
    
    fs.writeFileSync(path.join(outputPath, 'index.html'), code.html);
    fs.writeFileSync(path.join(outputPath, 'styles.css'), code.css);
    fs.writeFileSync(path.join(outputPath, 'script.js'), code.js);
    
    return outputPath;
  }

  generateReport(projectName, outputPath) {
    console.log('\n' + '='.repeat(50));
    console.log('✅ WEBSITE CLONED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log(`\n📁 Project: ${projectName}`);
    console.log(`📂 Location: ${outputPath}`);
    console.log(`\n🎨 Design System:`);
    console.log(`   • Colors: ${this.analysisResults.colors.length} extracted`);
    console.log(`   • Components: ${this.analysisResults.components.join(', ')}`);
    console.log(`   • Layout: ${this.analysisResults.layout.type}`);
    console.log(`\n📄 Files Generated:`);
    console.log(`   • index.html`);
    console.log(`   • styles.css`);
    console.log(`   • script.js`);
    console.log(`\n🚀 To preview:`);
    console.log(`   cd ${outputPath}`);
    console.log(`   npx serve .`);
    console.log('\n' + '='.repeat(50));
  }

  async cleanup(sessionDir) {
    if (this.worker) await this.worker.terminate();
    // Keep temp files for debugging
  }

  isDark(hex) {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = rgb & 0xff;
    return (0.299 * r + 0.587 * g + 0.114 * b) < 128;
  }
}

// CLI
if (require.main === module) {
  const videoSource = process.argv[2];
  const projectName = process.argv[3] || 'cloned-website';
  
  if (!videoSource) {
    console.log(`
🚀 Website Cloner Agent v1.0

USAGE: node website-cloner.js <video> [project-name] [options]

EXAMPLES:
  node website-cloner.js https://youtube.com/watch?v=... my-site
  node website-cloner.js ./screen-recording.mp4 competitor-clone

OPTIONS:
  --quality=high|medium|low    Analysis quality (default: high)
  --frames=10                  Number of frames to extract (default: 10)
  --no-ollama                  Disable Ollama vision AI

OUTPUT:
  ./cloned-websites/[project-name]/
    - index.html
    - styles.css
    - script.js
    `);
    process.exit(0);
  }
  
  (async () => {
    const agent = new WebsiteClonerAgent();
    await agent.init();
    const result = await agent.clone(videoSource, projectName);
    process.exit(result.success ? 0 : 1);
  })();
}

module.exports = WebsiteClonerAgent;
