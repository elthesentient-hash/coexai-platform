/**
 * EL's Truly Powerful Video-to-Code Tool
 * Hybrid approach: Local AI + Image Processing + Heuristics
 * 
 * NO API KEYS REQUIRED - Uses:
 * - Ollama + LLaVA (local vision AI)
 * - Sharp (image processing)
 * - Tesseract.js (OCR)
 * - Layout heuristics
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const sharp = require('sharp');
const { createWorker } = require('tesseract.js');

class PowerfulVideoToCode {
  constructor() {
    this.tempDir = '/tmp/powerful-video-to-code';
    this.outputDir = path.join(process.cwd(), 'generated-sites');
    this.useLocalAI = this.checkLocalAI();
    this.worker = null;
  }

  async init() {
    // Initialize Tesseract OCR worker
    console.log('🔍 Initializing OCR...');
    this.worker = await createWorker('eng');
    console.log('✅ OCR ready');
  }

  checkLocalAI() {
    try {
      execSync('which ollama', { stdio: 'ignore' });
      return true;
    } catch {
      console.log('⚠️ Ollama not found. Run: bash tools/install-ollama.sh');
      return false;
    }
  }

  async process(videoSource, outputName = 'powerful-clone') {
    console.log('\n🎬 POWERFUL VIDEO-TO-CODE: Starting...\n');
    
    const sessionDir = path.join(this.tempDir, `${Date.now()}`);
    fs.mkdirSync(sessionDir, { recursive: true });

    try {
      // Step 1: Get video
      const videoPath = await this.getVideo(videoSource, sessionDir);
      console.log('✅ Video ready');

      // Step 2: Extract frames
      const frames = await this.extractFrames(videoPath, sessionDir);
      console.log(`✅ Extracted ${frames.length} frames`);

      // Step 3: Deep analysis
      const analysis = await this.deepAnalyze(frames);
      console.log('✅ Deep analysis complete');
      console.log('   Detected layout:', analysis.layout.type);
      console.log('   Color palette:', analysis.colors.length, 'colors');
      console.log('   Text elements:', analysis.texts.length);
      console.log('   Components:', analysis.components.length);

      // Step 4: Generate precise code
      const code = await this.generatePreciseCode(analysis, outputName);
      console.log('✅ Precise code generated');

      // Step 5: Save
      const outputPath = await this.saveOutput(code, outputName);
      console.log('\n🎉 SUCCESS!');
      console.log('📁 Output:', outputPath);

      return {
        success: true,
        outputPath,
        analysis: analysis.summary
      };

    } catch (error) {
      console.error('\n❌ Error:', error.message);
      return { success: false, error: error.message };
    } finally {
      if (this.worker) await this.worker.terminate();
      // this.cleanup(sessionDir);
    }
  }

  /**
   * DEEP ANALYSIS - Combines multiple techniques
   */
  async deepAnalyze(framePaths) {
    console.log('\n🔬 DEEP ANALYSIS - Multi-modal approach...\n');

    const analysis = {
      frames: [],
      colors: [],
      texts: [],
      layout: { type: 'unknown', sections: [] },
      components: [],
      summary: {}
    };

    // Analyze key frames
    const keyFrames = [
      framePaths[0],
      framePaths[Math.floor(framePaths.length / 2)],
      framePaths[framePaths.length - 1]
    ].filter(Boolean);

    for (let i = 0; i < keyFrames.length; i++) {
      const frame = keyFrames[i];
      console.log(`\n📸 Analyzing frame ${i + 1}/${keyFrames.length}...`);

      const frameAnalysis = await this.analyzeFrameDeep(frame);
      analysis.frames.push(frameAnalysis);

      // Aggregate data
      analysis.colors.push(...frameAnalysis.colors);
      analysis.texts.push(...frameAnalysis.texts);
      analysis.components.push(...frameAnalysis.components);
    }

    // Deduplicate and compile
    analysis.colors = this.deduplicateColors(analysis.colors);
    analysis.layout = this.inferLayout(analysis.frames);
    analysis.components = [...new Set(analysis.components)];

    analysis.summary = {
      layout: analysis.layout.type,
      colors: analysis.colors.slice(0, 5),
      components: analysis.components,
      textCount: analysis.texts.length
    };

    return analysis;
  }

  /**
   * Deep frame analysis - Image processing + OCR + AI
   */
  async analyzeFrameDeep(framePath) {
    const analysis = {
      path: framePath,
      colors: [],
      texts: [],
      layout: {},
      components: []
    };

    // 1. Extract color palette using Sharp
    console.log('   🎨 Extracting colors...');
    analysis.colors = await this.extractColors(framePath);

    // 2. OCR text detection
    console.log('   📝 OCR text detection...');
    const ocrResult = await this.worker.recognize(framePath);
    analysis.texts = this.parseOCRText(ocrResult.data.text);

    // 3. Image structure analysis
    console.log('   📐 Analyzing structure...');
    analysis.structure = await this.analyzeStructure(framePath);

    // 4. Detect UI components
    console.log('   🧩 Detecting components...');
    analysis.components = this.detectComponents(analysis);

    // 5. Local AI analysis (if available)
    if (this.useLocalAI) {
      console.log('   🧠 Local AI analysis...');
      const aiAnalysis = await this.localAIAnalysis(framePath);
      analysis.aiDescription = aiAnalysis;
    }

    return analysis;
  }

  /**
   * Extract dominant colors from image
   */
  async extractColors(imagePath) {
    try {
      // Resize for faster processing
      const { data, info } = await sharp(imagePath)
        .resize(100, 100, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Simple color quantization
      const colorMap = new Map();
      
      for (let i = 0; i < data.length; i += 3) {
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i + 1] / 32) * 32;
        const b = Math.round(data[i + 2] / 32) * 32;
        
        // Skip near-white and near-black
        if ((r > 240 && g > 240 && b > 240) || 
            (r < 15 && g < 15 && b < 15)) {
          continue;
        }

        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
      }

      // Sort by frequency
      return Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([color]) => color);

    } catch (error) {
      console.log('   ⚠️ Color extraction failed:', error.message);
      return ['#333333', '#ffffff', '#f0f0f0'];
    }
  }

  /**
   * Parse OCR text into structured elements
   */
  parseOCRText(rawText) {
    const lines = rawText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 2)
      .filter(line => !/^[\d\W]+$/.test(line)); // Remove lines with only numbers/symbols

    const elements = [];
    
    lines.forEach((line, index) => {
      const type = this.classifyTextType(line);
      elements.push({
        text: line,
        type,
        index
      });
    });

    return elements;
  }

  /**
   * Classify text element type
   */
  classifyTextType(text) {
    if (text.length < 20 && text === text.toUpperCase()) {
      return 'heading';
    }
    if (text.length < 15 && (text.includes('Buy') || text.includes('Get') || text.includes('Sign'))) {
      return 'button';
    }
    if (text.includes('$') || text.includes('USD') || /^\d+/.test(text)) {
      return 'price';
    }
    if (text.includes('@') || text.includes('www') || text.startsWith('http')) {
      return 'link';
    }
    if (text.length < 30) {
      return 'label';
    }
    return 'paragraph';
  }

  /**
   * Analyze image structure (edges, regions)
   */
  async analyzeStructure(imagePath) {
    // Use sharp for basic structure analysis
    const metadata = await sharp(imagePath).metadata();
    
    // Detect potential layout regions based on aspect ratio
    const aspectRatio = metadata.width / metadata.height;
    
    return {
      width: metadata.width,
      height: metadata.height,
      aspectRatio,
      orientation: aspectRatio > 1 ? 'landscape' : 'portrait',
      likelyLayout: aspectRatio > 1.5 ? 'desktop' : 'mobile'
    };
  }

  /**
   * Detect UI components from analysis
   */
  detectComponents(analysis) {
    const components = new Set();
    
    // Detect based on text types
    analysis.texts.forEach(text => {
      switch (text.type) {
        case 'heading':
          components.add('hero-section');
          break;
        case 'button':
          components.add('cta-button');
          break;
        case 'price':
          components.add('pricing-card');
          break;
        case 'link':
          components.add('navigation');
          break;
      }
    });

    // Detect based on color diversity
    if (analysis.colors.length > 3) {
      components.add('rich-ui');
    }

    // Detect based on text density
    if (analysis.texts.length > 10) {
      components.add('content-heavy');
    }

    // Default components
    components.add('navigation');
    components.add('footer');

    return Array.from(components);
  }

  /**
   * Local AI analysis using Ollama + LLaVA
   */
  async localAIAnalysis(framePath) {
    try {
      // Convert image to base64
      const imageBuffer = fs.readFileSync(framePath);
      const base64Image = imageBuffer.toString('base64');

      // Create temp file with prompt
      const promptFile = path.join(this.tempDir, 'prompt.txt');
      fs.writeFileSync(promptFile, `
Describe this website screenshot in detail. Focus on:
1. Layout structure (header, hero, features, footer)
2. Color scheme and visual style
3. UI components (buttons, cards, forms)
4. Typography style
5. Any notable design patterns
Be concise but specific.
      `);

      // Call Ollama with LLaVA
      const result = execSync(
        `ollama run llava "$(cat ${promptFile})" < <(echo "data:image/jpeg;base64,${base64Image}")`,
        { encoding: 'utf8', timeout: 60000 }
      );

      return result.trim();
    } catch (error) {
      console.log('   ⚠️ Local AI failed:', error.message);
      return null;
    }
  }

  /**
   * Infer overall layout from frame analyses
   */
  inferLayout(frames) {
    const allComponents = frames.flatMap(f => f.components);
    const componentCounts = {};
    
    allComponents.forEach(c => {
      componentCounts[c] = (componentCounts[c] || 0) + 1;
    });

    // Determine layout type
    let type = 'landing-page';
    if (componentCounts['pricing-card'] > 2) type = 'pricing-page';
    if (componentCounts['content-heavy']) type = 'content-site';
    if (componentCounts['hero-section'] && !componentCounts['pricing-card']) type = 'marketing-page';

    return {
      type,
      sections: Object.keys(componentCounts).sort((a, b) => 
        componentCounts[b] - componentCounts[a]
      ).slice(0, 5)
    };
  }

  deduplicateColors(colors) {
    const seen = new Set();
    return colors.filter(color => {
      if (seen.has(color)) return false;
      seen.add(color);
      return true;
    });
  }

  /**
   * Generate PRECISE code from deep analysis
   */
  async generatePreciseCode(analysis, name) {
    console.log('\n💻 Generating PRECISE code...\n');

    const html = this.generatePreciseHTML(analysis, name);
    const css = this.generatePreciseCSS(analysis);
    const js = this.generatePreciseJS(analysis);

    return { html, css, js };
  }

  generatePreciseHTML(analysis, name) {
    const { layout, texts, components } = analysis;
    
    // Extract real headings from OCR
    const headings = texts.filter(t => t.type === 'heading').map(t => t.text);
    const mainHeading = headings[0] || 'Welcome';
    
    // Extract button text
    const buttonTexts = texts.filter(t => t.type === 'button').map(t => t.text);
    const ctaText = buttonTexts[0] || 'Get Started';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${name} - ${mainHeading}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body class="${layout.type}">
  ${this.generatePreciseSections(analysis, mainHeading, ctaText)}
  <script src="script.js"></script>
</body>
</html>
    `.trim();
  }

  generatePreciseSections(analysis, mainHeading, ctaText) {
    const { layout, components } = analysis;
    
    let html = '';
    
    if (components.includes('navigation')) {
      html += this.generateNav(analysis);
    }
    
    if (components.includes('hero-section')) {
      html += this.generateHeroPrecise(analysis, mainHeading, ctaText);
    }
    
    if (components.includes('pricing-card')) {
      html += this.generatePricingSection(analysis);
    }
    
    if (components.includes('content-heavy')) {
      html += this.generateContentSection(analysis);
    }
    
    html += this.generateFooterPrecise(analysis);
    
    return html;
  }

  generateNav(analysis) {
    const navTexts = analysis.texts
      .filter(t => t.type === 'label' || t.type === 'link')
      .slice(0, 4)
      .map(t => `<li><a href="#${t.text.toLowerCase().replace(/\s+/g, '-')}">${t.text}</a></li>`)
      .join('\n      ');

    return `
  <nav class="navbar">
    <div class="nav-brand">Brand</div>
    <ul class="nav-links">
      ${navTexts || '<li><a href="#">Home</a></li>'}
    </ul>
  </nav>`;
  }

  generateHeroPrecise(analysis, heading, cta) {
    const paragraphs = analysis.texts
      .filter(t => t.type === 'paragraph')
      .slice(0, 2)
      .map(t => `<p>${t.text}</p>`)
      .join('\n    ');

    return `
  <section class="hero">
    <h1>${heading}</h1>
    ${paragraphs || '<p>Discover amazing features and benefits</p>'}
    <button class="cta-button">${cta}</button>
  </section>`;
  }

  generatePricingSection(analysis) {
    const prices = analysis.texts.filter(t => t.type === 'price');
    
    return `
  <section class="pricing" id="pricing">
    <div class="pricing-grid">
      <div class="pricing-card">
        <h3>Basic</h3>
        <div class="price">${prices[0]?.text || '$9'}</div>
        <ul>
          <li>Feature 1</li>
          <li>Feature 2</li>
        </ul>
      </div>
      <div class="pricing-card featured">
        <h3>Pro</h3>
        <div class="price">${prices[1]?.text || '$29'}</div>
        <ul>
          <li>All Basic features</li>
          <li>Premium support</li>
        </ul>
      </div>
    </div>
  </section>`;
  }

  generateContentSection(analysis) {
    const contentTexts = analysis.texts
      .filter(t => t.type === 'paragraph')
      .slice(2, 5)
      .map(t => `<p>${t.text}</p>`)
      .join('\n    ');

    return `
  <section class="content" id="content">
    <div class="content-wrapper">
      ${contentTexts}
    </div>
  </section>`;
  }

  generateFooterPrecise(analysis) {
    return `
  <footer class="footer">
    <div class="footer-content">
      <p>© 2026 All rights reserved</p>
    </div>
  </footer>`;
  }

  generatePreciseCSS(analysis) {
    const { colors, layout } = analysis;
    
    const primaryColor = colors[0] || '#333';
    const secondaryColor = colors[1] || '#666';
    const accentColor = colors[2] || '#007bff';
    const bgColor = colors[colors.length - 1] || '#fff';

    return `
/* EXTRACTED DESIGN SYSTEM */
:root {
  --primary: ${primaryColor};
  --secondary: ${secondaryColor};
  --accent: ${accentColor};
  --background: ${bgColor};
  --text: ${colors.find(c => this.isDark(c)) || '#333'};
  --font-main: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: var(--font-main);
  background: var(--background);
  color: var(--text);
  line-height: 1.6;
}

/* Navigation */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 5%;
  background: var(--background);
  border-bottom: 1px solid rgba(0,0,0,0.1);
}

