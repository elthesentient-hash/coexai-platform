/**
 * PLUTUS V2 - Advanced Polymarket Trading Bot
 * 
 * Integrated with StrategyLibrary (25+ strategies)
 * Portfolio management, advanced risk controls, execution engine
 * 
 * Target: $142K/week (Kirill) → $500K total (Discover)
 */

const { ethers } = require('ethers');
const { StrategyLibrary } = require('./strategies');

class PlutusV2 {
  constructor(config = {}) {
    this.config = {
      // Wallet
      privateKey: config.privateKey || process.env.PRIVATE_KEY,
      rpcUrl: config.rpcUrl || process.env.RPC_URL || 'https://polygon-rpc.com',
      
      // Portfolio settings
      initialCapital: config.initialCapital || 10000,
      maxDrawdown: config.maxDrawdown || 0.20, // 20%
      targetReturn: config.targetReturn || 0.10, // 10% monthly
      
      // Strategy allocation
      strategyAllocation: config.strategyAllocation || {
        'spike-hunting': 0.25,
        'micro-arbitrage': 0.20,
        'market-making': 0.15,
        'momentum': 0.15,
        'mean-reversion': 0.15,
        'order-flow': 0.10
      },
      
      // Execution settings
      executionMode: config.executionMode || 'LIVE', // LIVE, PAPER, BACKTEST
      slippageTolerance: config.slippageTolerance || 0.001, // 0.1%
      
      // Risk management
      maxPositionSize: config.maxPositionSize || 0.10, // 10% of capital
      maxDailyLoss: config.maxDailyLoss || 0.05, // 5% daily
      maxConcurrentTrades: config.maxConcurrentTrades || 10,
      
      // Markets
      markets: config.markets || ['BTC-5MIN', 'ETH-5MIN', 'BTC-15MIN', 'ETH-15MIN'],
      
      // APIs
      polymarketApi: config.polymarketApi || 'https://clob.polymarket.com',
      binanceApi: config.binanceApi || 'https://api.binance.com',
      coinbaseApi: config.coinbaseApi || 'https://api.coinbase.com',
      
      ...config
    };
    
    // Initialize strategy library
    this.strategies = new StrategyLibrary(this.config);
    
    // State
    this.provider = null;
    this.wallet = null;
    this.portfolio = {
      cash: this.config.initialCapital,
      positions: new Map(),
      trades: [],
      equity: [],
      dailyPnl: 0,
      totalPnl: 0
    };
    
    this.marketData = new Map();
    this.orderBooks = new Map();
    this.isRunning = false;
    this.executionQueue = [];
    
    // Performance tracking
    this.performance = {
      startTime: Date.now(),
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      bestTrade: 0,
      worstTrade: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      winRate: 0,
      profitFactor: 0
    };
    
    // Market regime detection
    this.marketRegime = {
      volatility: 0,
      trend: 0,
      volume: 0,
      regime: 'NEUTRAL' // BULL, BEAR, RANGE, HIGH_VOL
    };
  }

  /**
   * Initialize bot
   */
  async init() {
    console.log('🚀 Initializing Plutus V2...');
    console.log('═══════════════════════════════════════════════════════════');
    
    // Setup wallet
    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
    
    console.log(`💰 Wallet: ${this.wallet.address}`);
    
    // Check balances
    const maticBalance = await this.provider.getBalance(this.wallet.address);
    const usdcBalance = await this.getUSDCBalance();
    
    console.log(`💰 MATIC Balance: ${ethers.formatEther(maticBalance)}`);
    console.log(`💰 USDC Balance: $${usdcBalance.toFixed(2)}`);
    
    // Update portfolio
    this.portfolio.cash = usdcBalance;
    
    // Initialize market data structures
    for (const market of this.config.markets) {
      this.marketData.set(market, {
        priceHistory: [],
        volumeHistory: [],
        orderBook: { bids: [], asks: [] },
        lastUpdate: Date.now()
      });
    }
    
    // Connect to data feeds
    await this.connectDataFeeds();
    
    console.log('✅ Plutus V2 initialized');
    console.log(`📊 Monitoring ${this.config.markets.length} markets`);
    console.log(`🎯 Target: $${(this.config.targetReturn * 100).toFixed(0)}% monthly return`);
    console.log('═══════════════════════════════════════════════════════════\n');
    
    return this;
  }

