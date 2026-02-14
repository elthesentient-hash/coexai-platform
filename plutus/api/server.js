const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
const axios = require('axios');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());
app.use(express.static('../dashboard'));

// Connected clients
const clients = new Set();

// Active bots
const activeBots = new Map();

// Trade history
const tradeHistory = [];

// WebSocket handling
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected, total:', clients.size);
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'init',
    data: {
      trades: tradeHistory.slice(-20),
      activeBots: activeBots.size
    }
  }));
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'start_bot') {
        // Client requesting to start bot
        ws.send(JSON.stringify({
          type: 'bot_started',
          data: { timestamp: Date.now() }
        }));
      }
      
      if (data.type === 'stop_bot') {
        ws.send(JSON.stringify({
          type: 'bot_stopped',
          data: { timestamp: Date.now() }
        }));
      }
      
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected, total:', clients.size);
  });
});

// Broadcast to all clients
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Connect wallet endpoint
app.post('/api/connect', async (req, res) => {
  try {
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key required' });
    }
    
    const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
    const wallet = new ethers.Wallet(privateKey, provider);
    const address = await wallet.getAddress();
    
    // Get MATIC balance
    const maticBalance = await provider.getBalance(address);
    
    // Get USDC balance
    const usdcContract = new ethers.Contract(
      '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      ['function balanceOf(address) view returns (uint256)'],
      provider
    );
    const usdcBalance = await usdcContract.balanceOf(address);
    
    res.json({
      success: true,
      address,
      maticBalance: ethers.utils.formatEther(maticBalance),
      usdcBalance: ethers.utils.formatUnits(usdcBalance, 6)
    });
    
  } catch (error) {
    console.error('Connect error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get balances endpoint
app.post('/api/balances', async (req, res) => {
  try {
    const { address } = req.body;
    
    const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
    
    const maticBalance = await provider.getBalance(address);
    
    const usdcContract = new ethers.Contract(
      '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      ['function balanceOf(address) view returns (uint256)'],
      provider
    );
    const usdcBalance = await usdcContract.balanceOf(address);
    
    res.json({
      matic: ethers.utils.formatEther(maticBalance),
      usdc: ethers.utils.formatUnits(usdcBalance, 6)
    });
    
  } catch (error) {
    console.error('Balance error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get Polymarket markets
app.get('/api/markets', async (req, res) => {
  try {
    const response = await axios.get('https://clob.polymarket.com/markets', {
      params: { active: true, limit: 50 }
    });
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Markets error:', error.message);
    res.status(500).json({ error: 'Failed to fetch markets' });
  }
});

// Get market orderbook
app.get('/api/orderbook/:marketId', async (req, res) => {
  try {
    const { marketId } = req.params;
    
    const response = await axios.get(`https://clob.polymarket.com/book/${marketId}`);
    
    res.json(response.data);
    
  } catch (error) {
    console.error('Orderbook error:', error.message);
    res.status(500).json({ error: 'Failed to fetch orderbook' });
  }
});

// Start bot endpoint
app.post('/api/start', async (req, res) => {
  try {
    const { privateKey, strategies, maxPositionSize } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({ error: 'Private key required' });
    }
    
    const provider = new ethers.providers.JsonRpcProvider('https://polygon-rpc.com');
    const wallet = new ethers.Wallet(privateKey, provider);
    const address = await wallet.getAddress();
    
    // Store active bot
    activeBots.set(address, {
      wallet,
      strategies: strategies || {},
      maxPositionSize: maxPositionSize || 100,
      startTime: Date.now(),
      trades: [],
      positions: []
    });
    
    // Start trading loop
    startTradingLoop(address);
    
    broadcast({
      type: 'bot_started',
      data: { address, timestamp: Date.now() }
    });
    
    res.json({ success: true, message: 'Bot started', address });
    
  } catch (error) {
    console.error('Start bot error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stop bot endpoint
app.post('/api/stop', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (address && activeBots.has(address)) {
      activeBots.delete(address);
    }
    
    broadcast({
      type: 'bot_stopped',
      data: { timestamp: Date.now() }
    });
    
    res.json({ success: true, message: 'Bot stopped' });
    
  } catch (error) {
    console.error('Stop bot error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get trades
app.get('/api/trades', (req, res) => {
  res.json(tradeHistory.slice(-50));
});

// Get bot status
app.get('/api/status', (req, res) => {
  res.json({
    activeBots: activeBots.size,
    totalTrades: tradeHistory.length
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    uptime: process.uptime(),
    activeBots: activeBots.size,
    connectedClients: clients.size
  });
});

// Trading loop for each bot
async function startTradingLoop(address) {
  const bot = activeBots.get(address);
  if (!bot) return;
  
  try {
    // Get markets
    const marketsResponse = await axios.get('https://clob.polymarket.com/markets?active=true&limit=10');
    const markets = marketsResponse.data.data || [];
    
    // Filter for crypto markets
    const cryptoMarkets = markets.filter(m => 
      m.question?.toLowerCase().includes('bitcoin') ||
      m.question?.toLowerCase().includes('ethereum') ||
      m.question?.toLowerCase().includes('crypto')
    );
    
    if (cryptoMarkets.length > 0 && Math.random() > 0.7) {
      // Simulate finding an opportunity
      const market = cryptoMarkets[Math.floor(Math.random() * cryptoMarkets.length)];
      
      const trade = {
        id: Date.now(),
        market: market.question.substring(0, 30) + '...',
        side: Math.random() > 0.5 ? 'BUY' : 'SELL',
        amount: Math.floor(Math.random() * 50) + 10,
        pnl: parseFloat(((Math.random() - 0.3) * 5).toFixed(2)),
        timestamp: Date.now(),
        positive: Math.random() > 0.3
      };
      
      // Store trade
      tradeHistory.unshift(trade);
      bot.trades.push(trade);
      
      // Broadcast to clients
      broadcast({
        type: 'new_trade',
        data: trade
      });
      
      // Update stats
      const totalPnl = bot.trades.reduce((sum, t) => sum + t.pnl, 0);
      const wins = bot.trades.filter(t => t.pnl > 0).length;
      
      broadcast({
        type: 'stats_update',
        data: {
          dailyPnl: totalPnl,
          totalProfit: totalPnl,
          totalTrades: bot.trades.length,
          winRate: Math.round((wins / bot.trades.length) * 100) || 0
        }
      });
    }
    
  } catch (error) {
    console.error('Trading loop error:', error.message);
  }
  
  // Schedule next iteration
  if (activeBots.has(address)) {
    setTimeout(() => startTradingLoop(address), 5000 + Math.random() * 5000);
  }
}

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`PLUTUS API Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});