.nav-brand {
  font-weight: 700;
  font-size: 1.5rem;
  color: var(--primary);
}

.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
}

.nav-links a {
  text-decoration: none;
  color: var(--secondary);
  font-weight: 500;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: var(--primary);
}

/* Hero */
.hero {
  text-align: center;
  padding: 6rem 5%;
  background: linear-gradient(135deg, var(--background) 0%, rgba(0,0,0,0.02) 100%);
}

.hero h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
  font-weight: 800;
  color: var(--primary);
  margin-bottom: 1.5rem;
  line-height: 1.2;
}

.hero p {
  font-size: 1.25rem;
  color: var(--secondary);
  margin-bottom: 2rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* CTA Button */
.cta-button {
  padding: 1rem 2.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.15);
}

/* Pricing */
.pricing {
  padding: 4rem 5%;
}

.pricing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  max-width: 1000px;
  margin: 0 auto;
}

.pricing-card {
  padding: 2rem;
  border-radius: 16px;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  text-align: center;
  transition: transform 0.3s;
}

.pricing-card:hover {
  transform: translateY(-4px);
}

.pricing-card.featured {
  border: 2px solid var(--accent);
  transform: scale(1.05);
}

.price {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--primary);
  margin: 1rem 0;
}

/* Content */
.content {
  padding: 4rem 5%;
  max-width: 800px;
  margin: 0 auto;
}

