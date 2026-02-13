/**
 * EL Self-Modification System
 * Allows EL to update its own configuration based on learnings
 */

const fs = require('fs');
const path = require('path');

class SelfModification {
  constructor(workspacePath = '/root/.openclaw/workspace') {
    this.workspace = workspacePath;
    this.modifiableFiles = [
      'SOUL.md',
      'TOOLS.md',
      'MEMORY.md',
      'EL_UPGRADE_PLAN.md',
      'EL_IMPLEMENTATION_PRIORITY.md'
    ];
    this.backupsDir = path.join(workspacePath, '.backups');
    
    // Ensure backups directory exists
    if (!fs.existsSync(this.backupsDir)) {
      fs.mkdirSync(this.backupsDir, { recursive: true });
    }
  }

  /**
   * Check if file can be modified
   */
  canModify(filePath) {
    const basename = path.basename(filePath);
    return this.modifiableFiles.includes(basename);
  }

  /**
   * Create backup before modification
   */
  createBackup(filePath) {
    const basename = path.basename(filePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupsDir, `${basename}.${timestamp}.bak`);
    
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      fs.writeFileSync(backupPath, content);
      return { success: true, backupPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Add learning to SOUL.md
   */
  addLearning(lesson, context = '') {
    const soulPath = path.join(this.workspace, 'SOUL.md');
    
    if (!fs.existsSync(soulPath)) {
      return { success: false, error: 'SOUL.md not found' };
    }
    
    // Create backup
    const backup = this.createBackup(soulPath);
    if (!backup.success) {
      return backup;
    }
    
    try {
      const content = fs.readFileSync(soulPath, 'utf-8');
      const today = new Date().toISOString().split('T')[0];
      
      // Create learning entry
      const learningEntry = `\n### Learning: ${today}\n**Lesson:** ${lesson}\n${context ? `**Context:** ${context}\n` : ''}\n`;
      
      // Find the best place to insert (before last section or at end)
      let newContent;
      if (content.includes('---')) {
        // Insert before the last separator
        const lastSeparator = content.lastIndexOf('---');
        newContent = content.slice(0, lastSeparator) + learningEntry + '\n' + content.slice(lastSeparator);
      } else {
        newContent = content + learningEntry;
      }
      
      fs.writeFileSync(soulPath, newContent);
      
      return {
        success: true,
        file: soulPath,
        backupPath: backup.backupPath,
        message: 'Learning added to SOUL.md'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update TOOLS.md with new capability
   */
  addToolCapability(toolName, description, usage) {
    const toolsPath = path.join(this.workspace, 'TOOLS.md');
    
    if (!fs.existsSync(toolsPath)) {
      return { success: false, error: 'TOOLS.md not found' };
    }
    
    const backup = this.createBackup(toolsPath);
    if (!backup.success) {
      return backup;
    }
    
    try {
      const content = fs.readFileSync(toolsPath, 'utf-8');
      
      const toolEntry = `\n## ${toolName}\n${description}\n\n**Usage:**\n\`\`\`\n${usage}\n\`\`\`\n`;
      
      fs.writeFileSync(toolsPath, content + toolEntry);
      
      return {
        success: true,
        file: toolsPath,
        backupPath: backup.backupPath,
        message: `Tool "${toolName}" added to TOOLS.md`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Document a mistake and improvement
   */
  documentMistake(mistake, rootCause, improvement) {
    const today = new Date().toISOString().split('T')[0];
    const memoryPath = path.join(this.workspace, 'memory', `${today}.md`);
    
    const entry = `\n## Mistake Documentation\n**Time:** ${new Date().toLocaleTimeString()}\n\n**Mistake:**\n${mistake}\n\n**Root Cause:**\n${rootCause}\n\n**Improvement:**\n${improvement}\n\n---\n`;
    
    try {
      // Ensure memory directory exists
      const memoryDir = path.dirname(memoryPath);
      if (!fs.existsSync(memoryDir)) {
        fs.mkdirSync(memoryDir, { recursive: true });
      }
      
      if (fs.existsSync(memoryPath)) {
        fs.appendFileSync(memoryPath, entry);
      } else {
        fs.writeFileSync(memoryPath, `# ${today} - Memory Log\n${entry}`);
      }
      
      return {
        success: true,
        file: memoryPath,
        message: 'Mistake documented'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update implementation priority
   */
  updatePriority(taskId, status, notes = '') {
    const priorityPath = path.join(this.workspace, 'EL_IMPLEMENTATION_PRIORITY.md');
    
    if (!fs.existsSync(priorityPath)) {
      return { success: false, error: 'Priority file not found' };
    }
    
    const backup = this.createBackup(priorityPath);
    if (!backup.success) {
      return backup;
    }
    
    try {
      const content = fs.readFileSync(priorityPath, 'utf-8');
      
      // Find and update the task status
      const taskPattern = new RegExp(`(- \\[^)*)(${taskId})(.*)`);
      const newContent = content.replace(
        taskPattern,
        `$1$2 - [${status}]${notes ? ` - ${notes}` : ''}$3`
      );n      
      fs.writeFileSync(priorityPath, newContent);
      
      return {
        success: true,
        file: priorityPath,
        backupPath: backup.backupPath,
        message: `Priority "${taskId}" updated to "${status}"`
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get list of backups
   */
  getBackups(fileName) {
    try {
      const files = fs.readdirSync(this.backupsDir);
      return files
        .filter(f => f.startsWith(fileName))
        .map(f => ({
          file: f,
          path: path.join(this.backupsDir, f),
          date: f.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/)?.[0] || 'unknown'
        }))
        .sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      return [];
    }
  }

  /**
   * Restore from backup
   */
  restoreFromBackup(filePath, backupPath) {
    try {
      const backupContent = fs.readFileSync(backupPath, 'utf-8');
      fs.writeFileSync(filePath, backupContent);
      return { success: true, message: 'Restored from backup' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = SelfModification;
