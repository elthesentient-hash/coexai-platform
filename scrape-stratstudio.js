// Scrape stratstudio.lovable.app using Firecrawler
const { scrapeWebsite } = require('./utils/firecrawler.js');

async function scrapeStratStudio() {
  try {
    console.log('🔥 Scraping stratstudio.lovable.app...');
    
    const data = await scrapeWebsite('https://stratstudio.lovable.app', {
      formats: ['markdown', 'html'],
      onlyMainContent: false
    });
    
    console.log('✅ Scraped successfully!');
    console.log(JSON.stringify(data, null, 2));
    
    // Save to file for analysis
    const fs = require('fs');
    fs.writeFileSync('/tmp/stratstudio-scrape.json', JSON.stringify(data, null, 2));
    console.log('📄 Saved to /tmp/stratstudio-scrape.json');
    
  } catch (error) {
    console.error('❌ Scraping failed:', error.message);
  }
}

scrapeStratStudio();
