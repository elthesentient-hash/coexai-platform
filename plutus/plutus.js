/**
 * PLUTUS - Polymarket Trading Bot
 * 
 * High-frequency trading bot for Polymarket prediction markets
 * Implements: Spike hunting, Micro-arbitrage, Copy-trading
 * 
 * Based on strategies from:
 * - Kirill's bot: $142K/week (price lag exploitation)
 * - Phantom's bot: $5-10K/day (micro-arbitrage)
 * - Discover's bot: $500K total (structural arbitrage)
 * - Ventry's bot: $11.4K (spike hunting)
 */

const axios = require('axios');
const WebSocket = require('ws');
const { ethers } = require('ethers');

class Plutus {
  constructor(config = {}) {
    this.config = {
      // Wallet
      privateKey: config.privateKey || process.env.PRIVATE_KEY,
      rpcUrl: config.rpcUrl || process.env.RPC_URL || 'https://polygon-rpc.com',
      
      // Trading parameters
      markets: config.markets || ['BTC-5MIN', 'ETH-5MIN', 'BTC-15MIN', 'ETH-15MIN'],
      maxPositionSize: config.maxPositionSize || 100, // USDC
      minProfitThreshold: config.minProfitThreshold || 0.02, // 2%
      
      // Strategies
      strategies: {
        spikeHunting: config.spikeHunting !== false,
        microArbitrage: config.microArbitrage !== false,
        copyTrading: config.copyTrading !== false
      },
      
      // Risk management
      maxDailyLoss: config.maxDailyLoss || 500, // USDC
      maxConcurrentPositions: config.maxConcurrentPositions || 5,
      stopLossPercent: config.stopLossPercent || 5,
      
      // Copy trading
      whaleWallets: config.whaleWallets || [],
      
      // API
      polymarketApi: config.polymarketApi || 'https://clob.polymarket.com',
      
      ...config
    };
    
    // State
    this.provider = null;
    this.wallet = null;
    this.positions = new Map();
    this.trades = [];
    this.dailyStats = {
      profit: 0,
      loss: 0,
      trades: 0,
      startTime: Date.now()
    };
    this.isRunning = false;
    this.wsConnections = new Map();
    
    // Performance tracking
    this.performance = {
      totalProfit: 0,
      totalTrades: 0,
      winRate: 0,
      avgReturn: 0,
      bestTrade: 0,
      worstTrade: 0
    };
    
    // Market data
    this.orderBooks = new Map();
    this.priceHistory = new Map();
    this.whaleActivity = new Map();
  }

  /**
   * Initialize bot
   */
  async init() {
    console.log('🚀 Initializing Plutus...');
    
    // Setup wallet
    this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
    this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
    
    const balance = await this.provider.getBalance(this.wallet.address);
    console.log(`💰 Wallet: ${this.wallet.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(balance)} MATIC`);
    
    // Get USDC balance
    const usdcBalance = await this.getUSDCBalance();
    console.log(`💰 USDC Balance: $${usdcBalance}`);
    
    // Initialize market data structures
    for (const market of this.config.markets) {
      this.orderBooks.set(market, { yes: [], no: [] });
      this.priceHistory.set(market, []);
    }
    
    console.log('✅ Plutus initialized');
    return this;
  }

  /**
   * Start trading
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️ Bot already running');
      return;
    }
    
    this.isRunning = true;
    console.log('▶️ Starting Plutus trading...');
    
    // Start WebSocket connections for real-time data
    await this.connectToMarkets();
    
    // Start main trading loop
    this.tradingLoop = setInterval(() => this.executeStrategies(), 1000);
    
    // Start risk management checks
    this.riskLoop = setInterval(() => this.checkRiskLimits(), 5000);
    
    // Start whale tracking (if copy trading enabled)
    if (this.config.strategies.copyTrading) {
      this.whaleLoop = setInterval(() => this.trackWhales(), 3000);
    }
    
    console.log('✅ Plutus is live and trading');
  }

  /**
   * Stop trading
   */
  async stop() {
    this.isRunning = false;
    
    clearInterval(this.tradingLoop);
    clearInterval(this.riskLoop);
    if (this.whaleLoop) clearInterval(this.whaleLoop);
    
    // Close WebSocket connections
    for (const [market, ws] of this.wsConnections) {
      ws.close();
    }
    
    console.log('⏹️ Plutus stopped');
    console.log(this.getPerformanceReport());
  }