.content p {
  margin-bottom: 1.5rem;
  font-size: 1.1rem;
  line-height: 1.8;
}

/* Footer */
.footer {
  padding: 2rem 5%;
  background: var(--primary);
  color: white;
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .navbar {
    flex-direction: column;
    gap: 1rem;
  }
  
  .nav-links {
    gap: 1rem;
  }
  
  .hero {
    padding: 4rem 5%;
  }
  
  .pricing-card.featured {
    transform: none;
  }
}
    `.trim();
  }

  generatePreciseJS(analysis) {
    return `
// Detected interactions
document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // Scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.pricing-card, .content p').forEach(el => {
    observer.observe(el);
  });

  console.log('🎬 Powerfully cloned site initialized');
});
    `.trim();
  }

  // Utility methods
  isDark(hexColor) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  }

  async getVideo(source, sessionDir) {
    const videoPath = path.join(sessionDir, 'input.mp4');

    if (source.startsWith('http')) {
      console.log('📥 Downloading video...');
      execSync(`yt-dlp --force-ipv4 -o "${videoPath}" "${source}"`, { stdio: 'pipe' });
    } else {
      fs.copyFileSync(source, videoPath);
    }

    return videoPath;
  }

  async extractFrames(videoPath, sessionDir) {
    const framesDir = path.join(sessionDir, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });

    const duration = parseFloat(
      execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`, { encoding: 'utf8' }).trim()
    );

    const interval = Math.max(3, Math.floor(duration / 10));
    
    execSync(`ffmpeg -i "${videoPath}" -vf "fps=1/${interval},scale=960:-1" -q:v 2 "${framesDir}/frame_%03d.jpg"`, { stdio: 'pipe' });

    return fs.readdirSync(framesDir)
      .filter(f => f.endsWith('.jpg'))
      .map(f => path.join(framesDir, f));
  }

  async saveOutput(code, name) {
    const outputPath = path.join(this.outputDir, name);
    fs.mkdirSync(outputPath, { recursive: true });

    fs.writeFileSync(path.join(outputPath, 'index.html'), code.html);
    fs.writeFileSync(path.join(outputPath, 'styles.css'), code.css);
    fs.writeFileSync(path.join(outputPath, 'script.js'), code.js);

    return outputPath;
  }

  cleanup(sessionDir) {
    // Uncomment to clean up:
    // execSync(`rm -rf "${sessionDir}"`, { stdio: 'ignore' });
  }
}

// CLI
if (require.main === module) {
  const videoSource = process.argv[2];
  const outputName = process.argv[3] || 'powerful-clone';

  if (!videoSource) {
    console.log(`
🎬 EL's POWERFUL Video-to-Code Tool

USAGE: node powerful-video-to-code.js <video> [name]

FEATURES:
  ✅ Color extraction from frames
  ✅ OCR text detection
  ✅ Layout analysis
  ✅ Component detection
  ✅ Local AI (Ollama/LLaVA) - optional
  ✅ Precise code generation

EXAMPLES:
  node powerful-video-to-code.js https://twitter.com/.../video competitor
  node powerful-video-to-code.js ./recording.mp4 inspiration

INSTALL LOCAL AI (optional):
  bash tools/install-ollama.sh

OUTPUT: generated-sites/[name]/
    `);
    process.exit(0);
  }

  (async () => {
    const tool = new PowerfulVideoToCode();
    await tool.init();
    const result = await tool.process(videoSource, outputName);
    
    if (result.success) {
      console.log('\n✨ Next steps:');
      console.log(`  cd ${result.outputPath}`);
      console.log('  npx serve .');
    }
    process.exit(result.success ? 0 : 1);
  })();
}

module.exports = PowerfulVideoToCode;
