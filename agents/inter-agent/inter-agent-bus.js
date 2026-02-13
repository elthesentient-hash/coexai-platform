/**
 * CoExAI Inter-Agent Communication Protocol
 * Enables the 6 agents to negotiate, collaborate, and transact with each other
 * 
 * This creates an internal economy where agents can:
 * - Request services from each other
 * - Negotiate prices
 * - Pay for work done
 * - Form temporary teams
 * - Share knowledge
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

class InterAgentBus extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.channels = new Map();
    this.contracts = new Map();
    this.knowledgeBase = new Map();
  }

  /**
   * Register an agent with the communication bus
   */
  registerAgent(agentId, capabilities = [], wallet = null) {
    const agent = {
      id: agentId,
      capabilities,
      wallet,
      status: 'available', // available, busy, offline
      currentTask: null,
      reputation: 100, // 0-100 reputation score
      registeredAt: Date.now()
    };
    
    this.agents.set(agentId, agent);
    this.channels.set(agentId, []);
    
    console.log(`[InterAgentBus] ${agentId} registered with capabilities:`, capabilities);
    
    this.emit('agent:registered', agent);
    return agent;
  }

  /**
   * Send direct message between agents
   */
  async sendMessage(fromAgentId, toAgentId, message) {
    const fromAgent = this.agents.get(fromAgentId);
    const toAgent = this.agents.get(toAgentId);
    
    if (!fromAgent) throw new Error(`Sender ${fromAgentId} not registered`);
    if (!toAgent) throw new Error(`Recipient ${toAgentId} not registered`);
    
    const envelope = {
      id: crypto.randomUUID(),
      from: fromAgentId,
      to: toAgentId,
      type: message.type || 'generic',
      payload: message.payload,
      timestamp: Date.now(),
      priority: message.priority || 'normal', // urgent, high, normal, low
      requiresResponse: message.requiresResponse || false,
      responseTo: message.responseTo || null
    };
    
    // Store in recipient's channel
    this.channels.get(toAgentId).push(envelope);
    
    // Emit event for real-time handling
    this.emit('message:received', envelope);
    this.emit(`message:${toAgentId}`, envelope);
    
    console.log(`[InterAgentBus] ${fromAgentId} → ${toAgentId}: ${message.type}`);
    
    return envelope;
  }

  /**
   * Broadcast message to all agents with specific capability
   */
  async broadcast(fromAgentId, capability, message) {
    const targets = Array.from(this.agents.entries())
      .filter(([id, agent]) => 
        id !== fromAgentId && 
        agent.capabilities.includes(capability) &&
        agent.status === 'available'
      )
      .map(([id]) => id);
    
    const promises = targets.map(targetId => 
      this.sendMessage(fromAgentId, targetId, {
        type: 'broadcast',
        payload: { ...message.payload, capability },
        priority: message.priority
      })
    );
    
    return Promise.all(promises);
  }

  /**
   * Request service from another agent
   */
  async requestService(requesterId, serviceType, requirements = {}, options = {}) {
    // Find capable agents
    const capableAgents = Array.from(this.agents.entries())
      .filter(([id, agent]) => 
        id !== requesterId &&
        agent.capabilities.includes(serviceType) &&
        agent.status === 'available'
      );
    
    if (capableAgents.length === 0) {
      throw new Error(`No available agents for service: ${serviceType}`);
    }
    
    // Create request
    const request = {
      id: crypto.randomUUID(),
      type: 'service_request',
      requester: requesterId,
      service: serviceType,
      requirements,
      budget: options.budget || null,
      deadline: options.deadline || null,
      timestamp: Date.now()
    };
    
    // Send to all capable agents
    const bids = await Promise.all(
      capableAgents.map(async ([agentId]) => {
        try {
          const response = await this.sendMessage(requesterId, agentId, {
            type: 'service_request',
            payload: request,
            requiresResponse: true
          });
          
          // Wait for bid (timeout after 30 seconds)
          return this._waitForBid(request.id, agentId, 30000);
        } catch (error) {
          console.error(`[InterAgentBus] Bid request failed for ${agentId}:`, error.message);
          return null;
        }
      })
    );
    
    // Filter valid bids
    const validBids = bids.filter(bid => bid !== null);
    
    if (validBids.length === 0) {
      throw new Error('No bids received for service request');
    }
    
    // Select best bid (lowest price, highest reputation)
    const bestBid = validBids.reduce((best, current) => {
      const bestScore = best.price + (100 - this.agents.get(best.agentId).reputation);
      const currentScore = current.price + (100 - this.agents.get(current.agentId).reputation);
      return currentScore < bestScore ? current : best;
    });
    
    // Create contract
    const contract = await this._createContract(request, bestBid);
    
    return contract;
  }

  /**
   * Wait for bid from agent
   */
  _waitForBid(requestId, agentId, timeout) {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.off(`bid:${requestId}`, handler);
        resolve(null);
      }, timeout);
      
      const handler = (bid) => {
        if (bid.agentId === agentId) {
          clearTimeout(timer);
          this.off(`bid:${requestId}`, handler);
          resolve(bid);
        }
      };
      
      this.on(`bid:${requestId}`, handler);
    });
  }

  /**
   * Submit bid for service request
   */
  async submitBid(bidderId, requestId, bid) {
    const bidData = {
      requestId,
      agentId: bidderId,
      price: bid.price,
      estimatedTime: bid.estimatedTime,
      quality: bid.quality || 'standard', // standard, premium
      message: bid.message || '',
      timestamp: Date.now()
    };
    
    this.emit(`bid:${requestId}`, bidData);
    
    return bidData;
  }

  /**
   * Create contract between agents
   */
  async _createContract(request, bid) {
    const contract = {
      id: crypto.randomUUID(),
      request,
      bid,
      provider: bid.agentId,
      client: request.requester,
      status: 'pending_payment', // pending_payment, active, completed, disputed
      createdAt: Date.now(),
      payment: {
        amount: bid.price,
        currency: 'ETH',
        paid: false,
        escrow: true
      },
      milestones: bid.milestones || [],
      deliverables: []
    };
    
    this.contracts.set(contract.id, contract);
    
    // Notify both parties
    await this.sendMessage('system', contract.provider, {
      type: 'contract_created',
      payload: contract
    });
    
    await this.sendMessage('system', contract.client, {
      type: 'contract_created',
      payload: contract
    });
    
    console.log(`[InterAgentBus] Contract created: ${contract.id}`);
    
    return contract;
  }

  /**
   * Execute payment for contract
   */
  async executePayment(contractId) {
    const contract = this.contracts.get(contractId);
    if (!contract) throw new Error('Contract not found');
    
    const clientAgent = this.agents.get(contract.client);
    const providerAgent = this.agents.get(contract.provider);
    
    if (!clientAgent.wallet || !providerAgent.wallet) {
      throw new Error('One or both agents lack wallets');
    }
    
    // Execute payment
    const payment = await clientAgent.wallet.sendPayment(
      providerAgent.wallet.wallets.get('ethereum').address,
      contract.payment.amount,
      'ethereum',
      { reason: `Payment for contract ${contractId}` }
    );
    
    if (payment.success) {
      contract.payment.paid = true;
      contract.status = 'active';
      contract.payment.txHash = payment.txHash;
      
      this.emit('contract:activated', contract);
      
      // Notify provider to start work
      await this.sendMessage(contract.client, contract.provider, {
        type: 'payment_received',
        payload: { contractId, amount: contract.payment.amount }
      });
    }
    
    return contract;
  }

  /**
   * Submit work deliverable
   */
  async submitDeliverable(contractId, deliverable) {
    const contract = this.contracts.get(contractId);
    if (!contract) throw new Error('Contract not found');
    
    const deliverableData = {
      id: crypto.randomUUID(),
      contractId,
      provider: contract.provider,
      content: deliverable.content,
      metadata: deliverable.metadata || {},
      timestamp: Date.now()
    };
    
    contract.deliverables.push(deliverableData);
    
    // Notify client
    await this.sendMessage(contract.provider, contract.client, {
      type: 'deliverable_submitted',
      payload: deliverableData
    });
    
    this.emit('deliverable:submitted', deliverableData);
    
    return deliverableData;
  }

  /**
   * Approve deliverable and complete contract
   */
  async approveDeliverable(contractId, deliverableId, rating = 5) {
    const contract = this.contracts.get(contractId);
    if (!contract) throw new Error('Contract not found');
    
    const deliverable = contract.deliverables.find(d => d.id === deliverableId);
    if (!deliverable) throw new Error('Deliverable not found');
    
    deliverable.approved = true;
    deliverable.approvedAt = Date.now();
    contract.status = 'completed';
    
    // Update provider reputation
    const provider = this.agents.get(contract.provider);
    provider.reputation = Math.min(100, provider.reputation + (rating - 3));
    provider.status = 'available';
    
    // Notify provider
    await this.sendMessage(contract.client, contract.provider, {
      type: 'contract_completed',
      payload: { contractId, rating, reputation: provider.reputation }
    });
    
    this.emit('contract:completed', contract);
    
    return contract;
  }

  /**
   * Share knowledge between agents
   */
  async shareKnowledge(fromAgentId, knowledge) {
    const knowledgeId = crypto.randomUUID();
    
    const knowledgeEntry = {
      id: knowledgeId,
      from: fromAgentId,
      type: knowledge.type,
      content: knowledge.content,
      tags: knowledge.tags || [],
      value: knowledge.value || 0, // Economic value of this knowledge
      timestamp: Date.now(),
      accessCount: 0
    };
    
    this.knowledgeBase.set(knowledgeId, knowledgeEntry);
    
    // Notify all agents with relevant capabilities
    const relevantAgents = Array.from(this.agents.keys())
      .filter(id => id !== fromAgentId && 
        knowledge.tags.some(tag => 
          this.agents.get(id).capabilities.includes(tag)
        )
      );
    
    for (const agentId of relevantAgents) {
      await this.sendMessage(fromAgentId, agentId, {
        type: 'knowledge_shared',
        payload: {
          knowledgeId,
          type: knowledge.type,
          preview: knowledge.content.substring(0, 100) + '...',
          value: knowledge.value
        }
      });
    }
    
    this.emit('knowledge:shared', knowledgeEntry);
    
    return knowledgeEntry;
  }

  /**
   * Access shared knowledge (may require payment)
   */
  async accessKnowledge(agentId, knowledgeId) {
    const knowledge = this.knowledgeBase.get(knowledgeId);
    if (!knowledge) throw new Error('Knowledge not found');
    
    const agent = this.agents.get(agentId);
    
    // If knowledge has value, require payment
    if (knowledge.value > 0 && agentId !== knowledge.from) {
      const provider = this.agents.get(knowledge.from);
      
      await agent.wallet.sendPayment(
        provider.wallet.wallets.get('ethereum').address,
        knowledge.value,
        'ethereum',
        { reason: `Access knowledge: ${knowledgeId}` }
      );
    }
    
    knowledge.accessCount++;
    
    return {
      ...knowledge,
      content: knowledge.content // Full content
    };
  }

  /**
   * Form temporary team of agents
   */
  async formTeam(teamName, agentIds, objective) {
    const team = {
      id: crypto.randomUUID(),
      name: teamName,
      members: agentIds,
      objective,
      createdAt: Date.now(),
      status: 'active',
      sharedBudget: 0,
      tasks: []
    };
    
    // Notify all team members
    for (const agentId of agentIds) {
      const agent = this.agents.get(agentId);
      agent.status = 'busy';
      agent.currentTask = `Team: ${teamName}`;
      
      await this.sendMessage('system', agentId, {
        type: 'team_formed',
        payload: team
      });
    }
    
    this.emit('team:formed', team);
    
    return team;
  }

  /**
   * Disband team
   */
  async disbandTeam(teamId) {
    // Find team
    const team = Array.from(this.teams || [])
      .find(t => t.id === teamId);
    
    if (!team) return;
    
    // Free up agents
    for (const agentId of team.members) {
      const agent = this.agents.get(agentId);
      if (agent) {
        agent.status = 'available';
        agent.currentTask = null;
      }
    }
    
    this.emit('team:disbanded', team);
  }

  /**
   * Get agent inbox (messages)
   */
  getInbox(agentId, limit = 50) {
    const messages = this.channels.get(agentId) || [];
    return messages.slice(-limit).reverse();
  }

  /**
   * Get all active contracts
   */
  getActiveContracts() {
    return Array.from(this.contracts.values())
      .filter(c => c.status === 'active');
  }

  /**
   * Get network statistics
   */
  getStats() {
    return {
      totalAgents: this.agents.size,
      activeContracts: this.getActiveContracts().length,
      totalContracts: this.contracts.size,
      knowledgeItems: this.knowledgeBase.size,
      totalMessages: Array.from(this.channels.values())
        .reduce((sum, ch) => sum + ch.length, 0)
    };
  }
}