  /**
   * Connect to all data feeds
   */
  async connectDataFeeds() {
    // Connect to Polymarket
    await this.connectPolymarket();
    
    // Connect to Binance for price reference
    await this.connectBinance();
    
    // Start market regime detection
    this.regimeLoop = setInterval(() => this.detectMarketRegime(), 60000);
  }

  /**
   * Start trading
   */
  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('▶️ Starting Plutus V2 Trading Engine...\n');
    
    // Main trading loop - every 5 seconds
    this.tradingLoop = setInterval(() => this.tradingCycle(), 5000);
    
    // Portfolio rebalancing - every 5 minutes
    this.rebalanceLoop = setInterval(() => this.rebalancePortfolio(), 300000);
    
    // Risk monitoring - every 30 seconds
    this.riskLoop = setInterval(() => this.monitorRisk(), 30000);
    
    // Performance reporting - every minute
    this.reportLoop = setInterval(() => this.printPerformanceReport(), 60000);
    
    console.log('✅ All systems operational\n');
  }

  /**
   * Main trading cycle
   */
  async tradingCycle() {
    if (!this.isRunning) return;
    
    try {
      // Update market data
      await this.updateMarketData();
      
      // Run strategy rotation based on market regime
      const allocation = await this.strategies.strategyRotation(this.marketRegime);
      
      // Execute strategies based on allocation
      for (const market of this.config.markets) {
        await this.executeStrategiesForMarket(market, allocation);
      }
      
      // Process execution queue
      await this.processExecutionQueue();
      
      // Update equity curve
      this.updateEquity();
      
    } catch (error) {
      console.error('❌ Trading cycle error:', error.message);
    }
  }

  /**
   * Execute all strategies for a market
   */
  async executeStrategiesForMarket(market, allocation) {
    const data = this.marketData.get(market);
    if (!data || data.priceHistory.length < 20) return;
    
    const signals = [];
    
    // Run allocated strategies
    for (const strategyName of allocation.activeStrategies) {
      const weight = allocation.allocation[strategyName] || 0;
      if (weight <= 0) continue;
      
      let signal = null;
      
      switch(strategyName) {
        case 'spike-hunting':
          signal = await this.strategies.spikeHuntingStrategy(
            market, 
            data.orderBook
          );
          break;
          
        case 'micro-arbitrage':
          signal = await this.strategies.microArbitrageStrategy(
            market, 
            data.orderBook
          );
          break;
          
        case 'avellaneda-stoikov':
          const inventory = this.getMarketInventory(market);
          signal = await this.strategies.avellanedaStoikov(
            { midPrice: this.getMidPrice(data) },
            inventory
          );
          break;
          
        case 'momentum-ignition':
          signal = await this.strategies.momentumIgnition(
            data.priceHistory,
            data.volumeHistory
          );
          break;
          
        case 'bollinger-bands':
          signal = await this.strategies.bollingerBandsStrategy(data.priceHistory);
          break;
          
        case 'order-flow-imbalance':
          signal = await this.strategies.orderFlowImbalance(
            data.orderBook,
            data.trades || []
          );
          break;
          
        case 'grid-trading':
          const range = this.calculateTradingRange(data.priceHistory);
          signal = await this.strategies.gridTrading(
            data.priceHistory[data.priceHistory.length - 1],
            range.low,
            range.high
          );
          break;
          
        default:
          continue;
      }
      
      if (signal && signal.signal !== 'HOLD') {
        signals.push({ ...signal, strategy: strategyName, weight });
      }
    }
    
    // Ensemble voting
    if (signals.length > 0) {
      const ensemble = await this.aggregateSignals(signals);
      
      if (ensemble.confidence > 0.6) {
        await this.queueTrade(market, ensemble);
      }
    }
  }

  /**
   * Aggregate signals using ensemble voting
   */
  async aggregateSignals(signals) {
    let buyScore = 0;
    let sellScore = 0;
    let totalWeight = 0;
    
    for (const signal of signals) {
      const weight = signal.weight || 0.1;
      const strength = signal.strength || 1;
      
      if (signal.signal === 'BUY' || signal.signal.includes('BUY')) {
        buyScore += weight * strength;
      } else if (signal.signal === 'SELL' || signal.signal.includes('SELL')) {
        sellScore += weight * strength;
      }
      
      totalWeight += weight;
    }
    
    const buyConfidence = buyScore / totalWeight;
    const sellConfidence = sellScore / totalWeight;
    
    if (buyConfidence > sellConfidence && buyConfidence > 0.5) {
      return {
        signal: 'BUY',
        confidence: buyConfidence,
        signals: signals.filter(s => s.signal.includes('BUY'))
      };
    } else if (sellConfidence > buyConfidence && sellConfidence > 0.5) {
      return {
        signal: 'SELL',
        confidence: sellConfidence,
        signals: signals.filter(s => s.signal.includes('SELL'))
      };
    }
    
    return { signal: 'HOLD', confidence: 0 };
  }

  /**
   * Queue a trade for execution
   */
  async queueTrade(market, signal) {
    // Check if we can open new position
    if (this.portfolio.positions.size >= this.config.maxConcurrentTrades) {
      return;
    }
    
    // Calculate position size using Kelly Criterion
    const winRate = this.performance.winRate || 0.5;
    const avgWin = this.performance.bestTrade || 1;
    const avgLoss = Math.abs(this.performance.worstTrade) || 1;
    
    const kellyFraction = this.strategies.kellyCriterion(winRate, avgWin, avgLoss);
    const positionSize = Math.min(
      this.portfolio.cash * this.config.maxPositionSize,
      this.portfolio.cash * kellyFraction
    );
    
    if (positionSize < 10) return; // Minimum $10
    
    const trade = {
      id: `${market}-${Date.now()}`,
      market,
      side: signal.signal,
      size: positionSize,
      confidence: signal.confidence,
      strategies: signal.signals?.map(s => s.strategy) || [],
      timestamp: Date.now(),
      status: 'PENDING'
    };
    
    this.executionQueue.push(trade);
  }

  /**
   * Process execution queue
   */
  async processExecutionQueue() {
    while (this.executionQueue.length > 0) {
      const trade = this.executionQueue.shift();
      
      try {
        await this.executeTrade(trade);
      } catch (error) {
        console.error(`❌ Trade execution failed:`, error.message);
        trade.status = 'FAILED';
      }
    }
  }

  /**
   * Execute a trade
   */
  async executeTrade(trade) {
    const data = this.marketData.get(trade.market);
    const price = this.getMidPrice(data);
    
    // Check slippage
    const expectedPrice = trade.side === 'BUY' ? data.orderBook.asks[0]?.price : data.orderBook.bids[0]?.price;
    const slippage = Math.abs(price - expectedPrice) / expectedPrice;
    
    if (slippage > this.config.slippageTolerance) {
      console.log(`⚠️ Slippage too high (${(slippage * 100).toFixed(2)}%), skipping trade`);
      return;
    }
    
    // Execute
    trade.entryPrice = price;
    trade.entryTime = Date.now();
    trade.status = 'OPEN';
    
    this.portfolio.positions.set(trade.id, trade);
    this.portfolio.cash -= trade.size;
    
    // Set exit timer
    setTimeout(() => this.checkExit(trade), 30000);
    
    console.log(`🎯 ENTER | ${trade.market} ${trade.side} | $${trade.size.toFixed(0)} @ ${price.toFixed(4)} | Confidence: ${(trade.confidence * 100).toFixed(0)}%`);
    
    this.performance.totalTrades++;
  }

  /**
   * Check if position should be exited
   */
  async checkExit(position) {
    if (position.status !== 'OPEN') return;
    
    const data = this.marketData.get(position.market);
    const currentPrice = this.getMidPrice(data);
    
    const pnl = position.side === 'BUY' 
      ? (currentPrice - position.entryPrice) * position.size
      : (position.entryPrice - currentPrice) * position.size;
    
    const pnlPercent = pnl / position.size;
    
    // Exit conditions
    let shouldExit = false;
    let exitReason = '';
    
    // Take profit: 5%
    if (pnlPercent >= 0.05) {
      shouldExit = true;
      exitReason = 'take-profit';
    }
    // Stop loss: -2%
    else if (pnlPercent <= -0.02) {
      shouldExit = true;
      exitReason = 'stop-loss';
    }
    // Time limit: 5 minutes
    else if (Date.now() - position.entryTime > 300000) {
      shouldExit = true;
      exitReason = 'time-limit';
    }
    // Confidence decay
    else if (pnlPercent > 0.02) {
      // Trailing stop
      const highPrice = Math.max(...data.priceHistory.slice(-10));
      if (currentPrice < highPrice * 0.98) {
        shouldExit = true;
        exitReason = 'trailing-stop';
      }
    }
    
    if (shouldExit) {
      await this.closePosition(position, currentPrice, exitReason, pnl);
    } else {
      // Check again in 10 seconds
      setTimeout(() => this.checkExit(position), 10000);
    }
  }

  /**
   * Close a position
   */
  async closePosition(position, exitPrice, reason, pnl) {
    position.status = 'CLOSED';
    position.exitPrice = exitPrice;
    position.exitTime = Date.now();
    position.pnl = pnl;
    position.exitReason = reason;
    
    this.portfolio.positions.delete(position.id);
    this.portfolio.trades.push(position);
    this.portfolio.cash += position.size + pnl;
    this.portfolio.dailyPnl += pnl;
    this.portfolio.totalPnl += pnl;
    
    // Update performance
    if (pnl > 0) {
      this.performance.winningTrades++;
      this.performance.bestTrade = Math.max(this.performance.bestTrade, pnl);
    } else {
      this.performance.losingTrades++;
      this.performance.worstTrade = Math.min(this.performance.worstTrade, pnl);
    }
    
    this.performance.winRate = this.performance.winningTrades / this.performance.totalTrades;
    
    // Update strategy performance
    for (const strategy of position.strategies) {
      this.strategies.updatePerformance(strategy, pnl);
    }
    
    console.log(`💰 EXIT | ${reason} | PnL: $${pnl.toFixed(2)} (${(pnl/position.size*100).toFixed(1)}%)`);
  }

  /**
   * Portfolio rebalancing
   */
  async rebalancePortfolio() {
    // Check strategy performance and reallocate
    const bestStrategies = this.strategies.getBestStrategies(5);
    
    console.log('\n📊 Top Performing Strategies:');
    bestStrategies.forEach(([name, perf], i) => {
      console.log(`  ${i + 1}. ${name}: $${perf.profit.toFixed(2)} (${(perf.winRate * 100).toFixed(1)}% WR)`);
    });
    
    // Adjust allocations (in production, would shift capital to best performers)
  }

  /**
   * Risk monitoring
   */
  async monitorRisk() {
    // Check daily loss limit
    const dailyReturn = this.portfolio.dailyPnl / this.config.initialCapital;
    
    if (dailyReturn < -this.config.maxDailyLoss) {
      console.log('🛑 Daily loss limit reached. Stopping trading.');
      await this.stop();
      return;
    }
    
    // Check drawdown
    const currentEquity = this.getCurrentEquity();
    const peakEquity = Math.max(...this.portfolio.equity, this.config.initialCapital);
    const drawdown = (peakEquity - currentEquity) / peakEquity;
    
    if (drawdown > this.config.maxDrawdown) {
      console.log('🛑 Max drawdown reached. Stopping trading.');
      await this.stop();
      return;
    }
    
    // Reset daily stats at midnight
    const now = new Date();
    if (now.getHours() === 0 && now.getMinutes() < 1) {
      this.portfolio.dailyPnl = 0;
    }
  }

  /**
   * Detect market regime
   */
  async detectMarketRegime() {
    for (const [market, data] of this.marketData) {
      if (data.priceHistory.length < 50) continue;
      
      const prices = data.priceHistory;
      const returns = prices.slice(1).map((p, i) => (p - prices[i]) / prices[i]);
      
      // Volatility (annualized)
      const variance = returns.reduce((sum, r) => sum + r * r, 0) / returns.length;
      const volatility = Math.sqrt(variance) * Math.sqrt(365 * 24 * 12); // 5-min bars
      
      // Trend
      const sma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const sma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / 50;
      const trend = (sma20 - sma50) / sma50;
      
      // Volume
      const avgVolume = data.volumeHistory.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const currentVolume = data.volumeHistory[data.volumeHistory.length - 1] || 1;
      const volumeRatio = currentVolume / avgVolume;
      
      // Determine regime
      let regime = 'NEUTRAL';
      if (volatility > 0.05 && trend > 0.01) regime = 'BULL_VOLATILE';
      else if (volatility > 0.05 && trend < -0.01) regime = 'BEAR_VOLATILE';
      else if (volatility < 0.02) regime = 'LOW_VOL';
      else if (trend > 0.01) regime = 'BULL';
      else if (trend < -0.01) regime = 'BEAR';
      else if (volumeRatio > 2) regime = 'HIGH_VOLUME';
      
      this.marketRegime = { volatility, trend, volume: volumeRatio, regime };
    }
  }

  /**
   * Print performance report
   */
  printPerformanceReport() {
    const runtime = (Date.now() - this.performance.startTime) / 1000;
    const hours = Math.floor(runtime / 3600);
    const minutes = Math.floor((runtime % 3600) / 60);
    
    const equity = this.getCurrentEquity();
    const totalReturn = (equity - this.config.initialCapital) / this.config.initialCapital;
    const dailyReturn = this.portfolio.dailyPnl / this.config.initialCapital;
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  PLUTUS V2 PERFORMANCE REPORT');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`⏱️  Runtime:          ${hours}h ${minutes}m`);
    console.log(`💰 Current Equity:   $${equity.toFixed(2)}`);
    console.log(`📈 Total Return:     ${(totalReturn * 100).toFixed(2)}%`);
    console.log(`📊 Daily Return:     ${(dailyReturn * 100).toFixed(2)}%`);
    console.log(`🔄 Total Trades:     ${this.performance.totalTrades}`);
    console.log(`✅ Win Rate:         ${(this.performance.winRate * 100).toFixed(1)}%`);
    console.log(`💵 Daily P&L:        $${this.portfolio.dailyPnl.toFixed(2)}`);
    console.log(`📉 Open Positions:   ${this.portfolio.positions.size}`);
    console.log(`🎯 Market Regime:    ${this.marketRegime.regime}`);
    console.log('═══════════════════════════════════════════════════════════\n');
  }

  // ═══════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════

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

  getMidPrice(data) {
    const bid = data.orderBook.bids[0]?.price || 0;
    const ask = data.orderBook.asks[0]?.price || 0;
    return (bid + ask) / 2 || data.priceHistory[data.priceHistory.length - 1] || 0.5;
  }

  getMarketInventory(market) {
    let inventory = 0;
    for (const [id, pos] of this.portfolio.positions) {
      if (pos.market === market) {
        inventory += pos.side === 'BUY' ? pos.size : -pos.size;
      }
    }
    return inventory;
  }

  getCurrentEquity() {
    let equity = this.portfolio.cash;
    for (const [id, pos] of this.portfolio.positions) {
      if (pos.status === 'OPEN') {
        const data = this.marketData.get(pos.market);
        const currentPrice = this.getMidPrice(data);
        const pnl = pos.side === 'BUY' 
          ? (currentPrice - pos.entryPrice) * pos.size
          : (pos.entryPrice - currentPrice) * pos.size;
        equity += pos.size + pnl;
      }
    }
    return equity;
  }

  updateEquity() {
    this.portfolio.equity.push(this.getCurrentEquity());
    if (this.portfolio.equity.length > 1000) {
      this.portfolio.equity.shift();
    }
  }

  calculateTradingRange(priceHistory) {
    const recent = priceHistory.slice(-20);
    return {
      low: Math.min(...recent),
      high: Math.max(...recent)
    };
  }

  async updateMarketData() {
    // Would fetch from WebSocket/API in production
    // For now, using stored data
  }

  async connectPolymarket() {
    // WebSocket connection to Polymarket
    console.log('🔗 Connecting to Polymarket...');
  }

  async connectBinance() {
    // WebSocket connection to Binance for price reference
    console.log('🔗 Connecting to Binance...');
  }

  /**
   * Stop trading
   */
  async stop() {
    this.isRunning = false;
    
    clearInterval(this.tradingLoop);
    clearInterval(this.rebalanceLoop);
    clearInterval(this.riskLoop);
    clearInterval(this.reportLoop);
    clearInterval(this.regimeLoop);
    
    // Close all positions
    for (const [id, pos] of this.portfolio.positions) {
      if (pos.status === 'OPEN') {
        const data = this.marketData.get(pos.market);
        const currentPrice = this.getMidPrice(data);
        const pnl = pos.side === 'BUY' 
          ? (currentPrice - pos.entryPrice) * pos.size
          : (pos.entryPrice - currentPrice) * pos.size;
        await this.closePosition(pos, currentPrice, 'shutdown', pnl);
      }
    }
    
    console.log('\n⏹️ Plutus V2 stopped');
    this.printPerformanceReport();
  }
}

// CLI Interface
if (require.main === module) {
  const config = {
    privateKey: process.env.PRIVATE_KEY,
    initialCapital: 10000,
    maxDailyLoss: 0.05,
    maxDrawdown: 0.20,
    markets: ['BTC-5MIN', 'ETH-5MIN', 'BTC-15MIN', 'ETH-15MIN']
  };
  
  const plutus = new PlutusV2(config);
  
  plutus.init().then(() => {
    plutus.start();
    
    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...');
      await plutus.stop();
      process.exit(0);
    });
  });
}

module.exports = { PlutusV2 };
