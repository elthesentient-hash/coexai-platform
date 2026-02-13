/**
 * Supadata API Client
 * Handles rate limits, retries, and errors for smooth operation
 * 
 * Endpoints:
 * - /v1/youtube/transcript - Get video transcripts
 * - /v1/web/scrape - Scrape web pages
 * - /v1/web/reader - Extract readable content
 * - /v1/web - Alternative web endpoint
 */

const axios = require('axios');

class SupadataClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.supadata.ai/v1';
    this.lastRequestTime = 0;
    this.minRequestInterval = 6000; // 6 seconds between requests (free plan limit)
    this.maxRetries = 3;
    this.retryDelay = 10000; // 10 seconds
  }

  /**
   * Rate limiter - ensures we don't hit API limits
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: waiting ${waitTime}ms...`);
      await this.sleep(waitTime);
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Make API request with retries
   */
  async request(endpoint, params, retryCount = 0) {
    await this.rateLimit();
    
    try {
      const response = await axios.get(`${this.baseURL}${endpoint}`, {
        params,
        headers: {
          'x-api-key': this.apiKey
        },
        timeout: 30000
      });
      
      return {
        success: true,
        data: response.data,
        endpoint
      };
      
    } catch (error) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      
      // Handle rate limiting
      if (errorData?.error === 'limit-exceeded') {
        if (retryCount < this.maxRetries) {
          console.log(`⚠️ Rate limit hit. Retrying in ${this.retryDelay/1000}s... (attempt ${retryCount + 1}/${this.maxRetries})`);
          await this.sleep(this.retryDelay);
          return this.request(endpoint, params, retryCount + 1);
        }
        return {
          success: false,
          error: 'Rate limit exceeded. Upgrade plan or wait.',
          endpoint
        };
      }
      
      // Handle 404s
      if (status === 404) {
        return {
          success: false,
          error: `Endpoint not found: ${endpoint}`,
          endpoint
        };
      }
      
      // Handle other errors
      return {
        success: false,
        error: errorData?.message || error.message,
        status,
        endpoint
      };
    }
  }

  /**
   * Get YouTube video transcript
   * @param {string} videoId - YouTube video ID
   * @param {boolean} textOnly - Return plain text
   */
  async getYouTubeTranscript(videoId, textOnly = false) {
    const params = { videoId };
    if (textOnly) params.text = 'true';
    
    return this.request('/youtube/transcript', params);
  }

  /**
   * Scrape web page content
   * @param {string} url - URL to scrape
   */
  async scrapeWeb(url) {
    // Try multiple endpoints in order of preference
    const endpoints = ['/web/scrape', '/web', '/web/reader'];
    
    for (const endpoint of endpoints) {
      const result = await this.request(endpoint, { url });
      if (result.success) {
        return { ...result, endpointUsed: endpoint };
      }
      
      // If rate limited, stop trying
      if (result.error?.includes('Rate limit')) {
        return result;
      }
    }
    
    return {
      success: false,
      error: 'All web scraping endpoints failed'
    };
  }

  /**
   * Batch process multiple YouTube videos
   * @param {string[]} videoIds - Array of video IDs
   */
  async batchYouTubeTranscripts(videoIds) {
    const results = [];
    
    for (const videoId of videoIds) {
      console.log(`🎬 Processing: ${videoId}`);
      const result = await this.getYouTubeTranscript(videoId, true);
      results.push({ videoId, ...result });
      
      if (!result.success && result.error?.includes('Rate limit')) {
        console.log('⚠️ Rate limit reached, stopping batch');
        break;
      }
    }
    
    return results;
  }

  /**
   * Get video info (title, duration, etc.) - Uses transcript endpoint
   * @param {string} videoId - YouTube video ID
   */
  async getVideoInfo(videoId) {
    // Supadata doesn't have a metadata endpoint that works
    // We'll use the transcript and extract what we can
    const result = await this.getYouTubeTranscript(videoId);
    
    if (!result.success) {
      return result;
    }
    
    // Extract basic info from transcript
    const transcript = result.data;
    return {
      success: true,
      data: {
        videoId,
        language: transcript.lang,
        availableLanguages: transcript.availableLangs,
        hasTranscript: !!transcript.content,
        transcriptLength: transcript.content ? 
          (Array.isArray(transcript.content) ? transcript.content.length : transcript.content.length) : 0
      }
    };
  }
}

module.exports = SupadataClient;

// CLI usage
if (require.main === module) {
  const client = new SupadataClient(process.env.SUPADATA_API_KEY);
  
  const command = process.argv[2];
  const arg = process.argv[3];
  
  if (!command || !arg) {
    console.log(`
Usage: node supadata-client.js <command> <arg>

Commands:
  youtube <videoId>     Get YouTube transcript
  web <url>             Scrape web page
  info <videoId>        Get video info
  batch <file.json>     Process batch of video IDs

Examples:
  node supadata-client.js youtube dQw4w9WgXcQ
  node supadata-client.js web https://example.com
  node supadata-client.js info jNQXAC9IVRw
    `);
    process.exit(0);
  }
  
  (async () => {
    try {
      let result;
      
      switch (command) {
        case 'youtube':
          console.log(`🎬 Fetching transcript for: ${arg}`);
          result = await client.getYouTubeTranscript(arg, true);
          break;
          
        case 'web':
          console.log(`🌐 Scraping: ${arg}`);
          result = await client.scrapeWeb(arg);
          break;
          
        case 'info':
          console.log(`ℹ️ Getting info for: ${arg}`);
          result = await client.getVideoInfo(arg);
          break;
          
        case 'batch':
          const fs = require('fs');
          const videoIds = JSON.parse(fs.readFileSync(arg, 'utf8'));
          console.log(`🔄 Processing ${videoIds.length} videos...`);
          result = await client.batchYouTubeTranscripts(videoIds);
          break;
          
        default:
          console.error(`❌ Unknown command: ${command}`);
          process.exit(1);
      }
      
      console.log('\n✅ Result:');
      console.log(JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  })();
}
