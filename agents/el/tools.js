#!/usr/bin/env node
/**
 * EL Tool Registry
 * OpenAI Responses API compatible tools
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ToolRegistry {
  constructor() {
    this.tools = new Map();
    this.registerDefaults();
  }

  registerDefaults() {
    // File system tools
    this.register('read_file', this.readFile.bind(this));
    this.register('write_file', this.writeFile.bind(this));
    this.register('edit_file', this.editFile.bind(this));
    this.register('list_directory', this.listDirectory.bind(this));
    this.register('search_files', this.searchFiles.bind(this));
    
    // Execution tools
    this.register('execute_command', this.executeCommand.bind(this));
    this.register('run_script', this.runScript.bind(this));
    
    // Web tools (when web_search not available)
    this.register('web_fetch', this.webFetch.bind(this));
    
    // Knowledge tools
    this.register('search_memory', this.searchMemory.bind(this));
    this.register('update_memory', this.updateMemory.bind(this));
  }

  register(name, handler) {
    this.tools.set(name, handler);
  }

  async execute(name, args) {
    const handler = this.tools.get(name);
    if (!handler) {
      throw new Error(`Tool not found: ${name}`);
    }
    
    const startTime = Date.now();
    try {
      const result = await handler(args);
      return {
        success: true,
        result,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  // === Tool Implementations ===

  async readFile({ path: filePath, offset, limit }) {
    const fullPath = this.resolvePath(filePath);
    let content = fs.readFileSync(fullPath, 'utf-8');
    
    if (offset || limit) {
      const lines = content.split('\n');
      const start = (offset || 1) - 1;
      content = lines.slice(start, start + (limit || lines.length)).join('\n');
    }
    
    return { content, path: filePath };
  }

  async writeFile({ path: filePath, content }) {
    const fullPath = this.resolvePath(filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content);
    return { path: filePath, bytes: content.length };
  }

  async editFile({ path: filePath, oldText, newText }) {
    const fullPath = this.resolvePath(filePath);
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    if (!content.includes(oldText)) {
      throw new Error('Old text not found in file');
    }
    
    const newContent = content.replace(oldText, newText);
    fs.writeFileSync(fullPath, newContent);
    
    return { path: filePath, replaced: true };
  }

  async listDirectory({ path: dirPath }) {
    const fullPath = this.resolvePath(dirPath);
    const entries = fs.readdirSync(fullPath, { withFileTypes: true });
    
    return entries.map(e => ({
      name: e.name,
      type: e.isDirectory() ? 'directory' : 'file'
    }));
  }

  async searchFiles({ query, path: searchPath = '.' }) {
    const fullPath = this.resolvePath(searchPath);
    const results = [];
    
    const searchDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          searchDir(entryPath);
        } else if (entry.isFile()) {
          try {
            const content = fs.readFileSync(entryPath, 'utf-8');
            if (content.toLowerCase().includes(query.toLowerCase())) {
              results.push({
                path: entryPath.replace(fullPath, searchPath),
                matches: this.extractMatches(content, query)
              });
            }
          } catch (e) {
            // Binary file, skip
          }
        }
      }
    };
    
    searchDir(fullPath);
    return results;
  }

  async executeCommand({ command, timeout = 30000, cwd }) {
    const result = execSync(command, {
      encoding: 'utf-8',
      timeout,
      cwd: cwd || '/root/.openclaw/workspace'
    });
    
    return { output: result };
  }

  async runScript({ script, args = [], interpreter = 'node' }) {
    const scriptPath = this.resolvePath(script);
    const result = execSync(`${interpreter} ${scriptPath} ${args.join(' ')}`, {
      encoding: 'utf-8',
      timeout: 60000
    });
    
    return { output: result };
  }

  async webFetch({ url, extractMode = 'markdown' }) {
    // Placeholder - would use actual web fetch
    return { url, content: '[Web fetch would happen here]' };
  }

  async searchMemory({ query }) {
    const memoryPath = '/root/.openclaw/workspace/MEMORY.md';
    if (!fs.existsSync(memoryPath)) {
      return { results: [] };
    }
    
    const content = fs.readFileSync(memoryPath, 'utf-8');
    const lines = content.split('\n');
    const results = [];
    
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(query.toLowerCase())) {
        results.push({
          line: idx + 1,
          content: line
        });
      }
    });
    
    return { results };
  }

  async updateMemory({ content }) {
    const memoryPath = '/root/.openclaw/workspace/MEMORY.md';
    const today = new Date().toISOString().split('T')[0];
    
    const entry = `\n## ${today}\n\n${content}\n`;
    fs.appendFileSync(memoryPath, entry);
    
    return { updated: true, path: memoryPath };
  }

  // === Helpers ===

  resolvePath(filePath) {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.join('/root/.openclaw/workspace', filePath);
  }

  extractMatches(content, query) {
    const lines = content.split('\n');
    const matches = [];
    
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(query.toLowerCase())) {
        matches.push({ line: idx + 1, text: line.trim() });
      }
    });
    
    return matches.slice(0, 5); // Limit matches
  }

  getToolDefinitions() {
    return [
      {
        type: 'function',
        function: {
          name: 'read_file',
          description: 'Read contents of a file',
          parameters: {
            type: 'object',
            properties: {
              path: { type: 'string' },
              offset: { type: 'number' },
              limit: { type: 'number' }
            },
            required: ['path']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'execute_command',
          description: 'Execute a shell command',
          parameters: {
            type: 'object',
            properties: {
              command: { type: 'string' },
              timeout: { type: 'number' },
              cwd: { type: 'string' }
            },
            required: ['command']
          }
        }
      }
      // ... more tool definitions
    ];
  }
}

module.exports = ToolRegistry;
