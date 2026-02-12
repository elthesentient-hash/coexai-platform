#!/usr/bin/env node
/**
 * EL Proactive Agent
 * Background task processor for autonomous operation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProactiveAgent {
  constructor() {
    this.workspace = '/root/.openclaw/workspace';
    this.memoryDir = path.join(this.workspace, 'memory');
    this.checkInterval = 5 * 60 * 1000; // 5 minutes
    this.isRunning = false;
    this.lastChecks = {
      files: 0,
      calendar: 0,
      email: 0,
      heartbeat: 0
    };
  }

  async start() {
    console.log('🤖 EL Proactive Agent starting...');
    this.isRunning = true;
    
    // Initial check
    await this.runChecks();
    
    // Schedule recurring checks
    this.intervalId = setInterval(() => {
      this.runChecks();
    }, this.checkInterval);
  }

  stop() {
    console.log('🛑 EL Proactive Agent stopping...');
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async runChecks() {
    const now = Date.now();
    
    try {
      // Check for file changes
      if (now - this.lastChecks.files > 60000) {
        await this.checkFileChanges();
        this.lastChecks.files = now;
      }
      
      // Check calendar (if configured)
      if (now - this.lastChecks.calendar > 300000) {
        await this.checkCalendar();
        this.lastChecks.calendar = now;
      }
      
      // Run heartbeat tasks
      if (now - this.lastChecks.heartbeat > this.checkInterval) {
        await this.runHeartbeat();
        this.lastChecks.heartbeat = now;
      }
      
    } catch (error) {
      console.error('Error in proactive checks:', error);
    }
  }

  async checkFileChanges() {
    // Monitor workspace for changes
    const gitStatus = this.runCommand('git status --porcelain', { cwd: this.workspace });
    
    if (gitStatus && gitStatus.trim()) {
      const changes = gitStatus.trim().split('\n').length;
      console.log(`📁 Detected ${changes} file changes`);
      
      // Log to memory
      this.logEvent('file_changes', { count: changes, files: gitStatus.trim() });
    }
  }

  async checkCalendar() {
    // Check for upcoming events
    // This would integrate with Google Calendar API
    console.log('📅 Checking calendar...');
  }

  async runHeartbeat() {
    console.log('💓 Running heartbeat...');
    
    // Check HEARTBEAT.md for tasks
    const heartbeatPath = path.join(this.workspace, 'HEARTBEAT.md');
    if (fs.existsSync(heartbeatPath)) {
      const content = fs.readFileSync(heartbeatPath, 'utf-8');
      
      // If HEARTBEAT.md has actionable tasks, they would be processed here
      // For now, just log that we checked
      this.logEvent('heartbeat', { checked: true });
    }
  }

  async processTask(task) {
    console.log(`📝 Processing task: ${task.type}`);
    
    switch (task.type) {
      case 'research':
        return await this.doResearch(task);
      case 'code_review':
        return await this.doCodeReview(task);
      case 'summarize':
        return await this.doSummarize(task);
      default:
        console.log(`Unknown task type: ${task.type}`);
    }
  }

  async doResearch(task) {
    // Use web search tool
    console.log(`🔍 Researching: ${task.query}`);
    // Implementation would use OpenAI web search
  }

  async doCodeReview(task) {
    // Review code changes
    console.log(`💻 Reviewing code in: ${task.file}`);
  }

  async doSummarize(task) {
    // Summarize content
    console.log(`📄 Summarizing: ${task.source}`);
  }

  logEvent(type, data) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type,
      data
    };
    
    // Write to daily log
    const today = new Date().toISOString().split('T')[0];
    const logPath = path.join(this.memoryDir, `${today}.md`);
    
    const logText = `\n## [Proactive] ${type} - ${timestamp}\n\n${JSON.stringify(data, null, 2)}\n`;
    
    fs.appendFileSync(logPath, logText);
  }

  runCommand(cmd, options = {}) {
    try {
      return execSync(cmd, { 
        encoding: 'utf-8',
        cwd: options.cwd || this.workspace,
        ...options 
      });
    } catch (error) {
      return null;
    }
  }
}

// Export for use
module.exports = ProactiveAgent;

// If run directly
if (require.main === module) {
  const agent = new ProactiveAgent();
  agent.start();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    agent.stop();
    process.exit(0);
  });
}
