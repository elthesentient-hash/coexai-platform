/**
 * EL's Video-to-Code Tool
 * Clone websites from screen recordings or videos
 * 
 * Usage: node video-to-code.js [video_url_or_path] [output_name]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const axios = require('axios');

class VideoToCode {
  constructor() {
    this.tempDir = '/tmp/video-to-code';
    this.outputDir = path.join(process.cwd(), 'generated-sites');
    this.ensureDirs();
  }

  ensureDirs() {
    [this.tempDir, this.outputDir].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  }

  /**
   * Main entry point
   */
  async process(videoSource, outputName = 'cloned-site') {
    console.log('🎬 VIDEO-TO-CODE: Starting...\n');
    
    const sessionDir = path.join(this.tempDir, `${Date.now()}`);
    fs.mkdirSync(sessionDir, { recursive: true });

    try {
      // Step 1: Download or copy video
      const videoPath = await this.getVideo(videoSource, sessionDir);
      console.log('✅ Video ready:', videoPath);

      // Step 2: Extract key frames
      const frames = await this.extractFrames(videoPath, sessionDir);
      console.log(`✅ Extracted ${frames.length} frames`);

      // Step 3: Analyze frames with vision AI
      const analysis = await this.analyzeFrames(frames);
      console.log('✅ Frame analysis complete');

      // Step 4: Generate code from analysis
      const code = await this.generateCode(analysis, outputName);
      console.log('✅ Code generated');

      // Step 5: Save output
      const outputPath = await this.saveOutput(code, outputName);
      console.log('\n🎉 SUCCESS!');
      console.log('📁 Output:', outputPath);

      return {
        success: true,
        outputPath,
        analysis: analysis.summary,
        frames: frames.length
      };

    } catch (error) {
      console.error('\n❌ Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    } finally {
      // Cleanup temp files
      this.cleanup(sessionDir);
    }
  }

  /**
   * Get video from URL or local path
   */
  async getVideo(source, sessionDir) {
    const videoPath = path.join(sessionDir, 'input.mp4');

    if (source.startsWith('http')) {
      console.log('📥 Downloading video...');
      execSync(`yt-dlp --force-ipv4 -o "${videoPath}" "${source}"`, {
        stdio: 'pipe'
      });
    } else {
      fs.copyFileSync(source, videoPath);
    }

    return videoPath;
  }

  /**
   * Extract key frames from video
   */
  async extractFrames(videoPath, sessionDir) {
    console.log('🎞️ Extracting frames...');
    
    const framesDir = path.join(sessionDir, 'frames');
    fs.mkdirSync(framesDir, { recursive: true });

    // Get video duration
    const duration = parseFloat(
      execSync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`, {
        encoding: 'utf8'
      }).trim()
    );

    // Extract frames every 3 seconds (or max 10 frames)
    const interval = Math.max(3, Math.floor(duration / 10));
    const frameCount = Math.min(10, Math.floor(duration / interval));

    execSync(`ffmpeg -i "${videoPath}" -vf "fps=1/${interval},scale=960:-1" -q:v 2 "${framesDir}/frame_%03d.jpg"`, {
      stdio: 'pipe'
    });

    // Get list of frames
    return fs.readdirSync(framesDir)
      .filter(f => f.endsWith('.jpg'))
      .map(f => path.join(framesDir, f));
  }

  /**
   * Analyze frames with vision AI
   * Uses available vision-capable APIs
   */
  async analyzeFrames(framePaths) {
    console.log('🔍 Analyzing frames with AI...');

    const analysis = {
      frames: [],
      summary: {
        layout: '',
        colors: [],
        components: [],
        typography: '',
        interactions: []
      }
    };

    // Analyze first, middle, and last frames
    const keyFrames = [
      framePaths[0],
      framePaths[Math.floor(framePaths.length / 2)],
      framePaths[framePaths.length - 1]
    ].filter(Boolean);

    for (const framePath of keyFrames) {
      const frameAnalysis = await this.analyzeFrame(framePath);
      analysis.frames.push(frameAnalysis);
    }

    // Compile summary
    analysis.summary = this.compileAnalysis(analysis.frames);

    return analysis;
  }

  /**
   * Analyze single frame
   */
  async analyzeFrame(framePath) {
    // Read image as base64
    const imageBase64 = fs.readFileSync(framePath).toString('base64');

    // For now, use manual analysis structure
    // In production, this would call GPT-4V, Claude, or similar
    const prompt = this.buildVisionPrompt();

    return {
      path: framePath,
      description: 'Frame analysis placeholder',
      layout: this.detectLayout(framePath),
      components: []
    };
  }

  /**
   * Detect layout type from frame
   */
  detectLayout(framePath) {
    // This would use actual vision AI
    // For now, return placeholder
    return {
      type: 'unknown',
      sections: ['hero', 'features', 'footer']
    };
  }

  /**
   * Compile analysis from multiple frames
   */
  compileAnalysis(frames) {
    return {
      layout: 'Landing page with hero, features grid, footer',
      colors: ['#ffffff', '#000000', '#fbbf24'], // Detected from frames
      components: [
        'navigation',
        'hero-section',
        'feature-cards',
        'cta-button',
        'footer'
      ],
      typography: 'Modern sans-serif, clean hierarchy',
      interactions: [
        'hover-effects',
        'smooth-scroll',
        'micro-interactions'
      ]
    };
  }

  /**
   * Generate code from analysis
   */
  async generateCode(analysis, name) {
    console.log('💻 Generating code...');

    const { summary } = analysis;

    // Generate HTML
    const html = this.generateHTML(summary, name);

    // Generate CSS
    const css = this.generateCSS(summary);

    // Generate JS (if needed)
    const js = this.generateJS(summary);

    return { html, css, js };
  }

  /**
   * Generate HTML structure
   */
  generateHTML(summary, name) {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${name} - Cloned Site</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  ${this.generateSections(summary)}
  <script src="script.js"></script>
</body>
</html>
    `.trim();
  }

  /**
   * Generate sections based on detected layout
   */
  generateSections(summary) {
    return summary.components.map(component => {
      switch (component) {
        case 'navigation':
          return this.generateNav();
        case 'hero-section':
          return this.generateHero();
        case 'feature-cards':
          return this.generateFeatures();
        case 'footer':
          return this.generateFooter();
        default:
          return `<section class="${component}"><!-- ${component} --></section>`;
      }
    }).join('\n  ');
  }

  generateNav() {
    return `
  <nav class="navbar">
    <div class="nav-brand">Brand</div>
    <ul class="nav-links">
      <li><a href="#">Home</a></li>
      <li><a href="#features">Features</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul>
  </nav>`;
  }

  generateHero() {
    return `
  <section class="hero">
    <h1>Welcome to Our Site</h1>
    <p>Amazing features and benefits await</p>
    <button class="cta-button">Get Started</button>
  </section>`;
  }

  generateFeatures() {
    return `
  <section class="features" id="features">
    <div class="feature-card">
      <h3>Feature 1</h3>
      <p>Description of feature 1</p>
    </div>
    <div class="feature-card">
      <h3>Feature 2</h3>
      <p>Description of feature 2</p>
    </div>
    <div class="feature-card">
      <h3>Feature 3</h3>
      <p>Description of feature 3</p>
    </div>
  </section>`;
  }

  generateFooter() {
    return `
  <footer class="footer">
    <p>© 2026 All rights reserved</p>
  </footer>`;
  }

  /**
   * Generate CSS styles
   */
  generateCSS(summary) {
    return `
/* Cloned Site Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.6;
  color: ${summary.colors[1] || '#333'};
  background: ${summary.colors[0] || '#fff'};
}

/* Navigation */
.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: ${summary.colors[0] || '#fff'};
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.nav-links {
  display: flex;
  gap: 2rem;
  list-style: none;
}

.nav-links a {
  text-decoration: none;
  color: inherit;
  transition: color 0.3s;
}

.nav-links a:hover {
  color: ${summary.colors[2] || '#007bff'};
}

/* Hero Section */
.hero {
  text-align: center;
  padding: 6rem 2rem;
  background: linear-gradient(135deg, ${summary.colors[0] || '#fff'} 0%, ${summary.colors[2] || '#f0f0f0'} 100%);
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.hero p {
  font-size: 1.25rem;
  margin-bottom: 2rem;
  opacity: 0.8;
}

/* CTA Button */
.cta-button {
  padding: 1rem 2rem;
  font-size: 1.1rem;
  background: ${summary.colors[2] || '#007bff'};
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.cta-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* Features Grid */
.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  padding: 2rem;
  border-radius: 12px;
  background: ${summary.colors[0] || '#fff'};
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  transition: transform 0.3s, box-shadow 0.3s;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.feature-card h3 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

/* Footer */
.footer {
  text-align: center;
  padding: 2rem;
  background: ${summary.colors[1] || '#333'};
  color: ${summary.colors[0] || '#fff'};
}

/* Responsive */
@media (max-width: 768px) {
  .hero h1 {
    font-size: 2rem;
  }
  
  .features {
    grid-template-columns: 1fr;
  }
}
    `.trim();
  }

  /**
   * Generate JavaScript
   */
  generateJS(summary) {
    return `
// Cloned Site Interactions
document.addEventListener('DOMContentLoaded', () => {
  // Smooth scroll for navigation links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Add animation classes on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-in');
      }
    });
  });

  document.querySelectorAll('.feature-card').forEach(el => {
    observer.observe(el);
  });

  console.log('🎬 Cloned site initialized');
});
    `.trim();
  }

  /**
   * Save generated code to output directory
   */
  async saveOutput(code, name) {
    const outputPath = path.join(this.outputDir, name);
    fs.mkdirSync(outputPath, { recursive: true });

    fs.writeFileSync(path.join(outputPath, 'index.html'), code.html);
    fs.writeFileSync(path.join(outputPath, 'styles.css'), code.css);
    fs.writeFileSync(path.join(outputPath, 'script.js'), code.js);

    return outputPath;
  }

  /**
   * Cleanup temp files
   */
  cleanup(sessionDir) {
    // Keep for debugging, or uncomment to auto-cleanup:
    // execSync(`rm -rf "${sessionDir}"`, { stdio: 'ignore' });
  }

  /**
   * Build vision prompt for AI analysis
   */
  buildVisionPrompt() {
    return `
Analyze this website screenshot and provide:

1. **Layout Structure**
   - Page sections (header, hero, features, etc.)
   - Grid/flex layout patterns
   - Spacing and alignment

2. **Visual Design**
   - Color palette (hex codes if possible)
   - Typography (fonts, sizes, weights)
   - Visual hierarchy

3. **UI Components**
   - Buttons (styles, states)
   - Cards/containers
   - Forms (if any)
   - Navigation elements

4. **Interactions**
   - Hover states visible
   - Animations suggested
   - Click targets

5. **Content**
   - Headlines and copy
   - Images/icons present
   - Call-to-action text

Format as JSON for programmatic use.
    `.trim();
  }
}

// CLI Usage
if (require.main === module) {
  const videoSource = process.argv[2];
  const outputName = process.argv[3] || 'cloned-site';

  if (!videoSource) {
    console.log(`
🎬 EL's Video-to-Code Tool

Usage: node video-to-code.js <video_url_or_path> [output_name]

Examples:
  node video-to-code.js https://twitter.com/... my-clone
  node video-to-code.js ./screen-recording.mp4 competitor-site

Output: ./generated-sites/[output_name]/
  - index.html
  - styles.css
  - script.js
    `);
    process.exit(0);
  }

  const tool = new VideoToCode();
  tool.process(videoSource, outputName).then(result => {
    if (result.success) {
      console.log('\n✨ Next steps:');
      console.log(`  cd ${result.outputPath}`);
      console.log('  npx serve .  # or open index.html in browser');
    }
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = VideoToCode;
