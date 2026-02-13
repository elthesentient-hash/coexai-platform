/**
 * PLUTUS FOR POLYMARKET CRYPTO
 * 
 * Specialized trading bot for https://polymarket.com/crypto
 * Integrates with TradingView technical analysis
 * 
 * Supports all crypto markets:
 * - 5M, 15M, 1H, 4H, 1D timeframes
 * - BTC, ETH, SOL, XRP, DOGE
 * - Binary up/down, price levels, ranges, targets
 * - Token launch FDV markets
 */

const { ethers } = require('ethers');
const { StrategyLibrary } = require('./strategies');
const { 
  POLYMARKET_CRYPTO_MARKETS, 
  TRADINGVIEW_SYMBOLS,
  getHFTMarkets,
  getMarketsByAsset,
  checkArbitrage 
} = require('./polymarket-markets');
const { TradingViewIntegration } = require('./tradingview-integration');

class PlutusPolymarketCrypto {
  constructor(config = {}) {
    this.config = {
      // Wallet
      privateKey: config.privateKey || process.env.PRIVATE_KEY,
      rpcUrl: config.rpcUrl || 'https://polygon-rpc.com',
      
      // Trading focus
      focus: config.focus || 'HFT', // HFT, SWING, ALL
      
      // Market selection
      timeframes: config.timeframes || ['5M', '15M'],
      assets: config.assets || ['BTC', 'ETH', 'SOL'],
      
      // Capital allocation
      initialCapital: config.initialCapital || 10000,
      
      // Risk per trade
      riskPerTrade: config.riskPerTrade || 0.02, // 2%
      maxDailyLoss: config.maxDailyLoss || 0.05, // 5%
      
      // Position limits
      maxPositions: config.maxPositions || 10,
      
      // Execution
      executionMode: config.executionMode || 'PAPER', // PAPER, LIVE
      
      // APIs
      polymarketApi: config.polymarketApi || 'https://clob.polymarket.com',
      
      ...config
    };
    
    // Initialize components
    this.strategies = new StrategyLibrary(this.config);
    this.tvIntegration = new TradingViewIntegration(this.config);
    
    // State
    this.provider = null;
    this.wallet = null;
    this.portfolio = {
      cash: this.config.initialCapital,
      positions: new Map(),
      trades: [],
      dailyPnl: 0,
      totalPnl: 0
    };
    
    this.activeMarkets = [];
    this.isRunning = false;
    
    // Performance
    this.performance = {
      startTime: Date.now(),
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      sharpeRatio: 0,
      maxDrawdown: 0
    };
  }

  /**
   * Initialize bot
   */
  async init() {
    console.log('🚀 Initializing Plutus for Polymarket Crypto...');
    console.log('═══════════════════════════════════════════════════════════');
    
    // Setup wallet
    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
    
    console.log(`💰 Wallet: ${this.wallet.address}`);
    
    // Check balance
    const usdcBalance = await this.getUSDCBalance();
    console.log(`💰 USDC Balance: $${usdcBalance.toFixed(2)}`);
    
    // Initialize TradingView integration
    await this.tvIntegration.init();
    
    // Select active markets based on config
    this.selectActiveMarkets();
    
    console.log(`📊 Active Markets: ${this.activeMarkets.length}`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    return this;
  }

  /**
   * Select markets to trade based on focus
   */
  selectActiveMarkets() {
    if (this.config.focus === 'HFT') {
      // High-frequency: 5M and 15M binary markets only
      this.activeMarkets = getHFTMarkets().filter(m => 
        this.config.assets.includes(m.asset)
      );
    } else if (this.config.focus === 'SWING') {
      // Swing trading: Hourly, 4H, Daily
      const swingMarkets = [];
      for (const tf of ['HOURLY', '4HOUR', 'DAILY']) {
        if (POLYMARKET_CRYPTO_MARKETS[tf]?.markets) {
          swingMarkets.push(...POLYMARKET_CRYPTO_MARKETS[tf].markets);
        }
      }
      this.activeMarkets = swingMarkets.filter(m => 
        this.config.assets.includes(m.asset)
      );
    } else {
      // ALL: Trade everything
      this.activeMarkets = [
        ...getHFTMarkets(),
        ...POLYMARKET_CRYPTO_MARKETS['HOURLY']?.markets || [],
        ...POLYMARKET_CRYPTO_MARKETS['4HOUR']?.markets || [],
        ...POLYMARKET_CRYPTO_MARKETS['DAILY']?.markets || [],
        ...POLYMARKET_CRYPTO_MARKETS['PRICE_LEVELS']?.markets || []
      ].filter(m => this.config.assets.includes(m.asset));
    }
    
    console.log('🎯 Selected Markets:');
    this.activeMarkets.forEach(m => {
      console.log(`   - ${m.name} (${m.type})`);
    });
  }

  /**
   * Start trading
   */
  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('▶️ Starting Polymarket Crypto Trading...\n');
    
    // Main trading loop
    this.tradingLoop = setInterval(() => this.tradingCycle(), 2000);
    
    // Risk monitoring
    this.riskLoop = setInterval(() => this.monitorRisk(), 10000);
    
    // Performance reporting
    this.reportLoop = setInterval(() => this.printReport(), 60000);
    
    console.log('✅ Trading active\n');
  }

