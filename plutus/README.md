# PLUTUS - Polymarket Trading Bot

**High-frequency trading bot for Polymarket prediction markets**

Inspired by:
- Kirill's bot: $142K/week (price lag exploitation)
- Phantom's bot: $5-10K/day (micro-arbitrage)
- Discover's bot: $500K total (structural arbitrage)
- Ventry's bot: $11.4K (spike hunting)

---

## 🚀 Features

### Trading Strategies

1. **Spike Hunting** (Primary Strategy)
   - Reads order book for large incoming orders
   - Enters before whales move the market
   - Exits when price spikes
   - **Best performer: $1K → $11.4K in Ventry's test**

2. **Micro-Arbitrage**
   - Exploits YES + NO < $1 inefficiencies
   - Guaranteed profit when combined price < 1.0
   - **Discover made $500K with this strategy**

3. **Copy Trading**
   - Tracks top whale wallets
   - Copies trades from high-win-rate wallets (>65%)
   - **Ventry's bot: $1K → $6.8K copying whales**

### Risk Management

- Daily loss limits (stop trading after $X loss)
- Position size limits (max $X per trade)
- Concurrent position limits
- Stop-loss and take-profit automation
- Time-based position exits

---

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/yourusername/plutus.git
cd plutus

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env with your settings
nano .env
```

---

## ⚙️ Configuration

Create `.env` file:

```env
# Wallet (Required)
PRIVATE_KEY=your_private_key_here
RPC_URL=https://polygon-rpc.com

# Trading Settings
MAX_POSITION_SIZE=100          # Max $ per trade
MAX_DAILY_LOSS=500            # Stop after $X loss
MAX_CONCURRENT_POSITIONS=5     # Max open trades

# Strategies (true/false)
ENABLE_SPIKE_HUNTING=true
ENABLE_MICRO_ARBITRAGE=true
ENABLE_COPY_TRADING=false

# Markets to trade
MARKETS=BTC-5MIN,ETH-5MIN,BTC-15MIN,ETH-15MIN

# Whale wallets to copy (if copy trading enabled)
WHALE_WALLETS=0x...,0x...,0x...
```

---

## 🎮 Usage

### Quick Start

```bash
# Start the bot
npm start

# Or with custom config
node plutus.js --config config.json
```

### Programmatic Usage

```javascript
const { Plutus } = require('./plutus');

const bot = new Plutus({
  privateKey: process.env.PRIVATE_KEY,
  markets: ['BTC-5MIN', 'ETH-5MIN'],
  strategies: {
    spikeHunting: true,
    microArbitrage: true,
    copyTrading: false
  },
  maxPositionSize: 100,
  maxDailyLoss: 500
});

// Initialize and start
await bot.init();
await bot.start();

// Get status
console.log(bot.getPerformanceReport());

// Stop
await bot.stop();
```

---

## 📊 Performance Monitoring

The bot prints status every minute:

```
📊 PLUTUS STATUS
═══════════════════════════════════════
⏱️  Runtime:        4h 23m
💰 Daily P&L:      $847.32
📈 Daily Profit:   $1,203.45
📉 Daily Loss:     $356.13
🔄 Trades Today:   47
🎯 Win Rate:       68.2%
📊 Open Positions: 3
═══════════════════════════════════════
```

---

## 🏆 Strategy Performance (Based on Real Bots)

| Strategy | Return | Risk | Best For |
|----------|--------|------|----------|
| Spike Hunting | 1,040% | Medium | Active markets |
| Micro-Arbitrage | 200-500% | Low | Guaranteed small profits |
| Copy Trading | 580% | Medium | Following proven whales |

**Recommended:** Start with all 3 enabled, then optimize based on results.

---

## 🐳 Whale Copy Trading

To copy successful traders:

1. Find profitable wallets on Polymarket
2. Add to `WHALE_WALLETS` in .env
3. Bot will auto-copy trades from wallets with >65% win rate

**Pro tip:** Start with 3-5 whales, monitor for 1 week, keep only profitable ones.

---

## ⚠️ Risk Warning

**IMPORTANT:** 
- Start with small amounts ($100-500)
- Test on 5-minute markets first
- Never trade more than you can afford to lose
- Bot can lose money - no guarantees

**The videos show exceptional results - your mileage may vary.**

---

## 🔧 Advanced Configuration

### Custom Strategies

```javascript
const bot = new Plutus({
  // Entry thresholds
  minProfitThreshold: 0.02,  // 2% minimum profit
  
  // Exit conditions
  stopLossPercent: 3,        // Exit at -3%
  takeProfitPercent: 5,      // Exit at +5%
  
  // Timing
  maxPositionDuration: 300000, // 5 minutes max
  
  // Custom markets
  markets: ['CUSTOM-MARKET-1', 'CUSTOM-MARKET-2']
});
```

### Running Multiple Bots

```bash
# Terminal 1 - Conservative bot
node plutus.js --config config-conservative.json

# Terminal 2 - Aggressive bot
node plutus.js --config config-aggressive.json
```

---

## 🐳 Docker

```bash
# Build
docker build -t plutus .

# Run
docker run -d --env-file .env --name plutus plutus

# Logs
docker logs -f plutus

# Stop
docker stop plutus
```

---

## 📈 Expected Returns

Based on the 4 video examples:

| Capital | Conservative (10%/mo) | Moderate (50%/mo) | Aggressive (200%/mo) |
|---------|----------------------|-------------------|---------------------|
| $1,000 | $100/mo | $500/mo | $2,000/mo |
| $5,000 | $500/mo | $2,500/mo | $10,000/mo |
| $10,000 | $1,000/mo | $5,000/mo | $20,000/mo |

**Note:** These are based on video claims. Real results vary significantly.

---

## 🆘 Troubleshooting

**Bot not starting:**
- Check PRIVATE_KEY is valid
- Ensure wallet has MATIC for gas
- Verify RPC_URL is working

**No trades executing:**
- Check markets are active
- Verify USDC balance > $100
- Review strategy settings

**Losing money:**
- Reduce position sizes
- Enable more conservative settings
- Stop and review strategy

---

## 📚 Resources

- [Polymarket CLOB API](https://docs.polymarket.com/)
- [Polygon Network](https://polygon.technology/)
- [USDC on Polygon](https://www.circle.com/en/usdc/multichain/polygon)

---

## ⚖️ Disclaimer

This bot is for educational purposes. Cryptocurrency trading carries significant risk. Past performance does not guarantee future results. The authors are not responsible for any financial losses.

**Trade responsibly.**

---

## 📝 License

MIT License - Use at your own risk.

---

Built with 💰 by the CoExAI team
