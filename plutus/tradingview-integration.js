/**
 * TRADINGVIEW INTEGRATION MODULE
 * 
 * Fetches technical indicators, price data, and signals from TradingView
 * For all Polymarket crypto markets
 */

const axios = require('axios');
const WebSocket = require('ws');
const { TRADINGVIEW_SYMBOLS, getTradingViewSymbol } = require('./polymarket-markets');

class TradingViewIntegration {
  constructor(config = {}) {
    this.config = {
      // TradingView endpoints
      tvDataUrl: config.tvDataUrl || 'https://www.tradingview.com/tv_js/datafeed.js',
      tvApiUrl: config.tvApiUrl || 'https://www.tradingview.com/api/v1',
      tvChartUrl: config.tvChartUrl || 'https://www.tradingview.com/chart',
      
      // Polling intervals
      priceUpdateInterval: config.priceUpdateInterval || 5000, // 5 seconds
      indicatorUpdateInterval: config.indicatorUpdateInterval || 30000, // 30 seconds
      
      // Technical analysis settings
      defaultTimeframe: config.defaultTimeframe || '5M',
      defaultLookback: config.defaultLookback || 100,
      
      ...config
    };
    
    // State
    this.priceData = new Map();
    this.indicators = new Map();
    this.signals = new Map();
    this.wsConnections = new Map();
    
    // Technical indicator cache
    this.indicatorCache = new Map();
    
    // Signal callbacks
    this.signalCallbacks = [];
  }

  /**
   * Initialize TradingView connections
   */
  async init() {
    console.log('📈 Initializing TradingView integration...');
    
    // Initialize data structures for all crypto assets
    for (const [asset, symbols] of Object.entries(TRADINGVIEW_SYMBOLS)) {
      this.priceData.set(asset, {
        spot: null,
        perp: null,
        timestamp: null,
        history: []
      });
      
      this.indicators.set(asset, {
        rsi: null,
        macd: null,
        bollinger: null,
        ema: null,
        sma: null,
        volume: null,
        atr: null,
        updatedAt: null
      });
      
      this.signals.set(asset, {
        trend: 'NEUTRAL',
        strength: 0,
        signals: [],
        lastUpdate: null
      });
    }
    
    // Start price polling
    this.startPricePolling();
    
    // Start indicator calculation
    this.startIndicatorCalculation();
    
    console.log('✅ TradingView integration ready');
    return this;
  }

