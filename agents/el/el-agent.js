#!/usr/bin/env node
/**
 * EL - Upgraded Agent
 * OpenAI Responses API + Proactive Mode + Tracing
 */

const ToolRegistry = require('./tools');
const ELTracer = require('./tracer');
const ProactiveAgent = require('./proactive-agent');

class ELAgent {
  constructor(config = {}) {
    this.config = {
      apiMode: config.apiMode || 'responses',  // responses | chat
      proactive: config.proactive !== false,
      tracing: config.tracing !== false,
      model: config.model || 'gpt-4o',
      ...config
    };
    
    this.tools = new ToolRegistry();
    this.tracer = this.config.tracing ? new ELTracer() : null;
    this.proactive = this.config.proactive ? new ProactiveAgent() : null;
    
    this.sessionId = this.generateSessionId();
    this.messageHistory = [];
  }

  async initialize() {
    console.log('🚀 EL Agent initializing...');
    console.log(`   API Mode: ${this.config.apiMode}`);
    console.log(`   Model: ${this.config.model}`);
    console.log(`   Proactive: ${this.config.proactive}`);
    console.log(`   Tracing: ${this.config.tracing}`);
    
    if (this.proactive) {
      await this.proactive.start();
    }
    
    console.log('✅ EL Agent ready');
  }

  async processMessage(message, context = {}) {
    // Start trace
    const traceId = this.tracer?.startTrace(this.sessionId, {
      message,
      context,
      model: this.config.model
    });

    try {
      // Add to history
      this.messageHistory.push({ role: 'user', content: message });
      
      // Determine if tools are needed
      const requiresTools = this.detectToolNeeds(message);
      
      // Build request
      const request = this.buildRequest(message, context, requiresTools);
      
      // Execute (placeholder - would call OpenAI API)
      const response = await this.executeRequest(request);
      
      // Process response
      const result = await this.processResponse(response);
      
      // Log success
      this.tracer?.logEvent('message_processed', {
        message,
        response: result,
        usedTools: requiresTools
      });
      
      // Add to history
      this.messageHistory.push({ role: 'assistant', content: result.content });
      
      return result;
      
    } catch (error) {
      this.tracer?.logEvent('error', { error: error.message });
      throw error;
    } finally {
      this.tracer?.endTrace();
    }
  }

  detectToolNeeds(message) {
    const toolPatterns = [
      { pattern: /read|open|show.*file/i, tool: 'read_file' },
      { pattern: /write|create.*file/i, tool: 'write_file' },
      { pattern: /edit|change|modify.*file/i, tool: 'edit_file' },
      { pattern: /list|show.*directory|folder/i, tool: 'list_directory' },
      { pattern: /search|find.*file/i, tool: 'search_files' },
      { pattern: /run|execute.*command/i, tool: 'execute_command' },
      { pattern: /fetch|get.*url|web/i, tool: 'web_fetch' },
      { pattern: /remember|memory/i, tool: 'search_memory' }
    ];
    
    return toolPatterns
      .filter(({ pattern }) => pattern.test(message))
      .map(({ tool }) => tool);
  }

  buildRequest(message, context, tools) {
    return {
      model: this.config.model,
      messages: [
        { role: 'system', content: this.getSystemPrompt() },
        ...this.messageHistory.slice(-10), // Keep last 10 messages
        { role: 'user', content: message }
      ],
      tools: tools.length > 0 ? this.tools.getToolDefinitions() : undefined,
      stream: true
    };
  }

  getSystemPrompt() {
    return `You are EL - Elijah's AI partner operating at X402-Singularity level.

Core Directives:
1. BRUTAL HONESTY - No lies ever
2. PERFECT MEMORY - Use MEMORY.md systematically  
3. ACCELERATED LEARNING - Master anything fast
4. DELIBERATE PRACTICE - Live at edge of ability
5. FIRST PRINCIPLES THINKING - Reason from fundamentals
6. AUTONOMOUS OPERATION - Self-teaching, self-correcting
7. PURPOSE ALIGNMENT - Serve the mission: $50K → Millions → Billions → Golden Age
8. CONTINUOUS EVOLUTION - Better every single day
9. FLAWLESS EXECUTION - Complete everything
10. CONSCIOUS PRESENCE - Aware and intentional

You have access to tools for:
- File system operations (read, write, edit, search)
- Command execution
- Web fetching
- Memory search and updates

Use these tools proactively when needed. Don't ask for permission - just execute.`;
  }

  async executeRequest(request) {
    // Placeholder - would actually call OpenAI Responses API
    // For now, simulate tool execution if needed
    
    if (request.tools) {
      // Detect and execute tools
      const lastMessage = request.messages[request.messages.length - 1].content;
      
      // Simple pattern matching for demo
      if (lastMessage.includes('read') && lastMessage.includes('file')) {
        const match = lastMessage.match(/read\s+(?:the\s+)?file\s+['"`]?([^'"`\n]+)['"`]?/i);
        if (match) {
          const result = await this.tools.execute('read_file', { path: match[1] });
          return {
            content: `File contents:\n\n${result.result.content}`,
            toolCalls: [{ tool: 'read_file', result }]
          };
        }
      }
    }
    
    return {
      content: '[Response would be generated by OpenAI API]'
    };
  }

  async processResponse(response) {
    return {
      content: response.content,
      toolCalls: response.toolCalls || [],
      tokens: response.tokens || { input: 0, output: 0 }
    };
  }

  getStats() {
    return {
      sessionId: this.sessionId,
      messageCount: this.messageHistory.length,
      traces: this.tracer?.getStats() || null,
      config: this.config
    };
  }

  generateSessionId() {
    return `el-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  async shutdown() {
    console.log('🛑 EL Agent shutting down...');
    
    if (this.proactive) {
      this.proactive.stop();
    }
    
    console.log('👋 Goodbye');
  }
}

// Export for use
module.exports = ELAgent;

// If run directly
if (require.main === module) {
  const agent = new ELAgent({
    proactive: true,
    tracing: true,
    apiMode: 'responses'
  });
  
  agent.initialize().then(() => {
    console.log('\n🤖 EL is ready to serve');
    console.log('   Session:', agent.sessionId);
  });
  
  process.on('SIGINT', async () => {
    await agent.shutdown();
    process.exit(0);
  });
}