  /**
   * Connect to Polymarket WebSocket for real-time order book data
   */
  async connectToMarkets() {
    for (const market of this.config.markets) {
      try {
        const ws = new WebSocket(`${this.config.polymarketApi}/ws/market/${market}`);
        
        ws.on('open', () => {
          console.log(`🔌 Connected to ${market}`);
          ws.send(JSON.stringify({ type: 'subscribe', channel: 'orderbook' }));
        });
        
        ws.on('message', (data) => {
          const message = JSON.parse(data);
          this.handleMarketData(market, message);
        });
        
        ws.on('error', (error) => {
          console.error(`❌ ${market} WebSocket error:`, error.message);
        });
        
        this.wsConnections.set(market, ws);
      } catch (error) {
        console.error(`❌ Failed to connect to ${market}:`, error.message);
      }
    }
  }

  /**
   * Handle incoming market data
   */
  handleMarketData(market, data) {
    if (data.type === 'orderbook') {
      this.orderBooks.set(market, {
        yes: data.yes || [],
        no: data.no || [],
        timestamp: Date.now()
      });
      
      // Store price history
      const history = this.priceHistory.get(market);
      history.push({
        yesPrice: data.yes?.[0]?.price || 0,
        noPrice: data.no?.[0]?.price || 0,
        timestamp: Date.now()
      });
      
      // Keep last 1000 data points
      if (history.length > 1000) {
        history.shift();
      }
    }
  }

  /**
   * Execute all enabled strategies
   */
  async executeStrategies() {
    if (!this.isRunning) return;
    
    for (const market of this.config.markets) {
      const orderBook = this.orderBooks.get(market);
      if (!orderBook || !orderBook.yes?.length) continue;
      
      // Check if we can open new position
      if (this.positions.size >= this.config.maxConcurrentPositions) {
        continue;
      }
      
      // Strategy 1: Spike Hunting
      if (this.config.strategies.spikeHunting) {
        await this.spikeHuntingStrategy(market, orderBook);
      }
      
      // Strategy 2: Micro-Arbitrage (YES + NO < $1)
      if (this.config.strategies.microArbitrage) {
        await this.microArbitrageStrategy(market, orderBook);
      }
    }
  }

  /**
   * SPIKE HUNTING STRATEGY
   * Enters before large orders, exits when price spikes
   * Based on Ventry's winning bot
   */
  async spikeHuntingStrategy(market, orderBook) {
    const yesOrders = orderBook.yes;
    const noOrders = orderBook.no;
    
    if (!yesOrders.length || !noOrders.length) return;
    
    // Detect large orders in order book (whale activity)
    const largeYesOrder = yesOrders.find(o => o.size > 5000); // > $5000
    const largeNoOrder = noOrders.find(o => o.size > 5000);
    
    if (largeYesOrder && !this.positions.has(`${market}-YES`)) {
      // Large YES order coming - price will spike up
      const entryPrice = parseFloat(yesOrders[0].price);
      
      if (entryPrice < 0.95) { // Don't buy if already too high
        await this.enterPosition(market, 'YES', entryPrice, 'spike-hunting');
      }
    }
    
    if (largeNoOrder && !this.positions.has(`${market}-NO`)) {
      // Large NO order coming - price will spike down
      const entryPrice = parseFloat(noOrders[0].price);
      
      if (entryPrice < 0.95) {
        await this.enterPosition(market, 'NO', entryPrice, 'spike-hunting');
      }
    }
  }

  /**
   * MICRO-ARBITRAGE STRATEGY
   * Exploits when YES + NO < $1
   * Based on Discover's $500K strategy
   */
  async microArbitrageStrategy(market, orderBook) {
    const yesPrice = parseFloat(orderBook.yes[0]?.price || 0);
    const noPrice = parseFloat(orderBook.no[0]?.price || 0);
    
    if (yesPrice === 0 || noPrice === 0) return;
    
    const combinedPrice = yesPrice + noPrice;
    
    // If YES + NO < 1.0, there's an arbitrage opportunity
    if (combinedPrice < 0.995) {
      const profitMargin = 1.0 - combinedPrice;
      
      if (profitMargin > this.config.minProfitThreshold) {
        console.log(`💎 Arbitrage found: ${market} | YES: ${yesPrice} | NO: ${noPrice} | Profit: ${(profitMargin * 100).toFixed(2)}%`);
        
        // Buy both YES and NO - guaranteed profit
        if (!this.positions.has(`${market}-YES`)) {
          await this.enterPosition(market, 'YES', yesPrice, 'arbitrage');
        }
        if (!this.positions.has(`${market}-NO`)) {
          await this.enterPosition(market, 'NO', noPrice, 'arbitrage');
        }
      }
    }
  }

