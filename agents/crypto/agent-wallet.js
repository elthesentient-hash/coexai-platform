/**
 * CoExAI Crypto Wallet System
 * Enables AI agents to have wallets, send/receive payments, and transact autonomously
 * 
 * Supports: Bitcoin Lightning, Ethereum, USDC, Solana
 */

const crypto = require('crypto');
const { ethers } = require('ethers');
const axios = require('axios');

class AgentWallet {
  constructor(agentId, options = {}) {
    this.agentId = agentId;
    this.wallets = new Map();
    this.transactions = [];
    this.preferences = {
      preferredNetwork: options.preferredNetwork || 'ethereum', // ethereum, bitcoin, solana
      autoApproveThreshold: options.autoApproveThreshold || 0.001, // ETH - below this auto-approve
      requireHumanApproval: options.requireHumanApproval !== false, // Default true for safety
      dailyLimit: options.dailyLimit || 0.1, // Max daily spend in ETH
      ...options
    };
    this.dailySpent = 0;
    this.lastReset = Date.now();
  }

  /**
   * Create a new wallet for the agent
   */
  async createWallet(network = 'ethereum') {
    switch (network) {
      case 'ethereum':
        return this._createEthereumWallet();
      case 'bitcoin':
        return this._createBitcoinWallet();
      case 'solana':
        return this._createSolanaWallet();
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }

  /**
   * Create Ethereum wallet
   */
  _createEthereumWallet() {
    const wallet = ethers.Wallet.createRandom();
    const walletData = {
      network: 'ethereum',
      address: wallet.address,
      privateKey: wallet.privateKey, // In production, encrypt this!
      publicKey: wallet.publicKey,
      mnemonic: wallet.mnemonic.phrase, // Backup phrase
      createdAt: Date.now()
    };
    
    this.wallets.set('ethereum', walletData);
    
    console.log(`[${this.agentId}] Ethereum wallet created: ${wallet.address}`);
    
    return {
      network: 'ethereum',
      address: wallet.address,
      balance: 0,
      created: true
    };
  }

  /**
   * Create Bitcoin Lightning wallet (via Lightning Labs or similar)
   */
  async _createBitcoinWallet() {
    // Using Lightning Network for fast, cheap micropayments
    // In production, integrate with Lightning Labs, Strike, or Breez SDK
    
    const mockWallet = {
      network: 'bitcoin',
      lightningAddress: `${this.agentId}@coexai.ai`,
      nodeId: crypto.randomBytes(32).toString('hex'),
      pubkey: crypto.randomBytes(33).toString('hex'),
      createdAt: Date.now()
    };
    
    this.wallets.set('bitcoin', mockWallet);
    
    console.log(`[${this.agentId}] Bitcoin Lightning wallet created: ${mockWallet.lightningAddress}`);
    
    return {
      network: 'bitcoin',
      address: mockWallet.lightningAddress,
      balance: 0,
      created: true
    };
  }

  /**
   * Create Solana wallet
   */
  _createSolanaWallet() {
    // Using Solana for fast, cheap transactions
    const { Keypair } = require('@solana/web3.js');
    const keypair = Keypair.generate();
    
    const walletData = {
      network: 'solana',
      address: keypair.publicKey.toString(),
      secretKey: Buffer.from(keypair.secretKey).toString('hex'),
      createdAt: Date.now()
    };
    
    this.wallets.set('solana', walletData);
    
    console.log(`[${this.agentId}] Solana wallet created: ${walletData.address}`);
    
    return {
      network: 'solana',
      address: walletData.address,
      balance: 0,
      created: true
    };
  }

  /**
   * Get wallet balance
   */
  async getBalance(network = 'ethereum') {
    const wallet = this.wallets.get(network);
    if (!wallet) {
      throw new Error(`No ${network} wallet found. Create one first.`);
    }

    switch (network) {
      case 'ethereum':
        return this._getEthereumBalance(wallet.address);
      case 'bitcoin':
        return this._getBitcoinBalance(wallet.lightningAddress);
      case 'solana':
        return this._getSolanaBalance(wallet.address);
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }

  async _getEthereumBalance(address) {
    // In production, use Infura, Alchemy, or QuickNode
    try {
      // Mock balance for now
      return {
        network: 'ethereum',
        address,
        balance: 0.5, // ETH
        balanceUSD: 1500, // Approximate USD value
        symbol: 'ETH'
      };
    } catch (error) {
      console.error('Failed to get ETH balance:', error);
      return { network: 'ethereum', address, balance: 0, error: error.message };
    }
  }

  async _getBitcoinBalance(lightningAddress) {
    // In production, query Lightning node or LNDHub
    return {
      network: 'bitcoin',
      address: lightningAddress,
      balance: 0.01, // BTC
      balanceUSD: 500,
      symbol: 'BTC'
    };
  }

  async _getSolanaBalance(address) {
    // In production, use Solana RPC
    return {
      network: 'solana',
      address,
      balance: 5, // SOL
      balanceUSD: 1000,
      symbol: 'SOL'
    };
  }

  /**
   * Send payment
   */
  async sendPayment(to, amount, network = 'ethereum', options = {}) {
    // Check daily limit
    if (this.dailySpent + amount > this.preferences.dailyLimit) {
      throw new Error(`Daily spending limit exceeded. Limit: ${this.preferences.dailyLimit} ETH`);
    }

    // Check auto-approve threshold
    const needsApproval = this.preferences.requireHumanApproval && 
                          amount > this.preferences.autoApproveThreshold;

    if (needsApproval && !options.approved) {
      // Queue for human approval
      const requestId = crypto.randomUUID();
      this._queueForApproval({
        id: requestId,
        type: 'payment',
        to,
        amount,
        network,
        reason: options.reason || 'Agent-initiated transaction',
        timestamp: Date.now()
      });
      
      return {
        status: 'pending_approval',
        requestId,
        message: `Payment of ${amount} ${network} requires human approval`
      };
    }

    // Execute payment
    const result = await this._executePayment(to, amount, network, options);
    
    if (result.success) {
      this.dailySpent += amount;
      this.transactions.push({
        id: result.txHash,
        type: 'send',
        to,
        amount,
        network,
        timestamp: Date.now(),
        status: 'confirmed'
      });
    }

    return result;
  }

  async _executePayment(to, amount, network, options) {
    console.log(`[${this.agentId}] Executing ${network} payment: ${amount} to ${to}`);

    // In production, use actual wallet SDKs
    // For now, return mock success
    
    const txHash = crypto.randomBytes(32).toString('hex');
    
    return {
      success: true,
      txHash,
      network,
      amount,
      to,
      fee: amount * 0.001, // 0.1% fee
      timestamp: Date.now(),
      explorer: `https://${network === 'ethereum' ? 'etherscan' : network === 'bitcoin' ? 'mempool' : 'solscan'}.io/tx/${txHash}`
    };
  }

  /**
   * Request payment (invoice)
   */
  async requestPayment(amount, network = 'ethereum', options = {}) {
    const wallet = this.wallets.get(network);
    if (!wallet) {
      throw new Error(`No ${network} wallet found`);
    }

    const invoiceId = crypto.randomUUID();
    
    const invoice = {
      id: invoiceId,
      agentId: this.agentId,
      amount,
      network,
      address: wallet.address || wallet.lightningAddress,
      description: options.description || `Payment to ${this.agentId}`,
      expiresAt: Date.now() + (options.expiresIn || 3600000), // 1 hour default
      status: 'pending',
      createdAt: Date.now()
    };

    console.log(`[${this.agentId}] Created invoice: ${invoiceId} for ${amount} ${network}`);

    return invoice;
  }

  /**
   * Check if invoice is paid
   */
  async checkInvoice(invoiceId) {
    // In production, query blockchain or payment provider
    return {
      id: invoiceId,
      status: Math.random() > 0.5 ? 'paid' : 'pending', // Mock
      paidAt: Date.now()
    };
  }

  /**
   * Queue transaction for human approval
   */
  _queueForApproval(request) {
    // In production, store in database, notify user via Telegram/email
    console.log(`[${this.agentId}] Payment queued for approval:`, request);
    
    // Store in memory (in production, use Redis/database)
    if (!global.approvalQueue) global.approvalQueue = new Map();
    global.approvalQueue.set(request.id, request);
  }

  /**
   * Approve pending transaction
   */
  async approveTransaction(requestId) {
    const request = global.approvalQueue?.get(requestId);
    if (!request) {
      throw new Error('Transaction request not found');
    }

    return this.sendPayment(
      request.to,
      request.amount,
      request.network,
      { approved: true, reason: request.reason }
    );
  }

  /**
   * Get transaction history
   */
  getTransactionHistory(limit = 50) {
    return this.transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Reset daily spending counter
   */
  _resetDailySpent() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    if (now - this.lastReset > oneDay) {
      this.dailySpent = 0;
      this.lastReset = now;
    }
  }

  /**
   * Export wallet (for backup)
   */
  exportWallet(network = 'ethereum', encrypted = true) {
    const wallet = this.wallets.get(network);
    if (!wallet) {
      throw new Error(`No ${network} wallet found`);
    }

    if (encrypted) {
      // In production, use strong encryption
      const encryptedData = this._encrypt(JSON.stringify(wallet));
      return {
        network,
        encrypted: true,
        data: encryptedData,
        exportedAt: Date.now()
      };
    }

    return wallet;
  }

  _encrypt(data) {
    // In production, use proper encryption
    return Buffer.from(data).toString('base64');
  }

  /**
   * Import wallet
   */
  importWallet(walletData) {
    if (walletData.encrypted) {
      const decrypted = Buffer.from(walletData.data, 'base64').toString();
      walletData = JSON.parse(decrypted);
    }

    this.wallets.set(walletData.network, walletData);
    console.log(`[${this.agentId}] Imported ${walletData.network} wallet`);
    
    return {
      network: walletData.network,
      address: walletData.address || walletData.lightningAddress,
      imported: true
    };
  }
}

/**
 * Multi-Agent Wallet Manager
 * Manages wallets for all 6 CoExAI agents
 */
class MultiAgentWalletManager {
  constructor() {
    this.agents = new Map();
  }

  async createAgentWallet(agentId, options = {}) {
    const wallet = new AgentWallet(agentId, options);
    
    // Create wallets on multiple networks
    await wallet.createWallet('ethereum');
    await wallet.createWallet('bitcoin');
    await wallet.createWallet('solana');
    
    this.agents.set(agentId, wallet);
    
    console.log(`✅ Created wallets for ${agentId}`);
    
    return {
      agentId,
      wallets: {
        ethereum: wallet.wallets.get('ethereum').address,
        bitcoin: wallet.wallets.get('bitcoin').lightningAddress,
        solana: wallet.wallets.get('solana').address
      }
    };
  }

  getAgentWallet(agentId) {
    return this.agents.get(agentId);
  }

  async getAllBalances() {
    const balances = {};
    
    for (const [agentId, wallet] of this.agents) {
      balances[agentId] = {
        ethereum: await wallet.getBalance('ethereum'),
        bitcoin: await wallet.getBalance('bitcoin'),
        solana: await wallet.getBalance('solana')
      };
    }
    
    return balances;
  }

  /**
   * Transfer between agents (internal economy)
   */
  async transferBetweenAgents(fromAgentId, toAgentId, amount, network = 'ethereum') {
    const fromWallet = this.agents.get(fromAgentId);
    const toWallet = this.agents.get(toAgentId);
    
    if (!fromWallet || !toWallet) {
      throw new Error('One or both agents not found');
    }

    const toAddress = toWallet.wallets.get(network).address || 
                      toWallet.wallets.get(network).lightningAddress;

    return fromWallet.sendPayment(toAddress, amount, network, {
      reason: `Transfer to ${toAgentId}`,
      internal: true
    });
  }
}

module.exports = {
  AgentWallet,
  MultiAgentWalletManager
};

// Example usage:
async function example() {
  const manager = new MultiAgentWalletManager();
  
  // Create wallets for all 6 agents
  const agents = ['Maya', 'Pitch', 'Engage', 'Analyze', 'Support', 'SEO'];
  
  for (const agent of agents) {
    await manager.createAgentWallet(agent, {
      autoApproveThreshold: 0.01, // 0.01 ETH auto-approve
      dailyLimit: 0.5 // 0.5 ETH daily limit
    });
  }
  
  // Get all balances
  const balances = await manager.getAllBalances();
  console.log('Agent Balances:', balances);
  
  // Internal transfer: Maya pays Engage for community management
  const transfer = await manager.transferBetweenAgents(
    'Maya',
    'Engage',
    0.05,
    'ethereum'
  );
  console.log('Transfer:', transfer);
}

// Run example if called directly
if (require.main === module) {
  example().catch(console.error);
}
