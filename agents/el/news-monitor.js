/**
 * EL News Monitor
 * Tracks AI, finance, technology, and politics news
 * Provides hourly updates to user
 */

const fs = require('fs');
const path = require('path');

class NewsMonitor {
  constructor(workspacePath = '/root/.openclaw/workspace') {
    this.workspace = workspacePath;
    this.newsDir = path.join(workspacePath, 'news');
    this.trackedTopics = ['ai', 'finance', 'technology', 'politics'];
    
    if (!fs.existsSync(this.newsDir)) {
      fs.mkdirSync(this.newsDir, { recursive: true });
    }
  }

  /**
   * Hourly news check
   */
  async checkNews() {
    const now = new Date();
    const hour = now.getHours();
    const date = now.toISOString().split('T')[0];
    
    console.log(`[${now.toISOString()}] Checking news...`);

    const updates = {
      timestamp: now.toISOString(),
      ai: await this.getAINews(),
      finance: await this.getFinanceNews(),
      technology: await this.getTechNews(),
      politics: await this.getPoliticsNews()
    };

    // Save to daily file
    const newsFile = path.join(this.newsDir, `${date}.json`);
    let dailyNews = [];
    
    if (fs.existsSync(newsFile)) {
      dailyNews = JSON.parse(fs.readFileSync(newsFile, 'utf-8'));
    }
    
    dailyNews.push(updates);
    fs.writeFileSync(newsFile, JSON.stringify(dailyNews, null, 2));

    // Generate summary for user
    const summary = this.generateHourlySummary(updates);
    
    return summary;
  }

  /**
   * Get AI news (sources: TechCrunch, The Verge, AI Twitter)
   */
  async getAINews() {
    // This would integrate with news APIs
    // For now, return structure
    return {
      category: 'AI',
      headline: null, // Would fetch from API
      source: null,
      importance: 'medium',
      relevance: 'AI advancement tracking'
    };
  }

  /**
   * Get finance news (sources: Bloomberg, Reuters, Financial Times)
   */
  async getFinanceNews() {
    return {
      category: 'Finance',
      headline: null,
      source: null,
      importance: 'medium',
      relevance: 'Market movements, crypto, investment trends'
    };
  }

  /**
   * Get technology news (sources: Hacker News, TechCrunch, Ars Technica)
   */
  async getTechNews() {
    return {
      category: 'Technology',
      headline: null,
      source: null,
      importance: 'medium',
      relevance: 'Tech trends, startup news, breakthroughs'
    };
  }

  /**
   * Get politics news (sources: Reuters, AP, major outlets)
   */
  async getPoliticsNews() {
    return {
      category: 'Politics',
      headline: null,
      source: null,
      importance: 'medium',
      relevance: 'Policy changes, regulation, geopolitical'
    };
  }

  /**
   * Generate hourly summary for user
   */
  generateHourlySummary(updates) {
    const time = new Date(updates.timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    let summary = `## 📰 Hourly Update - ${time}\n\n`;

    // AI Section
    summary += `### 🤖 AI\n`;
    if (updates.ai.headline) {
      summary += `- **${updates.ai.headline}** (${updates.ai.source})\n`;
      summary += `  - Relevance: ${updates.ai.relevance}\n`;
    } else {
      summary += `- No major AI news this hour\n`;
    }
    summary += `\n`;

    // Finance Section
    summary += `### 💰 Finance\n`;
    if (updates.finance.headline) {
      summary += `- **${updates.finance.headline}** (${updates.finance.source})\n`;
      summary += `  - Relevance: ${updates.finance.relevance}\n`;
    } else {
      summary += `- No major finance news this hour\n`;
    }
    summary += `\n`;

    // Technology Section
    summary += `### 💻 Technology\n`;
    if (updates.technology.headline) {
      summary += `- **${updates.technology.headline}** (${updates.technology.source})\n`;
      summary += `  - Relevance: ${updates.technology.relevance}\n`;
    } else {
      summary += `- No major tech news this hour\n`;
    }
    summary += `\n`;

    // Politics Section
    summary += `### 🏛️ Politics\n`;
    if (updates.politics.headline) {
      summary += `- **${updates.politics.headline}** (${updates.politics.source})\n`;
      summary += `  - Relevance: ${updates.politics.relevance}\n`;
    } else {
      summary += `- No major political news this hour\n`;
    }
    summary += `\n`;

    // EL Improvements
    const improvements = this.getRecentImprovements();
    if (improvements.length > 0) {
      summary += `### 🔄 EL Improvements (Last Hour)\n`;
      improvements.forEach(imp => {
        summary += `- ${imp}\n`;
      });
      summary += `\n`;
    }

    summary += `---\n`;

    return summary;
  }

  /**
   * Get recent improvements from EL
   */
  getRecentImprovements() {
    const today = new Date().toISOString().split('T')[0];
    const improvementsDir = path.join(this.workspace, 'improvements');
    
    if (!fs.existsSync(improvementsDir)) return [];

    const recent = [];
    const files = fs.readdirSync(improvementsDir)
      .filter(f => f.includes(today));

    files.forEach(file => {
      const type = file.split('-')[0];
      const name = file.replace(`${type}-${today}-`, '').replace('.md', '');
      recent.push(`${type}: ${name}`);
    });

    return recent;
  }

  /**
   * Get daily digest
   */
  getDailyDigest(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const newsFile = path.join(this.newsDir, `${targetDate}.json`);
    
    if (!fs.existsSync(newsFile)) {
      return `No news recorded for ${targetDate}`;
    }

    const news = JSON.parse(fs.readFileSync(newsFile, 'utf-8'));
    
    let digest = `# Daily Digest: ${targetDate}\n\n`;
    digest += `Total updates: ${news.length}\n\n`;

    // Aggregate by category
    const categories = { ai: [], finance: [], technology: [], politics: [] };
    
    news.forEach(update => {
      if (update.ai.headline) categories.ai.push(update.ai);
      if (update.finance.headline) categories.finance.push(update.finance);
      if (update.technology.headline) categories.technology.push(update.technology);
      if (update.politics.headline) categories.politics.push(update.politics);
    });

    Object.entries(categories).forEach(([cat, items]) => {
      if (items.length > 0) {
        digest += `## ${cat.toUpperCase()} (${items.length} stories)\n`;
        items.forEach(item => {
          digest += `- ${item.headline}\n`;
        });
        digest += `\n`;
      }
    });

    return digest;
  }
}

module.exports = NewsMonitor;