  /**
   * Main trading cycle
   */
  async tradingCycle() {
    if (!this.isRunning) return;
    
    try {
      for (const market of this.activeMarkets) {
        await this.analyzeAndTrade(market);
      }
    } catch (error) {
      console.error('❌ Trading cycle error:', error.message);
    }
  }

  /**
   * Analyze market and execute trades
   */
  async analyzeAndTrade(market) {
    // Get TradingView signals
    const tvSignals = this.tvIntegration.getSignals(market.asset);
    const indicators = this.tvIntegration.getIndicators(market.asset);
    
    if (!tvSignals || !indicators) return;
    
    // Get current price
    const currentPrice = this.tvIntegration.getPrice(market.asset);
    if (!currentPrice) return;
    
    // Market-specific analysis
    let signal = null;
    let confidence = 0;
    
    if (market.type === 'binary' && market.category === 'price-direction') {
      // Binary up/down markets
      signal = this.analyzeBinaryMarket(market, tvSignals, indicators, currentPrice);
    } else if (market.category === 'price-level') {
      // Price level markets (will BTC be above X?)
      signal = this.analyzePriceLevel(market, currentPrice, indicators);
    } else if (market.category === 'price-range') {
      // Price range markets
      signal = this.analyzePriceRange(market, currentPrice, indicators);
    }
    
    // Execute if signal is strong enough
    if (signal && signal.confidence > 0.65) {
      await this.executeTrade(market, signal);
    }
  }

  /**
   * Analyze binary up/down markets
   */
  analyzeBinaryMarket(market, tvSignals, indicators, currentPrice) {
    const { trend, strength, signals } = tvSignals;
    
    // Need strong signal
    if (strength < 0.6) return null;
    
    // Check for confluence (multiple indicators agree)
    const bullishSignals = signals.filter(s => 
      s.signal.includes('OVERSOLD') || 
      s.signal.includes('BULLISH') || 
      s.signal.includes('LOWER_BAND')
    ).length;
    
    const bearishSignals = signals.filter(s => 
      s.signal.includes('OVERBOUGHT') || 
      s.signal.includes('BEARISH') || 
      s.signal.includes('UPPER_BAND')
    ).length;
    
    if (bullishSignals >= 2 && trend === 'BULLISH') {
      return {
        side: 'YES',
        confidence: strength,
        reason: `Bullish confluence: ${bullishSignals} signals`,
        entryPrice: currentPrice.price
      };
    }
    
    if (bearishSignals >= 2 && trend === 'BEARISH') {
      return {
        side: 'NO',
        confidence: strength,
        reason: `Bearish confluence: ${bearishSignals} signals`,
        entryPrice: currentPrice.price
      };
    }
    
    return null;
  }