  /**
   * COPY TRADING STRATEGY
   * Tracks whale wallets and copies their trades
   * Based on Ventry's Bot 1 ($1K → $6.8K)
   */
  async trackWhales() {
    for (const whaleWallet of this.config.whaleWallets) {
      try {
        const recentTrades = await this.getWalletTrades(whaleWallet, 10);
        
        for (const trade of recentTrades) {
          // Check if we already copied this trade
          const tradeId = `${whaleWallet}-${trade.timestamp}`;
          if (this.whaleActivity.has(tradeId)) continue;
          
          this.whaleActivity.set(tradeId, trade);
          
          // Copy the trade if profitable whale
          const whaleWinRate = await this.getWhaleWinRate(whaleWallet);
          if (whaleWinRate > 0.65) { // Only copy if whale wins >65%
            console.log(`🐋 Copying whale ${whaleWallet.substring(0, 8)}... | ${trade.market} | ${trade.side}`);
            await this.enterPosition(trade.market, trade.side, trade.price, 'copy-trading');
          }
        }
      } catch (error) {
        console.error(`❌ Whale tracking error:`, error.message);
      }
    }
  }

  /**
   * Enter a trading position
   */
  async enterPosition(market, side, price, strategy) {
    const positionId = `${market}-${side}`;
    
    if (this.positions.has(positionId)) {
      return;
    }
    
    // Check daily loss limit
    if (this.dailyStats.loss >= this.config.maxDailyLoss) {
      console.log('⚠️ Daily loss limit reached');
      return;
    }
    
    const size = Math.min(
      this.config.maxPositionSize,
      await this.getUSDCBalance() * 0.2 // Max 20% of balance per trade
    );
    
    if (size < 10) { // Minimum $10 trade
      console.log('⚠️ Insufficient balance');
      return;
    }
    
    const position = {
      id: positionId,
      market,
      side,
      entryPrice: price,
      size,
      strategy,
      entryTime: Date.now(),
      status: 'open'
    };
    
    this.positions.set(positionId, position);
    
    console.log(`🎯 ENTER | ${strategy} | ${market} ${side} | $${size} @ ${price}`);
    
    // Execute trade on Polymarket
    await this.executeTrade(market, side, size, price);
  }

  /**
   * Execute trade on Polymarket
   */
  async executeTrade(market, side, size, price) {
    try {
      // This would integrate with Polymarket's CLOB API
      // For now, simulating the trade
      
      const trade = {
        market,
        side,
        size,
        price,
        timestamp: Date.now(),
        status: 'filled'
      };
      
      this.trades.push(trade);
      this.dailyStats.trades++;
      
      // Set exit timer based on strategy
      if (side === 'YES' || side === 'NO') {
        setTimeout(() => this.checkExit(position), 30000); // Check after 30s
      }
      
    } catch (error) {
      console.error(`❌ Trade execution failed:`, error.message);
    }
  }

  /**
   * Check if position should be exited
   */
  async checkExit(position) {
    const orderBook = this.orderBooks.get(position.market);
    if (!orderBook) return;
    
    const currentPrice = position.side === 'YES' 
      ? parseFloat(orderBook.yes[0]?.price || 0)
      : parseFloat(orderBook.no[0]?.price || 0);
    
    if (currentPrice === 0) return;
    
    const pnl = (currentPrice - position.entryPrice) * position.size;
    const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;
    
    // Exit conditions
    let shouldExit = false;
    let exitReason = '';
    
    // Take profit: 5% gain
    if (pnlPercent >= 5) {
      shouldExit = true;
      exitReason = 'take-profit';
    }
    // Stop loss: -3%
    else if (pnlPercent <= -3) {
      shouldExit = true;
      exitReason = 'stop-loss';
    }
    // Arbitrage: position resolved
    else if (position.strategy === 'arbitrage' && Math.abs(pnl) > position.size * 0.02) {
      shouldExit = true;
      exitReason = 'arbitrage-complete';
    }
    // Time limit: 5 minutes for short-term trades
    else if (Date.now() - position.entryTime > 300000) {
      shouldExit = true;
      exitReason = 'time-limit';
    }
    
    if (shouldExit) {
      await this.exitPosition(position, currentPrice, exitReason, pnl);
    } else {
      // Check again in 10 seconds
      setTimeout(() => this.checkExit(position), 10000);
    }
  }