  /**
   * Fetch real-time price from Binance (primary data source)
   */
  async fetchPrice(asset, type = 'spot') {
    try {
      const symbol = asset + (type === 'perp' ? 'USD_PERP' : 'USDT');
      const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`, {
        timeout: 5000
      });
      
      return {
        price: parseFloat(response.data.price),
        timestamp: Date.now(),
        source: 'binance'
      };
    } catch (error) {
      console.error(`❌ Failed to fetch ${asset} price:`, error.message);
      return null;
    }
  }

  /**
   * Fetch order book depth
   */
  async fetchOrderBook(asset, type = 'spot', limit = 100) {
    try {
      const symbol = asset + (type === 'perp' ? 'USD_PERP' : 'USDT');
      const response = await axios.get(`https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`, {
        timeout: 5000
      });
      
      return {
        bids: response.data.bids.map(b => ({ price: parseFloat(b[0]), size: parseFloat(b[1]) })),
        asks: response.data.asks.map(a => ({ price: parseFloat(a[0]), size: parseFloat(a[1]) })),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error(`❌ Failed to fetch ${asset} order book:`, error.message);
      return null;
    }
  }

  /**
   * Fetch historical klines/candles
   */
  async fetchKlines(asset, interval = '5m', limit = 100, type = 'spot') {
    try {
      const symbol = asset + (type === 'perp' ? 'USD_PERP' : 'USDT');
      const response = await axios.get(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`,
        { timeout: 10000 }
      );
      
      // Binance kline format: [time, open, high, low, close, volume, ...]
      return response.data.map(k => ({
        timestamp: k[0],
        open: parseFloat(k[1]),
        high: parseFloat(k[2]),
        low: parseFloat(k[3]),
        close: parseFloat(k[4]),
        volume: parseFloat(k[5]),
        quoteVolume: parseFloat(k[7])
      }));
    } catch (error) {
      console.error(`❌ Failed to fetch ${asset} klines:`, error.message);
      return [];
    }
  }

  /**
   * Calculate RSI (Relative Strength Index)
   */
  calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null;
    
    const changes = prices.slice(1).map((p, i) => p - prices[i]);
    
    let gains = 0;
    let losses = 0;
    
    // Initial average
    for (let i = 0; i < period; i++) {
      if (changes[i] > 0) gains += changes[i];
      else losses += Math.abs(changes[i]);
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;
    
    // Calculate RSI
    const rsiValues = [];
    
    for (let i = period; i < changes.length; i++) {
      const change = changes[i];
      const gain = change > 0 ? change : 0;
      const loss = change < 0 ? Math.abs(change) : 0;
      
      avgGain = ((avgGain * (period - 1)) + gain) / period;
      avgLoss = ((avgLoss * (period - 1)) + loss) / period;
      
      const rs = avgGain / (avgLoss || 0.001);
      const rsi = 100 - (100 / (1 + rs));
      
      rsiValues.push(rsi);
    }
    
    return {
      current: rsiValues[rsiValues.length - 1],
      values: rsiValues,
      period,
      overbought: 70,
      oversold: 30
    };
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   */
  calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
    if (prices.length < slow + signal) return null;
    
    const ema = (data, period) => {
      const k = 2 / (period + 1);
      const emaValues = [data[0]];
      
      for (let i = 1; i < data.length; i++) {
        emaValues.push(data[i] * k + emaValues[i - 1] * (1 - k));
      }
      
      return emaValues;
    };
    
    const fastEMA = ema(prices, fast);
    const slowEMA = ema(prices, slow);
    
    const macdLine = fastEMA.slice(slow - 1).map((f, i) => f - slowEMA[i]);
    const signalLine = ema(macdLine, signal);
    const histogram = macdLine.slice(signal - 1).map((m, i) => m - signalLine[i]);
    
    const currentMACD = macdLine[macdLine.length - 1];
    const currentSignal = signalLine[signalLine.length - 1];
    const currentHistogram = histogram[histogram.length - 1];
    
    return {
      macd: currentMACD,
      signal: currentSignal,
      histogram: currentHistogram,
      trend: currentMACD > currentSignal ? 'BULLISH' : 'BEARISH',
      crossover: Math.sign(histogram[histogram.length - 2]) !== Math.sign(currentHistogram)
    };
  }

  /**
   * Calculate Bollinger Bands
   */
  calculateBollingerBands(prices, period = 20, stdDev = 2) {
    if (prices.length < period) return null;
    
    const recent = prices.slice(-period);
    const sma = recent.reduce((a, b) => a + b, 0) / period;
    
    const variance = recent.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
    const stdev = Math.sqrt(variance);
    
    const upper = sma + stdDev * stdev;
    const lower = sma - stdDev * stdev;
    const current = prices[prices.length - 1];
    
    return {
      upper,
      middle: sma,
      lower,
      current,
      position: (current - lower) / (upper - lower),
      squeeze: (upper - lower) / sma < 0.05
    };
  }

  /**
   * Calculate EMA (Exponential Moving Average)
   */
  calculateEMA(prices, period) {
    if (prices.length < period) return null;
    
    const k = 2 / (period + 1);
    let ema = prices[0];
    
    for (let i = 1; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
    }
    
    return ema;
  }

  /**
   * Calculate SMA (Simple Moving Average)
   */
  calculateSMA(prices, period) {
    if (prices.length < period) return null;
    
    const recent = prices.slice(-period);
    return recent.reduce((a, b) => a + b, 0) / period;
  }

  /**
   * Calculate ATR (Average True Range)
   */
  calculateATR(candles, period = 14) {
    if (candles.length < period + 1) return null;
    
    const trValues = [];
    
    for (let i = 1; i < candles.length; i++) {
      const prevClose = candles[i - 1].close;
      const { high, low } = candles[i];
      
      const tr1 = high - low;
      const tr2 = Math.abs(high - prevClose);
      const tr3 = Math.abs(low - prevClose);
      
      trValues.push(Math.max(tr1, tr2, tr3));
    }
    
    const atr = trValues.slice(-period).reduce((a, b) => a + b, 0) / period;
    
    return {
      current: atr,
      period,
      volatility: atr / candles[candles.length - 1].close
    };
  }

  /**
   * Calculate Volume Profile
   */
  calculateVolumeProfile(candles, bins = 10) {
    if (candles.length < bins) return null;
    
    const prices = candles.map(c => c.close);
    const volumes = candles.map(c => c.volume);
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const binSize = (maxPrice - minPrice) / bins;
    
    const profile = [];
    
    for (let i = 0; i < bins; i++) {
      const binMin = minPrice + i * binSize;
      const binMax = minPrice + (i + 1) * binSize;
      
      const binVolume = candles
        .filter(c => c.close >= binMin && c.close < binMax)
        .reduce((sum, c) => sum + c.volume, 0);
      
      profile.push({
        priceLow: binMin,
        priceHigh: binMax,
        volume: binVolume
      });
    }
    
    // Find Point of Control (highest volume)
    const poc = profile.reduce((max, bin) => bin.volume > max.volume ? bin : max, profile[0]);
    
    return {
      profile,
      poc: (poc.priceLow + poc.priceHigh) / 2,
      valueArea: profile.filter(p => p.volume > poc.volume * 0.7)
    };
  }

  /**
   * Generate trading signals based on indicators
   */
  generateSignals(asset) {
    const indicators = this.indicators.get(asset);
    if (!indicators || !indicators.rsi) return { trend: 'NEUTRAL', signals: [] };
    
    const signals = [];
    let trend = 'NEUTRAL';
    let strength = 0;
    
    // RSI signals
    if (indicators.rsi.current < 30) {
      signals.push({ indicator: 'RSI', signal: 'OVERSOLD', strength: (30 - indicators.rsi.current) / 30 });
      trend = 'BULLISH';
      strength += 0.25;
    } else if (indicators.rsi.current > 70) {
      signals.push({ indicator: 'RSI', signal: 'OVERBOUGHT', strength: (indicators.rsi.current - 70) / 30 });
      trend = 'BEARISH';
      strength += 0.25;
    }
    
    // MACD signals
    if (indicators.macd) {
      if (indicators.macd.crossover && indicators.macd.histogram > 0) {
        signals.push({ indicator: 'MACD', signal: 'BULLISH_CROSSOVER', strength: 0.8 });
        trend = 'BULLISH';
        strength += 0.35;
      } else if (indicators.macd.crossover && indicators.macd.histogram < 0) {
        signals.push({ indicator: 'MACD', signal: 'BEARISH_CROSSOVER', strength: 0.8 });
        trend = 'BEARISH';
        strength += 0.35;
      }
    }
    
    // Bollinger Bands signals
    if (indicators.bollinger) {
      if (indicators.bollinger.position < 0.1) {
        signals.push({ indicator: 'BB', signal: 'NEAR_LOWER_BAND', strength: 0.6 });
        trend = 'BULLISH';
        strength += 0.2;
      } else if (indicators.bollinger.position > 0.9) {
        signals.push({ indicator: 'BB', signal: 'NEAR_UPPER_BAND', strength: 0.6 });
        trend = 'BEARISH';
        strength += 0.2;
      }
    }
    
    // Update signals store
    this.signals.set(asset, {
      trend,
      strength: Math.min(1, strength),
      signals,
      lastUpdate: Date.now()
    });
    
    return { trend, strength, signals };
  }

  /**
   * Start price polling loop
   */
  startPricePolling() {
    this.priceInterval = setInterval(async () => {
      for (const asset of Object.keys(TRADINGVIEW_SYMBOLS)) {
        const price = await this.fetchPrice(asset);
        if (price) {
          const data = this.priceData.get(asset);
          data.spot = price;
          data.history.push(price.price);
          
          // Keep last 1000 prices
          if (data.history.length > 1000) {
            data.history.shift();
          }
        }
      }
    }, this.config.priceUpdateInterval);
  }

  /**
   * Start indicator calculation loop
   */
  startIndicatorCalculation() {
    this.indicatorInterval = setInterval(async () => {
      for (const asset of Object.keys(TRADINGVIEW_SYMBOLS)) {
        // Fetch klines for technical analysis
        const klines = await this.fetchKlines(asset, '5m', 100);
        
        if (klines.length >= 50) {
          const closes = klines.map(k => k.close);
          const indicators = this.indicators.get(asset);
          
          // Calculate all indicators
          indicators.rsi = this.calculateRSI(closes, 14);
          indicators.macd = this.calculateMACD(closes, 12, 26, 9);
          indicators.bollinger = this.calculateBollingerBands(closes, 20, 2);
          indicators.ema = {
            ema9: this.calculateEMA(closes, 9),
            ema21: this.calculateEMA(closes, 21),
            ema50: this.calculateEMA(closes, 50)
          };
          indicators.sma = {
            sma20: this.calculateSMA(closes, 20),
            sma50: this.calculateSMA(closes, 50)
          };
          indicators.atr = this.calculateATR(klines, 14);
          indicators.volume = this.calculateVolumeProfile(klines);
          indicators.updatedAt = Date.now();
          
          // Generate signals
          this.generateSignals(asset);
        }
      }
    }, this.config.indicatorUpdateInterval);
  }

  /**
   * Get current signals for an asset
   */
  getSignals(asset) {
    return this.signals.get(asset) || { trend: 'NEUTRAL', signals: [] };
  }

  /**
   * Get current indicators for an asset
   */
  getIndicators(asset) {
    return this.indicators.get(asset);
  }

  /**
   * Get current price for an asset
   */
  getPrice(asset) {
    return this.priceData.get(asset)?.spot;
  }

  /**
   * Get price history for an asset
   */
  getPriceHistory(asset) {
    return this.priceData.get(asset)?.history || [];
  }

  /**
   * Stop all polling
   */
  stop() {
    if (this.priceInterval) clearInterval(this.priceInterval);
    if (this.indicatorInterval) clearInterval(this.indicatorInterval);
    
    // Close WebSocket connections
    for (const [asset, ws] of this.wsConnections) {
      ws.close();
    }
    
    console.log('📈 TradingView integration stopped');
  }
}

module.exports = { TradingViewIntegration };
