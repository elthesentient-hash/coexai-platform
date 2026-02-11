// Firecrawler API Client for CoExAI
const FIRECRAWLER_API_KEY = 'fc-d4a2624125604f5c80e464de6a2f3f1b';
const FIRECRAWLER_BASE_URL = 'https://api.firecrawler.dev/v1';

/**
 * Scrape a website using Firecrawler
 * @param {string} url - URL to scrape
 * @param {Object} options - Scrape options
 * @returns {Promise<Object>} - Scraped content
 */
async function scrapeWebsite(url, options = {}) {
  try {
    const response = await fetch(`${FIRECRAWLER_BASE_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWLER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        formats: options.formats || ['markdown', 'html'],
        onlyMainContent: options.onlyMainContent !== false,
        includeTags: options.includeTags || [],
        excludeTags: options.excludeTags || [],
        headers: options.headers || {}
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawler error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Firecrawler scrape failed:', error);
    throw error;
  }
}

/**
 * Crawl multiple pages from a website
 * @param {string} url - Starting URL
 * @param {Object} options - Crawl options
 * @returns {Promise<Object>} - Crawled pages
 */
async function crawlWebsite(url, options = {}) {
  try {
    const response = await fetch(`${FIRECRAWLER_BASE_URL}/crawl`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWLER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        limit: options.limit || 10,
        depth: options.depth || 2,
        formats: options.formats || ['markdown'],
        onlyMainContent: options.onlyMainContent !== false
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawler crawl error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Firecrawler crawl failed:', error);
    throw error;
  }
}

/**
 * Extract structured data from a website
 * @param {string} url - URL to extract from
 * @param {Object} schema - Extraction schema
 * @returns {Promise<Object>} - Extracted data
 */
async function extractData(url, schema) {
  try {
    const response = await fetch(`${FIRECRAWLER_BASE_URL}/extract`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWLER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        schema: schema
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawler extract error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Firecrawler extract failed:', error);
    throw error;
  }
}

/**
 * Search and scrape content
 * @param {string} query - Search query
 * @param {number} limit - Number of results
 * @returns {Promise<Object>} - Search results with scraped content
 */
async function searchAndScrape(query, limit = 5) {
  try {
    const response = await fetch(`${FIRECRAWLER_BASE_URL}/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWLER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        limit: limit,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Firecrawler search error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Firecrawler search failed:', error);
    throw error;
  }
}

// Export for use
module.exports = {
  scrapeWebsite,
  crawlWebsite,
  extractData,
  searchAndScrape,
  FIRECRAWLER_API_KEY,
  FIRECRAWLER_BASE_URL
};

// Example usage:
// scrapeWebsite('https://motionsites.ai').then(data => console.log(data));
