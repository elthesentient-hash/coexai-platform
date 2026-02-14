/**
 * Academic Research Toolkit
 * Search and analyze academic papers from multiple sources
 */

const axios = require('axios');
const { parseString } = require('xml2js');

class AcademicResearch {
  constructor() {
    this.arxivBase = 'http://export.arxiv.org/api/query';
    this.semanticScholarBase = 'https://api.semanticscholar.org/graph/v1';
    this.crossrefBase = 'https://api.crossref.org/works';
  }

  /**
   * Search arXiv papers
   */
  async searchArXiv(query, maxResults = 10) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.arxivBase}?search_query=all:${encodedQuery}&start=0&max_results=${maxResults}`;
      
      const response = await axios.get(url, { timeout: 10000 });
      
      // Parse XML response
      const papers = [];
      const entries = response.data.match(/<entry>[\s\S]*?<\/entry>/g) || [];
      
      for (const entry of entries) {
        const paper = {
          id: entry.match(/<id>([^<]*)<\/id>/)?.[1] || '',
          title: entry.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.trim() || '',
          summary: entry.match(/<summary>([\s\S]*?)<\/summary>/)?.[1]?.trim() || '',
          authors: (entry.match(/<name>([^<]*)<\/name>/g) || [])
            .map(m => m.replace(/<\/?name>/g, '')),
          published: entry.match(/<published>([^<]*)<\/published>/)?.[1] || '',
          primaryCategory: entry.match(/<primary_category[^\u003e]* term="([^"]*)"/)?.[1] || '',
          pdfLink: entry.match(/<link[^\u003e]*type="application/pdf"[^\u003e]*href="([^"]*)"/)?.[1] || ''
        };
        
        papers.push(paper);
      }
      
      return papers;
      
    } catch (error) {
      console.error('arXiv search error:', error.message);
      return [];
    }
  }

  /**
   * Search Semantic Scholar
   */
  async searchSemanticScholar(query, maxResults = 10) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.semanticScholarBase}/paper/search?query=${encodedQuery}&fields=title,abstract,authors,year,citationCount,referenceCount&limit=${maxResults}`;
      
      const response = await axios.get(url, { timeout: 10000 });
      
      return response.data.data?.map(paper => ({
        title: paper.title,
        abstract: paper.abstract,
        authors: paper.authors?.map(a => a.name) || [],
        year: paper.year,
        citations: paper.citationCount,
        references: paper.referenceCount,
        paperId: paper.paperId
      })) || [];
      
    } catch (error) {
      console.error('Semantic Scholar error:', error.message);
      return [];
    }
  }

  /**
   * Search Crossref for DOI and metadata
   */
  async searchCrossref(query, maxResults = 10) {
    try {
      const encodedQuery = encodeURIComponent(query);
      const url = `${this.crossrefBase}?query=${encodedQuery}&rows=${maxResults}`;
      
      const response = await axios.get(url, { timeout: 10000 });
      
      return response.data.message?.items?.map(item => ({
        title: item.title?.[0] || '',
        authors: item.author?.map(a => `${a.given} ${a.family}`) || [],
        published: item.published?.['date-parts']?.[0]?.[0] || '',
        journal: item['container-title']?.[0] || '',
        doi: item.DOI,
        url: item.URL,
        citations: item['is-referenced-by-count'] || 0
      })) || [];
      
    } catch (error) {
      console.error('Crossref error:', error.message);
      return [];
    }
  }

  /**
   * Comprehensive research across all sources
   */
  async comprehensiveResearch(query, maxResults = 10) {
    console.log(`🔬 Academic Research: "${query}"`);
    console.log('================================');
    
    const [arxiv, semantic, crossref] = await Promise.all([
      this.searchArXiv(query, maxResults),
      this.searchSemanticScholar(query, maxResults),
      this.searchCrossref(query, maxResults)
    ]);
    
    return {
      query,
      totalPapers: arxiv.length + semantic.length + crossref.length,
      sources: {
        arxiv: {
          count: arxiv.length,
          papers: arxiv
        },
        semanticScholar: {
          count: semantic.length,
          papers: semantic
        },
        crossref: {
          count: crossref.length,
          papers: crossref
        }
      },
      summary: {
        arxivCount: arxiv.length,
        semanticCount: semantic.length,
        crossrefCount: crossref.length,
        totalCitations: [
          ...semantic.map(p => p.citations || 0),
          ...crossref.map(p => p.citations || 0)
        ].reduce((a, b) => a + b, 0)
      }
    };
  }

  /**
   * Get paper abstract and summary
   */
  async getPaperSummary(paperId, source = 'arxiv') {
    try {
      if (source === 'arxiv') {
        const papers = await this.searchArXiv(`id:${paperId}`, 1);
        const paper = papers[0];
        
        if (!paper) return null;
        
        return {
          title: paper.title,
          abstract: paper.summary,
          authors: paper.authors,
          published: paper.published,
          keyFindings: this.extractKeyFindings(paper.summary)
        };
      }
      
      return null;
      
    } catch (error) {
      console.error('Paper summary error:', error.message);
      return null;
    }
  }

  /**
   * Extract key findings from abstract
   */
  extractKeyFindings(abstract) {
    const sentences = abstract.split(/[.!?]+/).filter(s => s.trim());
    const findings = [];
    
    const keywords = ['propose', 'demonstrate', 'show', 'achieve', 'result', 'improve', 'outperform', 'novel'];
    
    for (const sentence of sentences) {
      for (const keyword of keywords) {
        if (sentence.toLowerCase().includes(keyword)) {
          findings.push(sentence.trim());
          break;
        }
      }
    }
    
    return findings.slice(0, 5); // Top 5 findings
  }

  /**
   * Research a topic and generate report
   */
  async generateResearchReport(query) {
    const research = await this.comprehensiveResearch(query, 10);
    
    const report = {
      query: research.query,
      date: new Date().toISOString(),
      summary: {
        totalPapers: research.totalPapers,
        papersBySource: {
          arxiv: research.summary.arxivCount,
          semanticScholar: research.summary.semanticCount,
          crossref: research.summary.crossrefCount
        },
        totalCitations: research.summary.totalCitations
      },
      topPapers: [
        ...research.sources.arxiv.papers.slice(0, 3),
        ...research.sources.semanticScholar.papers.slice(0, 3)
      ].map(p => ({
        title: p.title,
        authors: p.authors?.slice(0, 3).join(', '),
        year: p.year || p.published?.substring(0, 4),
        citations: p.citations || 0
      })),
      researchTrends: this.analyzeTrends(research),
      recommendations: this.generateRecommendations(research)
    };
    
    return report;
  }

  /**
   * Analyze research trends
   */
  analyzeTrends(research) {
    const years = [];
    
    for (const source of Object.values(research.sources)) {
      for (const paper of source.papers) {
        const year = paper.year || paper.published?.substring(0, 4);
        if (year) years.push(parseInt(year));
      }
    }
    
    const recentPapers = years.filter(y => y >= 2020).length;
    const totalPapers = years.length;
    
    return {
      recentActivity: recentPapers,
      totalPapers,
      recentPercentage: totalPapers > 0 ? Math.round((recentPapers / totalPapers) * 100) : 0,
      trend: recentPapers > totalPapers * 0.5 ? 'Growing' : 'Stable'
    };
  }

  /**
   * Generate research recommendations
   */
  generateRecommendations(research) {
    const recommendations = [];
    
    if (research.summary.arxivCount > 5) {
      recommendations.push('Strong preprint activity - check latest arXiv papers');
    }
    
    if (research.summary.totalCitations > 1000) {
      recommendations.push('High citation volume - established research area');
    }
    
    if (research.summary.semanticCount < 3) {
      recommendations.push('Limited peer-reviewed papers - emerging or niche topic');
    }
    
    return recommendations;
  }
}

