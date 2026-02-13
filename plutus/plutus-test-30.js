/**
 * PLUTUS ARBITRAGE - $30 TEST CONFIGURATION
 * 
 * Optimized for small capital testing
 * Goal: Prove profitability before scaling to $300+
 * 
 * STRATEGY:
 * - Conservative position sizing
 * - Focus on highest-probability arbs only
 * - Minimal fees impact
 * - 3-day test period
 */

const { PlutusArbitrage } = require('./plutus-arbitrage');

class PlutusTest30 {
  constructor() {
    this.config = {
      // TEST CAPITAL: $30
      initialCapital: 30,
      
      // Ultra-conservative for small capital
      minProfitThreshold: 0.01,      // 1% minimum (vs 0.5% normal)
      maxPositionSize: 12,           // $12 max per trade (40% of capital)
      maxConcurrentArbs: 2,          // Max 2 positions (avoid overextension)
      
      // Only highest-probability markets
      markets: [
        'BTC-5MIN',   // Most liquid, frequent arb opportunities
        'ETH-5MIN'    // Second most active
      ],
      
      // Wait for better opportunities
      minCombinedPrice: 0.985,       // YES+NO must be < $0.985 (1.5% profit)
      
      // Fees consideration
      fees: 0.004,                   // 0.4% total fees
      
      // Test timeframe
      testDays: 3,
      
      // Reporting
      reportInterval: 1800000,       // Report every 30 minutes
      
      // Safety
      stopAfterProfit: 15,           // Stop if we make $15 (50% return)
      stopIfLoss: 6                  // Stop if we lose $6 (20% loss)
    };
    
    this.arbitrage = new PlutusArbitrage(this.config);
    this.startTime = Date.now();
    this.testComplete = false;
  }

  async init() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  🧪 PLUTUS $30 TEST DEPLOYMENT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');
    console.log('  Capital: $30');
    console.log('  Duration: 3 days');
    console.log('  Target: $5-12 profit (15-40% return)');
    console.log('  Scale trigger: $10+ profit');
    console.log('');
    console.log('  Markets: BTC-5MIN, ETH-5MIN');
    console.log('  Max positions: 2');
    console.log('  Min profit per arb: 1%');
    console.log('');
    console.log('  🎯 If successful → Scale to $300');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    await this.arbitrage.init();
    
    // Add test monitoring
    this.setupTestMonitoring();
    
    return this;
  }

  setupTestMonitoring() {
    // Check every 10 minutes for test conditions
    this.testMonitor = setInterval(() => {
      this.checkTestProgress();
    }, 600000);
    
    // Print test-specific report
    this.testReport = setInterval(() => {
      this.printTestReport();
    }, this.config.reportInterval);
  }

  checkTestProgress() {
    const profit = this.arbitrage.portfolio.totalProfit;
    const runtime = (Date.now() - this.startTime) / (1000 * 60 * 60); // hours
    
    // Success condition
    if (profit >= this.config.stopAfterProfit) {
      console.log('\n🎉 TEST SUCCESS!');
      console.log(`   Profit: $${profit.toFixed(2)} (${(profit/30*100).toFixed(0)}% return)`);
      console.log('   Time to scale to $300!');
      this.completeTest('SUCCESS');
      return;
    }
    
    // Failure condition
    if (profit <= -this.config.stopIfLoss) {
      console.log('\n⚠️ TEST STOPPED - Loss limit reached');
      console.log(`   Loss: $${Math.abs(profit).toFixed(2)}`);
      this.completeTest('STOPPED');
      return;
    }
    
    // Time check (3 days = 72 hours)
    if (runtime >= 72) {
      console.log('\n⏰ TEST COMPLETE - 3 days elapsed');
      console.log(`   Final profit: $${profit.toFixed(2)}`);
      
      if (profit > 5) {
        console.log('   ✅ PASSED - Ready to scale!');
        this.completeTest('PASSED');
      } else {
        console.log('   ⚠️ BELOW TARGET - Review strategy');
        this.completeTest('BELOW_TARGET');
      }
    }
  }

  printTestReport() {
    const runtime = (Date.now() - this.startTime) / (1000 * 60 * 60 * 24); // days
    const profit = this.arbitrage.portfolio.totalProfit;
    const arbs = this.arbitrage.performance.successfulArbs;
    
    console.log('\n📊 TEST PROGRESS REPORT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Day: ${runtime.toFixed(1)} / 3`);
    console.log(`Profit: $${profit.toFixed(2)} / $5-12 target`);
    console.log(`Return: ${(profit/30*100).toFixed(1)}%`);
    console.log(`Arbitrages: ${arbs}`);
    console.log(`Status: ${profit > 0 ? '✅ PROFITABLE' : '⏳ WAITING'}`);
    console.log('═══════════════════════════════════════════════════════════');
    
    // Projected 3-day return
    if (runtime > 0.1) {
      const projected = (profit / runtime) * 3;
      console.log(`Projected 3-day: $${projected.toFixed(2)}`);
      
      if (projected >= 10) {
        console.log('🎯 ON TRACK TO SCALE!');
      } else if (projected >= 5) {
        console.log('📈 ABOVE MINIMUM TARGET');
      } else {
        console.log('⚠️ BELOW TARGET - May need adjustment');
      }
    }
    console.log('');
  }

  completeTest(result) {
    this.testComplete = true;
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║              🧪 TEST RESULTS SUMMARY                      ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║  Status: ${result.padEnd(50)}║`);
    console.log(`║  Capital: $30                                    ║`);
    console.log(`║  Profit: $${this.arbitrage.portfolio.totalProfit.toFixed(2).padEnd(47)}║`);
    console.log(`║  Return: ${(this.arbitrage.portfolio.totalProfit/30*100).toFixed(1)}%${''.padEnd(48)}║`);
    console.log(`║  Arbs: ${this.arbitrage.performance.successfulArbs}${''.padEnd(51)}║`);
    console.log('╠═══════════════════════════════════════════════════════════╣');
    
    if (result === 'SUCCESS' || result === 'PASSED') {
      console.log('║  ✅ RECOMMENDATION: SCALE TO $300                        ║');
      console.log('║     Expected: $150-400 in 3 days                         ║');
    } else if (result === 'BELOW_TARGET') {
      console.log('║  ⚠️ RECOMMENDATION: REVIEW & ADJUST                      ║');
      console.log('║     Check market conditions, try different markets       ║');
    } else {
      console.log('║  ❌ RECOMMENDATION: STOP & ANALYZE                       ║');
      console.log('║     Review what went wrong before scaling                ║');
    }
    
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    // Stop the bot
    this.arbitrage.stop();
  }

  async start() {
    console.log('▶️ Starting $30 test...\n');
    await this.arbitrage.start();
  }
}

// CLI
if (require.main === module) {
  const test = new PlutusTest30();
  
  test.init().then(() => {
    test.start();
    
    process.on('SIGINT', async () => {
      console.log('\n🛑 Test interrupted');
      await test.arbitrage.stop();
      test.printTestReport();
      process.exit(0);
    });
  });
}

module.exports = { PlutusTest30 };