  /**
   * Exit a position
   */
  async exitPosition(position, exitPrice, reason, pnl) {
    position.status = 'closed';
    position.exitPrice = exitPrice;
    position.exitTime = Date.now();
    position.pnl = pnl;
    position.exitReason = reason;
    
    this.positions.delete(position.id);
    
    // Update stats
    if (pnl > 0) {
      this.dailyStats.profit += pnl;
      this.performance.totalProfit += pnl;
      this.performance.bestTrade = Math.max(this.performance.bestTrade, pnl);
    } else {
      this.dailyStats.loss += Math.abs(pnl);
      this.performance.worstTrade = Math.min(this.performance.worstTrade, pnl);
    }
    
    this.performance.totalTrades++;
    
    // Update win rate
    const winningTrades = this.trades.filter(t => t.pnl > 0).length;
    this.performance.winRate = (winningTrades / this.trades.length) * 100;
    
    console.log(`💰 EXIT | ${position.strategy} | ${reason} | PnL: $${pnl.toFixed(2)}`);
  }

  /**
   * Risk management checks
   */
  async checkRiskLimits() {
    // Check daily loss
    if (this.dailyStats.loss >= this.config.maxDailyLoss) {
      console.log('🛑 Daily loss limit reached. Stopping trading.');
      await this.stop();
      return;
    }
    
    // Reset daily stats at midnight
    const now = Date.now();
    const dayStart = new Date().setHours(0, 0, 0, 0);
    if (this.dailyStats.startTime < dayStart) {
      this.dailyStats = {
        profit: 0,
        loss: 0,
        trades: 0,
        startTime: now
      };
    }
  }

  /**
   * Get USDC balance
   */
  async getUSDCBalance() {
    // USDC contract on Polygon
    const usdcContract = new ethers.Contract(
      '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      ['function balanceOf(address) view returns (uint256)'],
      this.provider
    );
    
    const balance = await usdcContract.balanceOf(this.wallet.address);
    return parseFloat(ethers.formatUnits(balance, 6));
  }

  /**
   * Get wallet's recent trades
   */
  async getWalletTrades(wallet, limit = 10) {
    // This would query Polymarket's API
    // Simulating for now
    return [];
  }

  /**
   * Get whale's win rate
   */
  async getWhaleWinRate(wallet) {
    // This would analyze whale's trade history
    // Simulating 70% for now
    return 0.70;
  }

  /**
   * Get performance report
   */
  getPerformanceReport() {
    const runtime = Date.now() - this.dailyStats.startTime;
    const hours = Math.floor(runtime / 3600000);
    const minutes = Math.floor((runtime % 3600000) / 60000);
    
    return {
      runtime: `${hours}h ${minutes}m`,
      dailyProfit: this.dailyStats.profit.toFixed(2),
      dailyLoss: this.dailyStats.loss.toFixed(2),
      dailyNet: (this.dailyStats.profit - this.dailyStats.loss).toFixed(2),
      dailyTrades: this.dailyStats.trades,
      totalProfit: this.performance.totalProfit.toFixed(2),
      totalTrades: this.performance.totalTrades,
      winRate: this.performance.winRate.toFixed(1) + '%',
      openPositions: this.positions.size,
      bestTrade: this.performance.bestTrade.toFixed(2),
      worstTrade: this.performance.worstTrade.toFixed(2)
    };
  }

  /**
   * Print current status
   */
  printStatus() {
    const report = this.getPerformanceReport();
    console.log('\n📊 PLUTUS STATUS');
    console.log('═══════════════════════════════════════');
    console.log(`⏱️  Runtime:        ${report.runtime}`);
    console.log(`💰 Daily P&L:      $${report.dailyNet}`);
    console.log(`📈 Daily Profit:   $${report.dailyProfit}`);
    console.log(`📉 Daily Loss:     $${report.dailyLoss}`);
    console.log(`🔄 Trades Today:   ${report.dailyTrades}`);
    console.log(`🎯 Win Rate:       ${report.winRate}`);
    console.log(`📊 Open Positions: ${report.openPositions}`);
    console.log('═══════════════════════════════════════\n');
  }
}

// CLI Interface
if (require.main === module) {
  const config = {
    privateKey: process.env.PRIVATE_KEY,
    markets: ['BTC-5MIN', 'ETH-5MIN'],
    strategies: {
      spikeHunting: true,
      microArbitrage: true,
      copyTrading: false
    },
    maxPositionSize: 100,
    maxDailyLoss: 500
  };
  
  const plutus = new Plutus(config);
  
  plutus.init().then(() => {
    plutus.start();
    
    // Print status every minute
    setInterval(() => plutus.printStatus(), 60000);
    
    // Handle shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...');
      await plutus.stop();
      process.exit(0);
    });
  });
}

module.exports = { Plutus };
