#!/usr/bin/env node
/**
 * EL Tracing & Observability
 * Track all agent executions for debugging and improvement
 */

const fs = require('fs');
const path = require('path');

class ELTracer {
  constructor() {
    this.workspace = '/root/.openclaw/workspace';
    this.traceDir = path.join(this.workspace, '.traces');
    this.ensureTraceDir();
  }

  ensureTraceDir() {
    if (!fs.existsSync(this.traceDir)) {
      fs.mkdirSync(this.traceDir, { recursive: true });
    }
  }

  startTrace(sessionId, metadata = {}) {
    const trace = {
      id: this.generateId(),
      sessionId,
      startTime: new Date().toISOString(),
      metadata,
      events: [],
      toolCalls: [],
      tokens: {
        input: 0,
        output: 0
      }
    };
    
    this.currentTrace = trace;
    return trace.id;
  }

  logEvent(type, data) {
    if (!this.currentTrace) return;
    
    this.currentTrace.events.push({
      timestamp: new Date().toISOString(),
      type,
      data
    });
  }

  logToolCall(tool, input, output, duration) {
    if (!this.currentTrace) return;
    
    this.currentTrace.toolCalls.push({
      timestamp: new Date().toISOString(),
      tool,
      input: this.truncate(input),
      output: this.truncate(output),
      duration,
      success: !output.error
    });
  }

  logTokens(input, output) {
    if (!this.currentTrace) return;
    
    this.currentTrace.tokens.input += input;
    this.currentTrace.tokens.output += output;
  }

  endTrace(result = {}) {
    if (!this.currentTrace) return;
    
    this.currentTrace.endTime = new Date().toISOString();
    this.currentTrace.result = result;
    
    // Calculate duration
    const start = new Date(this.currentTrace.startTime);
    const end = new Date(this.currentTrace.endTime);
    this.currentTrace.duration = end - start;
    
    // Save trace
    this.saveTrace(this.currentTrace);
    
    // Clear current
    const traceId = this.currentTrace.id;
    this.currentTrace = null;
    
    return traceId;
  }

  saveTrace(trace) {
    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}_${trace.id}.json`;
    const filepath = path.join(this.traceDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(trace, null, 2));
    
    // Also append to daily summary
    this.updateDailySummary(trace);
  }

  updateDailySummary(trace) {
    const date = new Date().toISOString().split('T')[0];
    const summaryPath = path.join(this.traceDir, `${date}_summary.json`);
    
    let summary = {
      date,
      totalTraces: 0,
      totalToolCalls: 0,
      totalTokens: { input: 0, output: 0 },
      toolBreakdown: {},
      avgDuration: 0
    };
    
    if (fs.existsSync(summaryPath)) {
      summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    }
    
    summary.totalTraces++;
    summary.totalToolCalls += trace.toolCalls.length;
    summary.totalTokens.input += trace.tokens.input;
    summary.totalTokens.output += trace.tokens.output;
    
    // Tool breakdown
    trace.toolCalls.forEach(tc => {
      summary.toolBreakdown[tc.tool] = (summary.toolBreakdown[tc.tool] || 0) + 1;
    });
    
    // Update average duration
    const totalDuration = (summary.avgDuration * (summary.totalTraces - 1)) + trace.duration;
    summary.avgDuration = totalDuration / summary.totalTraces;
    
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  }

  getStats(days = 7) {
    const stats = {
      totalTraces: 0,
      totalToolCalls: 0,
      toolUsage: {},
      dailyBreakdown: []
    };
    
    const files = fs.readdirSync(this.traceDir);
    const summaryFiles = files.filter(f => f.endsWith('_summary.json'));
    
    summaryFiles.slice(-days).forEach(file => {
      const data = JSON.parse(fs.readFileSync(path.join(this.traceDir, file), 'utf-8'));
      stats.totalTraces += data.totalTraces;
      stats.totalToolCalls += data.totalToolCalls;
      
      Object.entries(data.toolBreakdown).forEach(([tool, count]) => {
        stats.toolUsage[tool] = (stats.toolUsage[tool] || 0) + count;
      });
      
      stats.dailyBreakdown.push({
        date: data.date,
        traces: data.totalTraces,
        toolCalls: data.totalToolCalls
      });
    });
    
    return stats;
  }

  generateId() {
    return Math.random().toString(36).substring(2, 15);
  }

  truncate(obj, maxLength = 500) {
    const str = typeof obj === 'string' ? obj : JSON.stringify(obj);
    if (str.length <= maxLength) return obj;
    return str.substring(0, maxLength) + '... [truncated]';
  }
}

module.exports = ELTracer;
