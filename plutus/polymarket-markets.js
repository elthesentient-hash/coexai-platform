/**
 * POLYMARKET CRYPTO MARKETS - Complete Market Dictionary
 * 
 * All crypto markets available on https://polymarket.com/crypto
 * Organized by timeframe, asset, and market type
 */

const POLYMARKET_CRYPTO_MARKETS = {
  // ═══════════════════════════════════════════════════════════
  // 5-MINUTE MARKETS (Fast, High Frequency)
  // ═══════════════════════════════════════════════════════════
  '5MIN': {
    timeframe: '5M',
    resolution: '5',
    description: '5-minute binary up/down markets',
    markets: [
      {
        id: 'bitcoin-up-or-down-5min',
        name: 'Bitcoin Up or Down (5min)',
        slug: 'bitcoin-up-or-down',
        asset: 'BTC',
        type: 'binary',
        category: 'price-direction',
        tradingViewSymbol: 'BINANCE:BTCUSDT',
        fees: { maker: 0.002, taker: 0.002 }
      },
      {
        id: 'ethereum-up-or-down-5min',
        name: 'Ethereum Up or Down (5min)',
        slug: 'ethereum-up-or-down',
        asset: 'ETH',
        type: 'binary',
        category: 'price-direction',
        tradingViewSymbol: 'BINANCE:ETHUSDT',
        fees: { maker: 0.002, taker: 0.002 }
      },
      {
        id: 'solana-up-or-down-5min',
        name: 'Solana Up or Down (5min)',
        slug: 'solana-up-or-down',
        asset: 'SOL',
        type: 'binary',
        category: 'price-direction',
        tradingViewSymbol: 'BINANCE:SOLUSDT',
        fees: { maker: 0.002, taker: 0.002 }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 15-MINUTE MARKETS (Medium Frequency)
  // ═══════════════════════════════════════════════════════════
  '15MIN': {
    timeframe: '15M',
    resolution: '15',
    description: '15-minute binary up/down markets',
    markets: [
      {
        id: 'bitcoin-up-or-down-15min',
        name: 'Bitcoin Up or Down (15min)',
        slug: 'bitcoin-up-or-down',
        asset: 'BTC',
        type: 'binary',
        category: 'price-direction',
        tradingViewSymbol: 'BINANCE:BTCUSDT',
        fees: { maker: 0.002, taker: 0.002 }
      },
      {
        id: 'ethereum-up-or-down-15min',
        name: 'Ethereum Up or Down (15min)',
        slug: 'ethereum-up-or-down',
        asset: 'ETH',
        type: 'binary',
        category: 'price-direction',
        tradingViewSymbol: 'BINANCE:ETHUSDT',
        fees: { maker: 0.002, taker: 0.002 }
      },
      {
        id: 'solana-up-or-down-15min',
        name: 'Solana Up or Down (15min)',
        slug: 'solana-up-or-down',
        asset: 'SOL',
        type: 'binary',
        category: 'price-direction',
        tradingViewSymbol: 'BINANCE:SOLUSDT',
        fees: { maker: 0.002, taker: 0.002 }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // HOURLY MARKETS
  // ═══════════════════════════════════════════════════════════
  'HOURLY': {
    timeframe: '1H',
    resolution: '60',
    description: 'Hourly binary up/down markets',
    markets: [
      {
        id: 'bitcoin-up-or-down-hourly',
        name: 'Bitcoin Up or Down (Hourly)',
        slug: 'bitcoin-up-or-down',
        asset: 'BTC',
        type: 'binary',
        category: 'price-direction',
        tradingViewSymbol: 'BINANCE:BTCUSDT',
        fees: { maker: 0.002, taker: 0.002 }
      },
      {
        id: 'ethereum-up-or-down-hourly',
        name: 'Ethereum Up or Down (Hourly)',
        slug: 'ethereum-up-or-down',
        asset: 'ETH',
        type: 'binary',
        category: 'price-direction',
        tradingViewSymbol: 'BINANCE:ETHUSDT',
        fees: { maker: 0.002, taker: 0.002 }
      },
      {
        id: 'solana-up-or-down-hourly',
        name: 'Solana Up or Down (Hourly)',
        slug: 'solana-up-or-down',
        asset: 'SOL',
        type: 'binary',
        category: 'price-direction',
        tradingViewSymbol: 'BINANCE:SOLUSDT',
        fees: { maker: 0.002, taker: 0.002 }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // 4-HOUR MARKETS
  // ═══════════════════════════════════════════════════════════
  '4HOUR': {
    timeframe: '4H',
    resolution: '240',
    description: '4-hour binary up/down markets',
    markets: [
      {
        id: 'bitcoin-up-or-down-4hour',
        name: 'Bitcoin Up or Down (4H)',
        slug: 'bitcoin-up-or-down',
        asset: 'BTC',
        type: 'binary',
        category: 'price-direction',
        tradingViewSymbol: 'BINANCE:BTCUSDT',
        fees: { maker: 0.002, taker: 0.002 }
      },
      {
        id: 'ethereum-up-or-down-4hour',
        name: 'Ethereum Up or Down (4H)',
        slug: 'ethereum-up-or-down',
        asset: 'ETH',
        type: 'binary',
        category: 'price-direction',
        tradingViewSymbol: 'BINANCE:ETHUSDT',
        fees: { maker: 0.002, taker: 0.002 }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // DAILY MARKETS
  // ═══════════════════════════════════════════════════════════
  'DAILY': {
    timeframe: '1D',
    resolution: 'D',
    description: 'Daily binary up/down markets',
    markets: [
      {
        id: 'bitcoin-up-or-down-daily',
        name: 'Bitcoin Up or Down (Daily)',
        slug: 'bitcoin-up-or-down',
        asset: 'BTC',
        type: 'binary',
        category: 'price-direction',
        tradingViewSymbol: 'BINANCE:BTCUSDT',
        fees: { maker: 0.002, taker: 0.002 }
      },
      {
        id: 'ethereum-up-or-down-daily',
        name: 'Ethereum Up or Down (Daily)',
        slug: 'ethereum-up-or-down',
        asset: 'ETH',
        type: 'binary',
        category: 'price-direction',
        tradingViewSymbol: 'BINANCE:ETHUSDT',
        fees: { maker: 0.002, taker: 0.002 }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // PRICE LEVEL MARKETS (Will BTC/ETH/SOL be above X?)
  // ═══════════════════════════════════════════════════════════
  'PRICE_LEVELS': {
    description: 'Price level threshold markets',
    markets: [
      // Bitcoin price levels
      {
        id: 'bitcoin-above-60k',
        name: 'Bitcoin above $60,000',
        slug: 'bitcoin-above-60k-on-february-14',
        asset: 'BTC',
        type: 'binary',
        category: 'price-level',
        threshold: 60000,
        tradingViewSymbol: 'BINANCE:BTCUSDT',
        expiry: '2026-02-14T23:59:59Z'
      },
      {
        id: 'bitcoin-above-62k',
        name: 'Bitcoin above $62,000',
        slug: 'bitcoin-above-62k-on-february-14',
        asset: 'BTC',
        type: 'binary',
        category: 'price-level',
        threshold: 62000,
        tradingViewSymbol: 'BINANCE:BTCUSDT',
        expiry: '2026-02-14T23:59:59Z'
      },
      {
        id: 'bitcoin-above-64k',
        name: 'Bitcoin above $64,000',
        slug: 'bitcoin-above-64k',
        asset: 'BTC',
        type: 'binary',
        category: 'price-level',
        threshold: 64000,
        tradingViewSymbol: 'BINANCE:BTCUSDT'
      },
      {
        id: 'bitcoin-above-66k',
        name: 'Bitcoin above $66,000',
        slug: 'bitcoin-above-66k',
        asset: 'BTC',
        type: 'binary',
        category: 'price-level',
        threshold: 66000,
        tradingViewSymbol: 'BINANCE:BTCUSDT'
      },
      {
        id: 'bitcoin-above-68k',
        name: 'Bitcoin above $68,000',
        slug: 'bitcoin-above-68k',
        asset: 'BTC',
        type: 'binary',
        category: 'price-level',
        threshold: 68000,
        tradingViewSymbol: 'BINANCE:BTCUSDT'
      },
      
      // Ethereum price levels
      {
        id: 'ethereum-above-1600',
        name: 'Ethereum above $1,600',
        slug: 'ethereum-above-1600-on-february-14',
        asset: 'ETH',
        type: 'binary',
        category: 'price-level',
        threshold: 1600,
        tradingViewSymbol: 'BINANCE:ETHUSDT',
        expiry: '2026-02-14T23:59:59Z'
      },
      {
        id: 'ethereum-above-1700',
        name: 'Ethereum above $1,700',
        slug: 'ethereum-above-1700-on-february-14',
        asset: 'ETH',
        type: 'binary',
        category: 'price-level',
        threshold: 1700,
        tradingViewSymbol: 'BINANCE:ETHUSDT',
        expiry: '2026-02-14T23:59:59Z'
      },
      {
        id: 'ethereum-above-1800',
        name: 'Ethereum above $1,800',
        slug: 'ethereum-above-1800',
        asset: 'ETH',
        type: 'binary',
        category: 'price-level',
        threshold: 1800,
        tradingViewSymbol: 'BINANCE:ETHUSDT'
      },
      {
        id: 'ethereum-above-1900',
        name: 'Ethereum above $1,900',
        slug: 'ethereum-above-1900',
        asset: 'ETH',
        type: 'binary',
        category: 'price-level',
        threshold: 1900,
        tradingViewSymbol: 'BINANCE:ETHUSDT'
      },
      
      // Solana price levels
      {
        id: 'solana-above-40',
        name: 'Solana above $40',
        slug: 'solana-above-40-on-february-14',
        asset: 'SOL',
        type: 'binary',
        category: 'price-level',
        threshold: 40,
        tradingViewSymbol: 'BINANCE:SOLUSDT',
        expiry: '2026-02-14T23:59:59Z'
      },
      {
        id: 'solana-above-50',
        name: 'Solana above $50',
        slug: 'solana-above-50-on-february-14',
        asset: 'SOL',
        type: 'binary',
        category: 'price-level',
        threshold: 50,
        tradingViewSymbol: 'BINANCE:SOLUSDT',
        expiry: '2026-02-14T23:59:59Z'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // PRICE RANGE MARKETS (Will price be between X and Y?)
  // ═══════════════════════════════════════════════════════════
  'PRICE_RANGES': {
    description: 'Price range markets',
    markets: [
      {
        id: 'bitcoin-range-64k-66k',
        name: 'Bitcoin $64,000-$66,000',
        slug: 'bitcoin-price-between-64000-66000',
        asset: 'BTC',
        type: 'categorical',
        category: 'price-range',
        range: { low: 64000, high: 66000 },
        tradingViewSymbol: 'BINANCE:BTCUSDT'
      },
      {
        id: 'bitcoin-range-66k-68k',
        name: 'Bitcoin $66,000-$68,000',
        slug: 'bitcoin-price-between-66000-68000',
        asset: 'BTC',
        type: 'categorical',
        category: 'price-range',
        range: { low: 66000, high: 68000 },
        tradingViewSymbol: 'BINANCE:BTCUSDT'
      },
      {
        id: 'ethereum-range-1800-1900',
        name: 'Ethereum $1,800-$1,900',
        slug: 'ethereum-price-between-1800-1900',
        asset: 'ETH',
        type: 'categorical',
        category: 'price-range',
        range: { low: 1800, high: 1900 },
        tradingViewSymbol: 'BINANCE:ETHUSDT'
      },
      {
        id: 'ethereum-range-1900-2000',
        name: 'Ethereum $1,900-$2,000',
        slug: 'ethereum-price-between-1900-2000',
        asset: 'ETH',
        type: 'categorical',
        category: 'price-range',
        range: { low: 1900, high: 2000 },
        tradingViewSymbol: 'BINANCE:ETHUSDT'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // PRICE TARGET MARKETS (Will XRP/BTC hit Y price?)
  // ═══════════════════════════════════════════════════════════
  'PRICE_TARGETS': {
    description: 'Price target/hit markets',
    markets: [
      {
        id: 'bitcoin-hit-74k',
        name: 'Bitcoin to hit $74,000',
        slug: 'bitcoin-reach-74k',
        asset: 'BTC',
        type: 'binary',
        category: 'price-target',
        target: 74000,
        tradingViewSymbol: 'BINANCE:BTCUSDT'
      },
      {
        id: 'bitcoin-hit-76k',
        name: 'Bitcoin to hit $76,000',
        slug: 'bitcoin-reach-76k',
        asset: 'BTC',
        type: 'binary',
        category: 'price-target',
        target: 76000,
        tradingViewSymbol: 'BINANCE:BTCUSDT'
      },
      {
        id: 'bitcoin-hit-80k',
        name: 'Bitcoin to hit $80,000',
        slug: 'bitcoin-reach-80k',
        asset: 'BTC',
        type: 'binary',
        category: 'price-target',
        target: 80000,
        tradingViewSymbol: 'BINANCE:BTCUSDT'
      },
      {
        id: 'bitcoin-hit-85k',
        name: 'Bitcoin to hit $85,000',
        slug: 'bitcoin-reach-85k',
        asset: 'BTC',
        type: 'binary',
        category: 'price-target',
        target: 85000,
        tradingViewSymbol: 'BINANCE:BTCUSDT'
      },
      {
        id: 'xrp-hit-1-50',
        name: 'XRP to hit $1.50',
        slug: 'xrp-reach-1pt5',
        asset: 'XRP',
        type: 'binary',
        category: 'price-target',
        target: 1.50,
        tradingViewSymbol: 'BINANCE:XRPUSDT'
      },
      {
        id: 'xrp-hit-1-60',
        name: 'XRP to hit $1.60',
        slug: 'xrp-reach-1pt6',
        asset: 'XRP',
        type: 'binary',
        category: 'price-target',
        target: 1.60,
        tradingViewSymbol: 'BINANCE:XRPUSDT'
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // TOKEN LAUNCH FDV MARKETS
  // ═══════════════════════════════════════════════════════════
  'TOKEN_LAUNCH_FDVs': {
    description: 'Token launch FDV prediction markets',
    markets: [
      {
        id: 'megaeth-fdv-1b',
        name: 'MegaETH FDV above $1B',
        slug: 'megaeth-market-cap-fdv-1b',
        asset: 'MEGAETH',
        type: 'binary',
        category: 'token-launch',
        metric: 'FDV',
        threshold: 1000000000,
        tradingViewSymbol: null // New token, no TV symbol yet
      },
      {
        id: 'megaeth-fdv-1pt5b',
        name: 'MegaETH FDV above $1.5B',
        slug: 'megaeth-market-cap-fdv-1pt5b',
        asset: 'MEGAETH',
        type: 'binary',
        category: 'token-launch',
        metric: 'FDV',
        threshold: 1500000000,
        tradingViewSymbol: null
      },
      {
        id: 'aztec-fdv-150m',
        name: 'Aztec FDV above $150M',
        slug: 'aztec-fdv-above-150m',
        asset: 'AZTEC',
        type: 'binary',
        category: 'token-launch',
        metric: 'FDV',
        threshold: 150000000,
        tradingViewSymbol: null
      },
      {
        id: 'aztec-fdv-300m',
        name: 'Aztec FDV above $300M',
        slug: 'aztec-fdv-above-300m',
        asset: 'AZTEC',
        type: 'binary',
        category: 'token-launch',
        metric: 'FDV',
        threshold: 300000000,
        tradingViewSymbol: null
      },
      {
        id: 'puffpaw-fdv-50m',
        name: 'Puffpaw FDV above $50M',
        slug: 'puffpaw-fdv-above-50m',
        asset: 'PUFFPAW',
        type: 'binary',
        category: 'token-launch',
        metric: 'FDV',
        threshold: 50000000,
        tradingViewSymbol: null
      },
      {
        id: 'puffpaw-fdv-100m',
        name: 'Puffpaw FDV above $100M',
        slug: 'puffpaw-fdv-above-100m',
        asset: 'PUFFPAW',
        type: 'binary',
        category: 'token-launch',
        metric: 'FDV',
        threshold: 100000000,
        tradingViewSymbol: null
      },
      {
        id: 'flying-tulip-fdv-400m',
        name: 'Flying Tulip FDV above $400M',
        slug: 'flying-tulip-fdv-above-400m',
        asset: 'FLYING_TULIP',
        type: 'binary',
        category: 'token-launch',
        metric: 'FDV',
        threshold: 400000000,
        tradingViewSymbol: null
      },
      {
        id: 'flying-tulip-fdv-800m',
        name: 'Flying Tulip FDV above $800M',
        slug: 'flying-tulip-fdv-above-800m',
        asset: 'FLYING_TULIP',
        type: 'binary',
        category: 'token-launch',
        metric: 'FDV',
        threshold: 800000000,
        tradingViewSymbol: null
      }
    ]
  }
};

// ═══════════════════════════════════════════════════════════
// TRADINGVIEW SYMBOL MAPPING
// ═══════════════════════════════════════════════════════════

const TRADINGVIEW_SYMBOLS = {
  BTC: {
    spot: 'BINANCE:BTCUSDT',
    perp: 'BINANCE:BTCUSD_PERP',
    coinbase: 'COINBASE:BTCUSD',
    description: 'Bitcoin / TetherUS'
  },
  ETH: {
    spot: 'BINANCE:ETHUSDT',
    perp: 'BINANCE:ETHUSD_PERP',
    coinbase: 'COINBASE:ETHUSD',
    description: 'Ethereum / TetherUS'
  },
  SOL: {
    spot: 'BINANCE:SOLUSDT',
    perp: 'BINANCE:SOLUSD_PERP',
    coinbase: 'COINBASE:SOLUSD',
    description: 'Solana / TetherUS'
  },
  XRP: {
    spot: 'BINANCE:XRPUSDT',
    perp: 'BINANCE:XRPUSD_PERP',
    coinbase: 'COINBASE:XRPUSD',
    description: 'XRP / TetherUS'
  },
  DOGE: {
    spot: 'BINANCE:DOGEUSDT',
    perp: 'BINANCE:DOGEUSD_PERP',
    coinbase: 'COINBASE:DOGEUSD',
    description: 'Dogecoin / TetherUS'
  }
};

// ═══════════════════════════════════════════════════════════
// MARKET ANALYSIS HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Get all markets for a specific timeframe
 */
function getMarketsByTimeframe(timeframe) {
  const tf = POLYMARKET_CRYPTO_MARKETS[timeframe];
  return tf ? tf.markets : [];
}

/**
 * Get all markets for a specific asset
 */
function getMarketsByAsset(asset) {
  const markets = [];
  for (const [key, value] of Object.entries(POLYMARKET_CRYPTO_MARKETS)) {
    if (value.markets) {
      markets.push(...value.markets.filter(m => m.asset === asset));
    }
  }
  return markets;
}

/**
 * Get TradingView symbol for asset
 */
function getTradingViewSymbol(asset, type = 'spot') {
  return TRADINGVIEW_SYMBOLS[asset]?.[type] || null;
}

/**
 * Get all binary up/down markets
 */
function getBinaryMarkets() {
  const markets = [];
  for (const [key, value] of Object.entries(POLYMARKET_CRYPTO_MARKETS)) {
    if (value.markets) {
      markets.push(...value.markets.filter(m => m.type === 'binary'));
    }
  }
  return markets;
}

/**
 * Get high-frequency trading markets (5M, 15M)
 */
function getHFTMarkets() {
  const hft = [];
  if (POLYMARKET_CRYPTO_MARKETS['5MIN']?.markets) {
    hft.push(...POLYMARKET_CRYPTO_MARKETS['5MIN'].markets);
  }
  if (POLYMARKET_CRYPTO_MARKETS['15MIN']?.markets) {
    hft.push(...POLYMARKET_CRYPTO_MARKETS['15MIN'].markets);
  }
  return hft;
}

/**
 * Calculate implied probability from odds
 */
function oddsToProbability(yesOdds, noOdds) {
  const total = yesOdds + noOdds;
  return {
    yes: yesOdds / total,
    no: noOdds / total,
    edge: Math.abs(yesOdds - noOdds) / total
  };
}

/**
 * Check for arbitrage opportunity (YES + NO < 1.0)
 */
function checkArbitrage(yesPrice, noPrice) {
  const total = yesPrice + noPrice;
  return {
    arbitrage: total < 0.995,
    profit: 1.0 - total,
    yesPrice,
    noPrice,
    total
  };
}

module.exports = {
  POLYMARKET_CRYPTO_MARKETS,
  TRADINGVIEW_SYMBOLS,
  getMarketsByTimeframe,
  getMarketsByAsset,
  getTradingViewSymbol,
  getBinaryMarkets,
  getHFTMarkets,
  oddsToProbability,
  checkArbitrage
};