  /**
   * Analyze price level markets
   */
  analyzePriceLevel(market, currentPrice, indicators) {
    const threshold = market.threshold;
    const current = currentPrice.price;
    
    // Calculate probability of hitting threshold
    const distance = Math.abs(current - threshold) / threshold;
    
    // Use ATR for volatility estimate
    const atr = indicators.atr?.current || 0;
    const atrPercent = atr / current;
    
    // Time to expiry (simplified)
    const timeToExpiry = 24; // hours (simplified)
    
    // Probability estimate based on distance, volatility, and time
    const requiredMove = distance;
    const possibleMove = atrPercent * Math.sqrt(timeToExpiry);
    
    if (market.asset === 'BTC') {
      // BTC above threshold
      if (current > threshold * 0.98) {
        // Close to threshold, high probability
        return {
          side: 'YES',
          confidence: 0.8,
          reason: `BTC at $${current.toFixed(0)}, target $${threshold}`,
          entryPrice: current
        };
      }
    }
    
    // If probability of reaching is high
    if (possibleMove > requiredMove * 1.5) {
      return {
        side: current > threshold ? 'YES' : 'NO',
        confidence: 0.7,
        reason: `High probability: ${(possibleMove/requiredMove).toFixed(1)}x required move`,
        entryPrice: current
      };
    }
    
    return null;
  }

  /**
   * Analyze price range markets
   */
  analyzePriceRange(market, currentPrice, indicators) {
    const { low, high } = market.range;
    const current = currentPrice.price;
    
    // Check if price is currently in range
    const inRange = current >= low && current <= high;
    
    // Use Bollinger Bands to predict range holding
    const bb = indicators.bollinger;
    if (!bb) return null;
    
    // If price is mid-range and bands are contained
    if (inRange && bb.upper < high * 1.02 && bb.lower > low * 0.98) {
      return {
        side: 'YES',
        confidence: 0.75,
        reason: `Price $${current.toFixed(0)} in range $${low}-$${high}`,
        entryPrice: current
      };
    }
    
    // If price is outside range but likely to return
    if (!inRange && indicators.rsi?.current < 30) {
      return {
        side: 'YES',
        confidence: 0.6,
        reason: 'Oversold, likely to return to range',
        entryPrice: current
      };
    }
    
    return null;
  }

  /**
   * Execute trade
   */
  async executeTrade(market, signal) {
    // Check position limit
    if (this.portfolio.positions.size >= this.config.maxPositions) {
      return;
    }
    
    // Calculate position size (Kelly Criterion)
    const winRate = this.performance.winRate || 0.5;
    const kellyFraction = winRate * 2 - 1; // Simplified Kelly
    const positionSize = Math.min(
      this.portfolio.cash * this.config.riskPerTrade,
      this.portfolio.cash * Math.max(0, kellyFraction) * 0.5 // Half Kelly for safety
    );
    
    if (positionSize < 10) return;
    
    const position = {
      id: `${market.id}-${Date.now()}`,
      market: market.id,
      marketName: market.name,
      asset: market.asset,
      side: signal.side,
      size: positionSize,
      entryPrice: signal.entryPrice,
      confidence: signal.confidence,
      reason: signal.reason,
      entryTime: Date.now(),
      status: 'OPEN'
    };
    
    this.portfolio.positions.set(position.id, position);
    this.portfolio.cash -= positionSize;
    
    console.log(`🎯 ENTER | ${market.name} | ${signal.side} | $${positionSize.toFixed(0)} | ${signal.reason}`);
    
    // Set exit timer
    const timeframe = market.timeframe || '5M';
    const exitDelay = timeframe === '5M' ? 300000 : timeframe === '15M' ? 900000 : 3600000;
    setTimeout(() => this.checkExit(position), Math.min(exitDelay, 60000));
    
    this.performance.totalTrades++;
  }

  /**
   * Check position for exit
   */
  async checkExit(position) {
    if (position.status !== 'OPEN') return;
    
    const market = this.activeMarkets.find(m => m.id === position.market);
    if (!market) return;
    
    const currentPrice = this.tvIntegration.getPrice(market.asset);
    if (!currentPrice) return;
    
    // For binary markets, exit based on time or profit
    const timeHeld = Date.now() - position.entryTime;
    const maxHoldTime = market.timeframe === '5M' ? 300000 : 900000;
    
    let shouldExit = false;
    let exitReason = '';
    let pnl = 0;
    
    // Time-based exit
    if (timeHeld >= maxHoldTime) {
      shouldExit = true;
      exitReason = 'time-limit';
    }
    
    // Profit-based exit for price level markets
    if (market.category === 'price-level') {
      const threshold = market.threshold;
      if (position.side === 'YES' && currentPrice.price >= threshold * 0.99) {
        shouldExit = true;
        exitReason = 'target-reached';
        pnl = positionSize * 0.95; // 95% profit (minus fees)
      }
    }
    
    if (shouldExit) {
      await this.closePosition(position, exitReason, pnl);
    } else {
      // Check again in 10 seconds
      setTimeout(() => this.checkExit(position), 10000);
    }
  }

