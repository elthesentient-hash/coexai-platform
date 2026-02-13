/**
 * EL Coding Assistant
 * Advanced code generation, refactoring, and review
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CodingAssistant {
  constructor(workspacePath = '/root/.openclaw/workspace') {
    this.workspace = workspacePath;
  }

  /**
   * Analyze codebase structure
   */
  analyzeCodebase(dir = '.', depth = 2) {
    const results = {
      files: [],
      directories: [],
      languages: {},
      totalLines: 0
    };
    
    const analyzeDir = (currentDir, currentDepth) => {
      if (currentDepth > depth) return;
      
      const items = fs.readdirSync(path.join(this.workspace, currentDir), { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item.name);
        
        if (item.isDirectory()) {
          if (!item.name.startsWith('.') && item.name !== 'node_modules') {
            results.directories.push(fullPath);
            analyzeDir(fullPath, currentDepth + 1);
          }
        } else {
          const ext = path.extname(item.name);
          results.files.push({
            path: fullPath,
            name: item.name,
            extension: ext,
            size: fs.statSync(path.join(this.workspace, fullPath)).size
          });
          
          // Count lines
          try {
            const content = fs.readFileSync(path.join(this.workspace, fullPath), 'utf-8');
            const lines = content.split('\n').length;
            results.totalLines += lines;
            
            // Track languages
            const lang = this.getLanguage(ext);
            if (lang) {
              results.languages[lang] = (results.languages[lang] || 0) + lines;
            }
          } catch (e) {
            // Binary file, skip
          }
        }
      }
    };
    
    analyzeDir(dir, 0);
    return results;
  }

  /**
   * Get language from extension
   */
  getLanguage(ext) {
    const map = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.jsx': 'React',
      '.tsx': 'React TS',
      '.html': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rs': 'Rust',
      '.c': 'C',
      '.cpp': 'C++',
      '.json': 'JSON',
      '.md': 'Markdown',
      '.sql': 'SQL',
      '.sh': 'Shell',
      '.yml': 'YAML',
      '.yaml': 'YAML'
    };
    return map[ext] || null;
  }

  /**
   * Generate code with context awareness
   */
  generateCode(specification, context = {}) {
    const prompt = this.buildCodePrompt(specification, context);
    
    // In actual implementation, this would call OpenAI API
    // For now, return structure
    return {
      prompt,
      estimatedComplexity: this.estimateComplexity(specification),
      suggestedFiles: this.suggestFileStructure(specification),
      notes: 'Use this prompt with GPT-4 or Claude for code generation'
    };
  }

  /**
   * Build detailed code generation prompt
   */
  buildCodePrompt(spec, context) {
    return `Generate code for: ${spec}

Context:
${Object.entries(context).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Requirements:
- Follow existing code style
- Include error handling
- Add comments for complex logic
- Export all public functions
- Include basic test cases

Output format:
\`\`\`[language]
[code]
\`\`\``;
  }

  /**
   * Multi-file refactoring
   */
  async refactor(files, transformation) {
    const results = [];
    
    for (const file of files) {
      const filePath = path.join(this.workspace, file);
      
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const newContent = await this.applyTransformation(content, transformation);
        
        if (content !== newContent) {
          // Create backup
          const backupPath = `${filePath}.refactor.bak`;
          fs.writeFileSync(backupPath, content);
          
          // Apply change
          fs.writeFileSync(filePath, newContent);
          
          results.push({
            file,
            status: 'modified',
            backupPath
          });
        } else {
          results.push({
            file,
            status: 'unchanged'
          });
        }
      } catch (error) {
        results.push({
          file,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Apply transformation to code
   */
  async applyTransformation(content, transformation) {
    // Simple transformations
    switch (transformation.type) {
      case 'rename-function':
        const regex = new RegExp(`\\b${transformation.oldName}\\b`, 'g');
        return content.replace(regex, transformation.newName);
        
      case 'add-import':
        if (!content.includes(transformation.import)) {
          return `${transformation.import}\n${content}`;
        }
        return content;
        
      case 'replace-pattern':
        return content.replace(
          new RegExp(transformation.pattern, 'g'),
          transformation.replacement
        );
        
      default:
        return content;
    }
  }

  /**
   * Code review suggestions
   */
  reviewCode(filePath) {
    const content = fs.readFileSync(path.join(this.workspace, filePath), 'utf-8');
    const suggestions = [];
    
    const lines = content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      
      // Check for common issues
      if (line.includes('console.log') && !line.includes('//')) {
        suggestions.push({
          line: lineNum,
          type: 'warning',
          message: 'Console.log found - consider removing for production',
          code: line.trim()
        });
      }
      
      if (line.length > 120) {
        suggestions.push({
          line: lineNum,
          type: 'style',
          message: 'Line exceeds 120 characters',
          code: line.trim().substring(0, 50) + '...'
        });
      }
      
      if (line.includes('TODO') || line.includes('FIXME')) {
        suggestions.push({
          line: lineNum,
          type: 'info',
          message: 'TODO/FIXME comment found',
          code: line.trim()
        });
      }
      
      if (/function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/.test(line) && line.length < 80) {
        suggestions.push({
          line: lineNum,
          type: 'style',
          message: 'Consider adding JSDoc comment',
          code: line.trim()
        });
      }
    }
    
    return {
      file: filePath,
      totalLines: lines.length,
      suggestions,
      summary: {
        warnings: suggestions.filter(s => s.type === 'warning').length,
        style: suggestions.filter(s => s.type === 'style').length,
        info: suggestions.filter(s => s.type === 'info').length
      }
    };
  }

  /**
   * Generate test suggestions
   */
  suggestTests(filePath) {
    const content = fs.readFileSync(path.join(this.workspace, filePath), 'utf-8');
    const functionMatches = content.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g) || [];
    
    return functionMatches.map(match => {
      const name = match.match(/function\s+(\w+)/)[1];
      return {
        function: name,
        testTemplate: `describe('${name}', () => {\n  it('should handle normal case', async () => {\n    // TODO: Add test\n  });\n\n  it('should handle edge case', async () => {\n    // TODO: Add edge case test\n  });\n\n  it('should handle errors', async () => {\n    // TODO: Add error test\n  });\n});`
      };
    });
  }

  /**
   * Estimate complexity
   */
  estimateComplexity(spec) {
    const factors = [
      { pattern: /database|db|sql/i, weight: 3 },
      { pattern: /api|endpoint|route/i, weight: 2 },
      { pattern: /auth|login|security/i, weight: 4 },
      { pattern: /multi|several|multiple/i, weight: 2 },
      { pattern: /complex|advanced|sophisticated/i, weight: 3 },
      { pattern: /simple|basic|easy/i, weight: -1 }
    ];
    
    let score = 1;
    for (const factor of factors) {
      if (factor.pattern.test(spec)) {
        score += factor.weight;
      }
    }
    
    if (score <= 2) return 'Low';
    if (score <= 5) return 'Medium';
    return 'High';
  }

  /**
   * Suggest file structure
   */
  suggestFileStructure(spec) {
    const suggestions = [];
    
    if (/api|endpoint|route/i.test(spec)) {
      suggestions.push('src/api/', 'src/routes/', 'src/controllers/');
    }
    if (/database|db|model/i.test(spec)) {
      suggestions.push('src/models/', 'src/db/');
    }
    if (/test|spec/i.test(spec)) {
      suggestions.push('tests/', '__tests__/');
    }
    if (/component|ui|page/i.test(spec)) {
      suggestions.push('src/components/', 'src/pages/');
    }
    
    return suggestions.length > 0 ? suggestions : ['src/', 'lib/'];
  }

  /**
   * Git integration - create PR description
   */
  generatePRDescription(files, description) {
    const changedFiles = files.map(f => `- ${f}`).join('\n');
    
    return `## Summary
${description}

## Changes
${changedFiles}

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Error handling implemented`;
  }
}

module.exports = CodingAssistant;