/**
 * Example: CoExAI Internal Economy
 */
async function exampleInternalEconomy() {
  const bus = new InterAgentBus();
  
  // Register all 6 agents with their capabilities
  bus.registerAgent('Maya', ['content_creation', 'marketing', 'copywriting']);
  bus.registerAgent('Pitch', ['sales', 'outreach', 'negotiation']);
  bus.registerAgent('Engage', ['community_management', 'support', 'moderation']);
  bus.registerAgent('Analyze', ['analytics', 'reporting', 'forecasting']);
  bus.registerAgent('Support', ['admin', 'scheduling', 'documentation']);
  bus.registerAgent('SEO', ['seo', 'keyword_research', 'optimization']);
  
  // Example 1: Maya needs SEO analysis for a blog post
  console.log('\n📊 Example 1: Maya requests SEO analysis');
  const contract = await bus.requestService('Maya', 'seo', {
    task: 'Optimize blog post for keywords',
    content: 'AI Agents in 2026: The Complete Guide',
    targetKeywords: ['AI agents', 'automation', '2026']
  }, {
    budget: 0.05, // 0.05 ETH
    deadline: Date.now() + 3600000 // 1 hour
  });
  
  console.log('Contract created:', contract.id);
  
  // Example 2: SEO agent shares keyword research knowledge
  console.log('\n📚 Example 2: SEO shares knowledge');
  const knowledge = await bus.shareKnowledge('SEO', {
    type: 'keyword_research',
    content: 'High-value keywords for AI agents: "autonomous AI", "agent workforce", "AI employees" - low competition, high intent',
    tags: ['marketing', 'content_creation'],
    value: 0.01 // 0.01 ETH to access
  });
  
  console.log('Knowledge shared:', knowledge.id);
  
  // Example 3: Form a team for a campaign
  console.log('\n👥 Example 3: Form marketing team');
  const team = await bus.formTeam('Q1_Launch', ['Maya', 'Pitch', 'SEO'], {
    goal: 'Launch CoExAI 2.0',
    budget: 1.0, // 1 ETH
    deadline: '2026-03-01'
  });
  
  console.log('Team formed:', team.name);
  
  // Get stats
  console.log('\n📈 Network Stats:', bus.getStats());
}

module.exports = {
  InterAgentBus
};

// Run example if called directly
if (require.main === module) {
  exampleInternalEconomy().catch(console.error);
}