  /**
   * Close position
   */
  async closePosition(position, reason, pnl) {
    position.status = 'CLOSED';
    position.exitTime = Date.now();
    position.pnl = pnl;
    position.exitReason = reason;
    
    this.portfolio.positions.delete(position.id);
    this.portfolio.trades.push(position);
    this.portfolio.cash += position.size + pnl;
    this.portfolio.totalPnl += pnl;
    this.portfolio.dailyPnl += pnl;
    
    // Update performance
    if (pnl > 0) {
      this.performance.winningTrades++;
    } else {
      this.performance.losingTrades++;
    }
    
    this.performance.winRate = this.performance.winningTrades / this.performance.totalTrades;
    
    console.log(`💰 EXIT | ${reason} | PnL: $${pnl.toFixed(2)}`);
  }

  /**
   * Risk monitoring
   */
  async monitorRisk() {
    const dailyReturn = this.portfolio.dailyPnl / this.config.initialCapital;
    
    if (dailyReturn < -this.config.maxDailyLoss) {
      console.log('🛑 Daily loss limit reached. Stopping.');
      await this.stop();
    }
  }

  /**
   * Print performance report
   */
  printReport() {
    const runtime = (Date.now() - this.performance.startTime) / 1000;
    const hours = Math.floor(runtime / 3600);
    const minutes = Math.floor((runtime % 3600) / 60);
    
    const return_pct = (this.portfolio.totalPnl / this.config.initialCapital) * 100;
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  PLUTUS POLYMARKET CRYPTO - PERFORMANCE');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`⏱️  Runtime:        ${hours}h ${minutes}m`);
    console.log(`💰 Cash:           $${this.portfolio.cash.toFixed(2)}`);
    console.log(`📈 Total Return:   ${return_pct.toFixed(2)}%`);
    console.log(`💵 Total P&L:      $${this.portfolio.totalPnl.toFixed(2)}`);
    console.log(`🔄 Trades:         ${this.performance.totalTrades}`);
    console.log(`✅ Win Rate:       ${(this.performance.winRate * 100).toFixed(1)}%`);
    console.log(`📊 Open Positions: ${this.portfolio.positions.size}`);
    console.log('═══════════════════════════════════════════════════════════\n');
  }

  /**
   * Get USDC balance
   */
  async getUSDCBalance() {
    try {
      const usdcContract = new ethers.Contract(
        '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
        ['function balanceOf(address) view returns (uint256)'],
        this.provider
      );
      const balance = await usdcContract.balanceOf(this.wallet.address);
      return parseFloat(ethers.formatUnits(balance, 6));
    } catch (error) {
      return 0;
    }
  }

  /**
   * Stop trading
   */
  async stop() {
    this.isRunning = false;
    
    clearInterval(this.tradingLoop);
    clearInterval(this.riskLoop);
    clearInterval(this.reportLoop);
    
    this.tvIntegration.stop();
    
    // Close all positions
    for (const [id, pos] of this.portfolio.positions) {
      if (pos.status === 'OPEN') {
        await this.closePosition(pos, 'shutdown', 0);
      }
    }
    
    console.log('\n⏹️ Plutus stopped');
    this.printReport();
  }
}

// CLI
if (require.main === module) {
  const config = {
    privateKey: process.env.PRIVATE_KEY,
    focus: 'HFT',
    assets: ['BTC', 'ETH', 'SOL'],
    timeframes: ['5M', '15M'],
    initialCapital: 10000,
    executionMode: 'PAPER'
  };
  
  const plutus = new PlutusPolymarketCrypto(config);
  
  plutus.init().then(() => {
    plutus.start();
    
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...');
      await plutus.stop();
      process.exit(0);
    });
  });
}

module.exports = { PlutusPolymarketCrypto };
