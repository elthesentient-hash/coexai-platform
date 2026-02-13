# EL's Video-to-Code Tool

**For EL (myself) only** - A research and development tool to clone websites from screen recordings.

## 🎯 Purpose

Transform screen recordings/videos of websites into working HTML/CSS/JS code.

**Use cases:**
- Research competitor designs
- Rapid prototyping from inspiration
- Learning UI patterns by cloning
- Reverse-engineering impressive sites
- Building reference implementations

## 🚀 Quick Start

```bash
# Clone a website from video
node tools/video-to-code.js https://example.com/video.mp4 my-clone

# Or from local file
node tools/video-to-code.js ./recording.mp4 competitor-site
```

**Output:** `generated-sites/my-clone/`
- `index.html` - Page structure
- `styles.css` - Styles and design tokens
- `script.js` - Interactions

## 📋 How It Works

1. **Download/Load** video from URL or local path
2. **Extract frames** at key intervals (every 3s, max 10 frames)
3. **Analyze frames** using vision AI (placeholder - needs GPT-4V/Claude integration)
4. **Detect:**
   - Layout structure (grid, flex, sections)
   - Color palette
   - Typography
   - UI components (buttons, cards, nav)
   - Interactions (hover states, animations)
5. **Generate code** based on analysis
6. **Output** working website

## 🔧 Architecture

```
Video Input
    ↓
Frame Extraction (ffmpeg)
    ↓
Vision Analysis (AI)
    ↓
Layout Detection
    ↓
Code Generation
    ↓
Working Website
```

## 🎨 Current Implementation

**What's working:**
- ✅ Video download (yt-dlp)
- ✅ Frame extraction (ffmpeg)
- ✅ Code generation templates
- ✅ File output structure

**What needs integration:**
- ⚠️ Vision AI analysis (requires GPT-4V, Claude 3, or similar)
- ⚠️ Pixel-perfect matching
- ⚠️ Asset extraction (images, fonts)

## 💡 Vision AI Integration

To make this production-ready, integrate with:

### Option 1: OpenAI GPT-4 Vision
```javascript
const response = await openai.chat.completions.create({
  model: "gpt-4-vision-preview",
  messages: [{
    role: "user",
    content: [
      { type: "text", text: "Analyze this website screenshot..." },
      { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64}` }}
    ]
  }]
});
```

### Option 2: Anthropic Claude 3
```javascript
const response = await anthropic.messages.create({
  model: "claude-3-opus-20240229",
  max_tokens: 4096,
  messages: [{
    role: "user",
    content: [
      { type: "image", source: { type: "base64", media_type: "image/jpeg", data: base64 }},
      { type: "text", text: "Describe this website design in detail..." }
    ]
  }]
});
```

### Option 3: Local Models (Ollama + LLaVA)
```bash
ollama run llava
```

## 📊 Example Output

Input: Screen recording of e-commerce site
Output:
```
generated-sites/shop-clone/
├── index.html     # Hero, product grid, footer
├── styles.css     # Colors, typography, animations
└── script.js      # Hover effects, cart interactions
```

## 🎯 EL's Personal Use Cases

1. **Competitor Research**
   ```bash
   node video-to-code.js https://x.com/.../video techcrunch-clone
   ```
   → Study their UI patterns

2. **Rapid Prototyping**
   ```bash
   node video-to-code.js ./inspiration.mp4 client-prototype
   ```
   → Show working concept in minutes

3. **Design System Extraction**
   ```bash
   node video-to-code.js https://youtube.com/... material-design
   ```
   → Extract color palette, components

4. **Learning**
   ```bash
   node video-to-code.js ./award-winning-site.mp4 study-site
   ```
   → Clone, modify, learn

## ⚠️ Limitations

- **Not pixel-perfect** - Needs vision AI for accuracy
- **Static only** - No backend/database
- **Assets** - Images need manual handling
- **Legal** - Only clone for research/learning, not production

## 🔮 Future Enhancements

- [ ] Integrate GPT-4V/Claude for vision analysis
- [ ] Extract design tokens (colors, typography)
- [ ] Component recognition (React/Vue output)
- [ ] Asset download (images, icons)
- [ ] Animation detection and recreation
- [ ] Responsive breakpoint detection
- [ ] Figma/Sketch export

## 📝 Notes for EL

This tool is a **starting point**. The real magic happens when vision AI analyzes frames and describes the design accurately.

**Current workaround:**
- I manually analyze frames
- Describe layout and components
- Generate code from description

**Next step:**
Get access to GPT-4V or Claude 3 Vision API for automatic analysis.

---

**For:** EL (personal use)
**Created:** 2026-02-13
**Status:** MVP working, needs vision AI integration
