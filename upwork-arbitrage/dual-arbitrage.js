/**
 * DUAL ARBITRAGE SYSTEM
 * 
 * Combined Polymarket + Upwork arbitrage
 * Maximum profit extraction across both platforms
 * 
 * Strategies:
 * 1. POLYMARKET: Risk-free structural arbitrage (YES+NO < $1)
 * 2. UPWORK: Pre-built project delivery with sub-agent spawning
 * 
 * Target: $110K/day (Polymarket) + $5K/day (Upwork) = $115K/day
 */

const { PlutusArbitrage } = require('../plutus/plutus-arbitrage');
const { UpworkArbitrage } = require('./upwork-arbitrage');

class DualArbitrage {
  constructor(config = {}) {
    this.config = {
      // Capital allocation
      polymarketCapital: config.polymarketCapital || 10000,
      upworkCapital: config.upworkCapital || 0, // Time investment
      
      // Activation
      enablePolymarket: config.enablePolymarket !== false,
      enableUpwork: config.enableUpwork !== false,
      
      // Risk management
      dailyProfitTarget: config.dailyProfitTarget || 10000,
      maxDailyLoss: config.maxDailyLoss || 1000,
      
      ...config
    };
    
    // Components
    this.polymarket = null;
    this.upwork = null;
    
    // Performance tracking
    this.stats = {
      startTime: Date.now(),
      polymarketProfit: 0,
      upworkRevenue: 0,
      totalProfit: 0,
      bestDay: 0,
      worstDay: 0
    };
    
    this.isRunning = false;
  }

  /**
   * Initialize dual arbitrage system
   */
  async init() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🤖 DUAL ARBITRAGE SYSTEM');
    console.log('  Polymarket + Upwork Profit Extraction');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Initialize Polymarket arbitrage
    if (this.config.enablePolymarket) {
      console.log('📊 Initializing Polymarket Arbitrage...');
      this.polymarket = new PlutusArbitrage({
        privateKey: process.env.PRIVATE_KEY,
        initialCapital: this.config.polymarketCapital,
        markets: ['BTC-5MIN', 'BTC-15MIN', 'ETH-5MIN', 'ETH-15MIN', 'SOL-5MIN']
      });
      await this.polymarket.init();
    }
    
    // Initialize Upwork arbitrage
    if (this.config.enableUpwork) {
      console.log('💼 Initializing Upwork Arbitrage...');
      this.upwork = new UpworkArbitrage({
        maxConcurrentAgents: 10
      });
      await this.upwork.init();
    }
    
    console.log('\n✅ Dual arbitrage system ready\n');
    return this;
  }

  /**
   * Start both arbitrage systems
   */
  async start() {
    this.isRunning = true;
    console.log('▶️ Starting Dual Arbitrage...\n');
    
    // Start Polymarket
    if (this.polymarket) {
      await this.polymarket.start();
    }
    
    // Start Upwork
    if (this.upwork) {
      await this.upwork.start();
    }
    
    // Combined performance monitoring
    this.monitorLoop = setInterval(() => this.monitorPerformance(), 60000);
    
    // Print combined report every 5 minutes
    this.reportLoop = setInterval(() => this.printCombinedReport(), 300000);
    
    console.log('✅ Both systems operational\n');
  }

  /**
   * Monitor combined performance
   */
  async monitorPerformance() {
    const polymarketProfit = this.polymarket?.portfolio?.totalProfit || 0;
    const upworkRevenue = this.upwork?.stats?.revenue || 0;
    const total = polymarketProfit + upworkRevenue;
    
    this.stats.polymarketProfit = polymarketProfit;
    this.stats.upworkRevenue = upworkRevenue;
    this.stats.totalProfit = total;
    
    // Check daily target
    const dailyTotal = this.polymarket?.portfolio?.dailyProfit || 0;
    
    if (dailyTotal > this.config.dailyProfitTarget) {
      console.log('🎯 Daily profit target reached!');
    }
    
    // Risk check
    if (dailyTotal < -this.config.maxDailyLoss) {
      console.log('🛑 Daily loss limit hit - stopping systems');
      await this.stop();
    }
  }

  /**
   * Print combined performance report
   */
  printCombinedReport() {
    const runtime = (Date.now() - this.stats.startTime) / 1000;
    const hours = Math.floor(runtime / 3600);
    const minutes = Math.floor((runtime % 3600) / 60);
    
    // Polymarket stats
    const pmStats = this.polymarket?.performance || {};
    const pmPortfolio = this.polymarket?.portfolio || {};
    
    // Upwork stats
    const uwStats = this.upwork?.stats || {};
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║         🤖 DUAL ARBITRAGE PERFORMANCE REPORT              ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║  Runtime: ${hours}h ${minutes}m`.padEnd(59) + '║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║  📊 POLYMARKET ARBITRAGE                                  ║');
    console.log(`║     Profit: $${(pmPortfolio.totalProfit || 0).toFixed(2)}`.padEnd(59) + '║');
    console.log(`║     Daily:  $${(pmPortfolio.dailyProfit || 0).toFixed(2)}`.padEnd(59) + '║');
    console.log(`║     Arbs:   ${pmStats.successfulArbs || 0} completed`.padEnd(59) + '║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║  💼 UPWORK ARBITRAGE                                      ║');
    console.log(`║     Revenue: $${(uwStats.revenue || 0).toFixed(2)}`.padEnd(59) + '║');
    console.log(`║     Apps:    ${uwStats.applicationsSent || 0} sent`.padEnd(59) + '║');
    console.log(`║     Agents:  ${uwStats.agentsSpawned || 0} spawned`.padEnd(59) + '║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║  💰 COMBINED TOTALS                                       ║');
    console.log(`║     Total Profit: $${this.stats.totalProfit.toFixed(2)}`.padEnd(59) + '║');
    console.log(`║     Hourly Rate:  $${(this.stats.totalProfit / (runtime/3600)).toFixed(2)}/hr`.padEnd(59) + '║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
  }

  /**
   * Stop both systems
   */
  async stop() {
    this.isRunning = false;
    
    clearInterval(this.monitorLoop);
    clearInterval(this.reportLoop);
    
    if (this.polymarket) {
      await this.polymarket.stop();
    }
    
    if (this.upwork) {
      await this.upwork.stop();
    }
    
    console.log('\n⏹️ Dual arbitrage system stopped');
    this.printCombinedReport();
  }
}

// CLI
if (require.main === module) {
  const dual = new DualArbitrage({
    polymarketCapital: 10000,
    enablePolymarket: true,
    enableUpwork: true,
    dailyProfitTarget: 5000
  });
  
  dual.init().then(() => {
    dual.start();
    
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...');
      await dual.stop();
      process.exit(0);
    });
  });
}

module.exports = { DualArbitrage };