module.exports = AcademicResearch;

// CLI usage
if (require.main === module) {
  const research = new AcademicResearch();
  const query = process.argv[2];
  
  if (!query) {
    console.log('Academic Research Toolkit');
    console.log('Usage: node academic-research.js "your research query"');
    console.log('');
    console.log('Commands:');
    console.log('  search "query"       - Search all academic sources');
    console.log('  report "query"       - Generate full research report');
    console.log('  arxiv "query"        - Search arXiv only');
    process.exit(0);
  }
  
  const command = process.argv[2];
  const arg = process.argv[3];
  
  switch (command) {
    case 'search':
      research.comprehensiveResearch(arg).then(results => {
        console.log(JSON.stringify(results, null, 2));
      }).catch(console.error);
      break;
      
    case 'report':
      research.generateResearchReport(arg).then(report => {
        console.log(JSON.stringify(report, null, 2));
      }).catch(console.error);
      break;
      
    case 'arxiv':
      research.searchArXiv(arg).then(papers => {
        console.log(JSON.stringify(papers, null, 2));
      }).catch(console.error);
      break;
      
    default:
      research.comprehensiveResearch(command).then(results => {
        console.log(`Found ${results.totalPapers} papers`);
        console.log(`- arXiv: ${results.summary.arxivCount}`);
        console.log(`- Semantic Scholar: ${results.summary.semanticCount}`);
        console.log(`- Crossref: ${results.summary.crossrefCount}`);
      }).catch(console.error);
  }
}
