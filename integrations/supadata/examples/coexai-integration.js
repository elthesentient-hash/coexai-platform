/**
 * CoExAI Agent Integration Example
 * Shows how to use Supadata with each AI agent
 */

const SupadataClient = require('../supadata-client');

// Initialize client
const client = new SupadataClient(process.env.SUPADATA_API_KEY);

// ==================== MAYA (CONTENT AGENT) ====================

async function mayaContentMultiplier(videoId) {
  console.log('\n🎬 MAYA: Content Multiplier');
  console.log('============================');
  
  // 1. Get video transcript
  const transcript = await client.getYouTubeTranscript(videoId, true);
  
  if (!transcript.success) {
    console.error('❌ Failed to get transcript:', transcript.error);
    return null;
  }
  
  console.log('✅ Transcript extracted');
  console.log('Length:', transcript.data.content.length, 'characters');
  console.log('Language:', transcript.data.lang);
  
  // 2. Extract key topics (simulated)
  const content = transcript.data.content;
  const topics = extractTopics(content);
  console.log('📋 Key topics:', topics.join(', '));
  
  // 3. Generate content pieces
  const contentPieces = generateContentPieces(content, topics);
  console.log('\n📝 Generated content:');
  contentPieces.forEach((piece, i) => {
    console.log(`  ${i + 1}. ${piece.type}: "${piece.title}"`);
  });
  
  return contentPieces;
}

// ==================== ENGAGE (COMMUNITY AGENT) ====================

async function engageCommunityAnalysis(channelVideos) {
  console.log('\n💬 ENGAGE: Community Analysis');
  console.log('===============================');
  
  const results = await client.batchYouTubeTranscripts(channelVideos);
  
  const analysis = {
    totalVideos: results.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    contentThemes: new Set()
  };
  
  results.forEach(result => {
    if (result.success) {
      const themes = extractThemes(result.data.content);
      themes.forEach(theme => analysis.contentThemes.add(theme));
    }
  });
  
  console.log('📊 Analysis Results:');
  console.log('  Total videos:', analysis.totalVideos);
  console.log('  Successful:', analysis.successful);
  console.log('  Failed:', analysis.failed);
  console.log('  Content themes:', Array.from(analysis.contentThemes).slice(0, 5).join(', '));
  
  return analysis;
}

// ==================== ANALYZE (ANALYTICS AGENT) ====================

async function analyzeCompetitorResearch(competitorUrl) {
  console.log('\n📊 ANALYZE: Competitor Research');
  console.log('=================================');
  
  const scraped = await client.scrapeWeb(competitorUrl);
  
  if (!scraped.success) {
    console.error('❌ Failed to scrape:', scraped.error);
    return null;
  }
  
  console.log('✅ Content scraped from:', competitorUrl);
  console.log('Endpoint used:', scraped.endpointUsed);
  
  // Analyze content structure
  const analysis = {
    url: competitorUrl,
    scrapedAt: new Date().toISOString(),
    contentLength: JSON.stringify(scraped.data).length,
    hasTitle: !!scraped.data.title,
    hasDescription: !!scraped.data.description,
    hasImages: scraped.data.images?.length || 0
  };
  
  console.log('\n📈 Analysis:');
  console.log('  Content size:', analysis.contentLength, 'bytes');
  console.log('  Has title:', analysis.hasTitle);
  console.log('  Has description:', analysis.hasDescription);
  console.log('  Image count:', analysis.hasImages);
  
  return analysis;
}

// ==================== SEO AGENT ====================

async function seoContentAudit(urls) {
  console.log('\n🔍 SEO: Content Audit');
  console.log('======================');
  
  const audits = [];
  
  for (const url of urls) {
    console.log(`\nAuditing: ${url}`);
    const result = await client.scrapeWeb(url);
    
    if (result.success) {
      const audit = {
        url,
        wordCount: countWords(result.data.content || result.data.text || ''),
        hasHeadings: !!(result.data.headings || result.data.h1 || result.data.h2),
        hasMeta: !!(result.data.meta || result.data.title),
        loadTime: 'unknown' // Would need additional timing
      };
      
      audits.push(audit);
      
      console.log('  ✅ Word count:', audit.wordCount);
      console.log('  ✅ Has headings:', audit.hasHeadings);
      console.log('  ✅ Has meta:', audit.hasMeta);
    } else {
      console.log('  ❌ Failed:', result.error);
    }
  }
  
  return audits;
}

// ==================== HELPER FUNCTIONS ====================

function extractTopics(content) {
  // Simple topic extraction (would use NLP in production)
  const words = content.toLowerCase().split(/\s+/);
  const commonWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all'];
  const topics = {};
  
  words.forEach(word => {
    if (word.length > 4 && !commonWords.includes(word)) {
      topics[word] = (topics[word] || 0) + 1;
    }
  });
  
  return Object.entries(topics)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

function extractThemes(content) {
  // Extract content themes
  const themes = [];
  const lower = content.toLowerCase();
  
  if (lower.includes('tutorial') || lower.includes('how to')) themes.push('educational');
  if (lower.includes('review') || lower.includes('best')) themes.push('review');
  if (lower.includes('news') || lower.includes('update')) themes.push('news');
  if (lower.includes('vlog') || lower.includes('day')) themes.push('vlog');
  
  return themes.length ? themes : ['general'];
}

function generateContentPieces(content, topics) {
  return [
    { type: 'Blog Post', title: `Deep Dive: ${topics[0] || 'Key Insights'}` },
    { type: 'Twitter Thread', title: `5 Things About ${topics[1] || 'This Topic'}` },
    { type: 'LinkedIn Post', title: `What ${topics[2] || 'Industry Leaders'} Won't Tell You` },
    { type: 'Email Newsletter', title: `Weekly Insights: ${topics[3] || 'Top Stories'}` },
    { type: 'Instagram Carousel', title: `${topics[4] || 'Tips'} Visual Guide` }
  ];
}

function countWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

// ==================== RUN EXAMPLES ====================

async function runExamples() {
  console.log('\n🚀 CoExAI + Supadata Integration Examples');
  console.log('==========================================\n');
  
  // Example 1: Maya - Content from YouTube
  // await mayaContentMultiplier('jNQXAC9IVRw');
  
  // Example 2: Engage - Batch analysis
  // await engageCommunityAnalysis(['jNQXAC9IVRw', 'dQw4w9WgXcQ']);
  
  // Example 3: Analyze - Competitor research
  // await analyzeCompetitorResearch('https://example.com');
  
  // Example 4: SEO - Content audit
  // await seoContentAudit(['https://example.com', 'https://httpbin.org/html']);
  
  console.log('\n✅ Examples defined. Uncomment to run.');
  console.log('\nUsage:');
  console.log('  Uncomment lines in runExamples() function');
  console.log('  node examples/coexai-integration.js');
}

runExamples().catch(console.error);

module.exports = {
  mayaContentMultiplier,
  engageCommunityAnalysis,
  analyzeCompetitorResearch,
  seoContentAudit
};
