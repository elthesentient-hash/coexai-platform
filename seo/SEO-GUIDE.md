# CoExAI SEO & Marketing Setup

## Meta Tags Template

Add these to each page's `<head>`:

### Homepage
```html
<title>CoExAI - Your AI Agent Workforce | Automate & Scale</title>
<meta name="description" content="Deploy AI agents that work 24/7. Maya repurposes content, Jordan grows your LinkedIn, Sam dominates local SEO, Taylor automates documents.">
<meta name="keywords" content="AI agents, content repurposing, LinkedIn growth, local SEO, document automation">

<!-- Open Graph -->
<meta property="og:title" content="CoExAI - Your AI Agent Workforce">
<meta property="og:description" content="Deploy AI agents that work 24/7. Scale without limits.">
<meta property="og:image" content="https://coexai.com/og-image.jpg">
<meta property="og:url" content="https://coexai.com">
<meta property="og:type" content="website">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="CoExAI - Your AI Agent Workforce">
<meta name="twitter:description" content="Deploy AI agents that work 24/7">
<meta name="twitter:image" content="https://coexai.com/twitter-image.jpg">

<!-- Canonical -->
<link rel="canonical" href="https://coexai.com">
```

### Dashboard Pages
```html
<title>Dashboard | CoExAI</title>
<meta name="robots" content="noindex, nofollow">
```

---

## Keywords Strategy

### Primary Keywords (High Priority)
- AI agents
- AI workforce
- Content repurposing AI
- LinkedIn automation
- Local SEO service
- Document processing AI

### Long-Tail Keywords
- "best AI for content repurposing"
- "LinkedIn growth service"
- "automate Google Business Profile"
- "AI document data extraction"
- "podcast to social media clips"
- "local SEO for small business"

### Agent-Specific Keywords

**Maya:**
- Video repurposing
- Podcast to clips
- Content multiplier
- Auto-generate social media
- AI content creator

**Jordan:**
- LinkedIn ghostwriter
- LinkedIn automation tool
- Personal branding service
- LinkedIn content strategy
- Executive presence LinkedIn

**Sam:**
- Google Maps ranking
- Local SEO automation
- GMB optimization
- Local business marketing
- Review management

**Taylor:**
- Document automation
- Data extraction AI
- OCR software
- Invoice processing
- Form automation

---

## Schema Markup

### Organization Schema
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "CoExAI",
  "url": "https://coexai.com",
  "logo": "https://coexai.com/logo.png",
  "description": "AI agent workforce for content, LinkedIn, SEO, and document automation",
  "sameAs": [
    "https://twitter.com/coexai",
    "https://linkedin.com/company/coexai"
  ]
}
```

### Product Schema (for each agent)
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Jordan - LinkedIn Growth Agent",
  "description": "AI-powered LinkedIn ghostwriting and engagement",
  "brand": {
    "@type": "Brand",
    "name": "CoExAI"
  },
  "offers": {
    "@type": "Offer",
    "price": "1000",
    "priceCurrency": "USD",
    "priceValidUntil": "2026-12-31",
    "availability": "https://schema.org/InStock"
  }
}
```

### FAQ Schema
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do CoExAI agents work?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "CoExAI agents are autonomous AI systems..."
      }
    }
  ]
}
```

---

## Sitemap Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>https://coexai.com/</loc>
    <lastmod>2026-02-11</lastmod>
    <priority>1.0</priority>
    <changefreq>daily</changefreq>
  </url>
  
  <!-- Agent Pages -->
  <url>
    <loc>https://coexai.com/agents/maya</loc>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://coexai.com/agents/jordan</loc>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://coexai.com/agents/sam</loc>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://coexai.com/agents/taylor</loc>
    <priority>0.9</priority>
  </url>
  
  <!-- Other Pages -->
  <url>
    <loc>https://coexai.com/pricing</loc>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://coexai.com/blog</loc>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://coexai.com/about</loc>
    <priority>0.6</priority>
  </url>
</urlset>
```

---

## Analytics Setup

### Google Analytics 4 Events to Track
- `sign_up` - User registration
- `trial_start` - Free trial begun
- `purchase` - Subscription completed
- `agent_deploy` - Agent activated
- `content_generated` - Content created
- `page_view` - Key pages visited

### Conversion Goals
1. Trial Signup
2. Paid Conversion
3. Agent Activation
4. Content Creation
5. Referral Share

### Key Metrics
- Trial-to-paid conversion rate
- Agent activation rate
- Time to first value
- Customer lifetime value
- Churn rate
- Net Promoter Score

---

## Content Marketing Strategy

### Blog Post Ideas
1. "10 Ways AI Agents Are Replacing Marketing Agencies"
2. "How to 10x Your Content Output Without Hiring"
3. "The Complete Guide to LinkedIn Personal Branding"
4. "Local SEO Checklist for 2026"
5. "Document Automation ROI Calculator"
6. "AI vs Human: When to Use Each for Content"
7. "How One Founder Replaced a $15K Agency with AI"
8. "The Future of Work: AI Agents as Team Members"
9. "Building a Personal Brand on LinkedIn in 30 Days"
10. "How to Rank #1 on Google Maps (Step-by-Step)"

### Content Calendar
- **Monday:** Educational/how-to content
- **Wednesday:** Case study/success story
- **Friday:** Industry news/commentary

### Distribution Channels
1. LinkedIn (primary)
2. Twitter/X
3. Medium
4. IndieHackers
5. Reddit (r/marketing, r/SEO)
6. Product Hunt
7. Hacker News

---

## Technical SEO Checklist

### Page Speed
- [ ] Target: < 3s load time
- [ ] Optimize images (WebP format)
- [ ] Minify CSS/JS
- [ ] Enable compression
- [ ] Use CDN

### Mobile
- [ ] Responsive design
- [ ] Touch-friendly targets
- [ ] Fast mobile load
- [ ] No intrusive interstitials

### Security
- [ ] HTTPS only
- [ ] Security headers
- [ ] No mixed content

### Structure
- [ ] Clean URL structure
- [ ] Breadcrumb navigation
- [ ] Internal linking
- [ ] XML sitemap
- [ ] Robots.txt

