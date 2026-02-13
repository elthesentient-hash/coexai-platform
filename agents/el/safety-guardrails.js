/**
 * EL Security Guardrails
 * Prevents destructive operations without confirmation
 */

class SafetyGuardrails {
  constructor() {
    // Destructive commands that require confirmation
    this.destructivePatterns = [
      /\brm\s+-rf/i,
      /\brm\s+.*\*/i,
      /\bmkfs\./i,
      /\bdd\s+if=/i,
      /\bgit\s+push\s+.*--force/i,
      /\bgit\s+reset\s+--hard/i,
      /\bmv\s+.*\/\s+/i,
      /\brmdir\s+/i,
      />\s*\/etc\//i,
      />\s*~\//i,
    ];
    
    // Sensitive file patterns
    this.sensitiveFiles = [
      '.env',
      '.env.local',
      'SOUL.md',
      'MEMORY.md',
      'USER.md',
      '.git/',
      'node_modules/',
      'package-lock.json',
    ];
    
    // Audit log
    this.auditLog = [];
  }

  /**
   * Check if command is destructive
   */
  isDestructive(command) {
    const cmd = command.toLowerCase();
    
    for (const pattern of this.destructivePatterns) {
      if (pattern.test(cmd)) {
        return {
          isDestructive: true,
          reason: `Matches pattern: ${pattern}`,
          command: command
        };
      }
    }
    
    return { isDestructive: false };
  }

  /**
   * Check if file is sensitive
   */
  isSensitiveFile(filePath) {
    const path = filePath.toLowerCase();
    
    for (const sensitive of this.sensitiveFiles) {
      if (path.includes(sensitive.toLowerCase())) {
        return {
          isSensitive: true,
          file: filePath,
          reason: `This is a sensitive system file`
        };
      }
    }
    
    return { isSensitive: false };
  }

  /**
   * Validate command before execution
   */
  validateCommand(command) {
    // Check for destructive operations
    const destructiveCheck = this.isDestructive(command);
    if (destructiveCheck.isDestructive) {
      return {
        allowed: false,
        requiresConfirmation: true,
        reason: `Destructive command detected: ${destructiveCheck.reason}`,
        command: command,
        suggestion: 'This command could cause data loss. Manual review required.'
      };
    }
    
    // Check for file operations on sensitive files
    const fileMatch = command.match(/(?:rm|mv|cp|cat|edit)\s+(["']?[^"'\s]+["']?)/);
    if (fileMatch) {
      const filePath = fileMatch[1].replace(/["']/g, '');
      const sensitiveCheck = this.isSensitiveFile(filePath);
      if (sensitiveCheck.isSensitive) {
        return {
          allowed: false,
          requiresConfirmation: true,
          reason: `Operation on sensitive file: ${sensitiveCheck.file}`,
          command: command,
          suggestion: 'This file is critical to system operation. Manual review required.'
        };
      }
    }
    
    return { allowed: true };
  }

  /**
   * Validate file edit operation
   */
  validateFileEdit(filePath, oldContent, newContent) {
    const sensitiveCheck = this.isSensitiveFile(filePath);
    if (sensitiveCheck.isSensitive) {
      return {
        allowed: false,
        requiresConfirmation: true,
        reason: `Editing sensitive file: ${filePath}`,
        suggestion: 'This file is critical. Show diff and request confirmation.'
      };
    }
    
    // Check for large deletions
    if (oldContent && newContent) {
      const oldLines = oldContent.split('\n').length;
      const newLines = newContent.split('\n').length;
      const deletionRatio = (oldLines - newLines) / oldLines;
      
      if (deletionRatio > 0.5) {
        return {
          allowed: false,
          requiresConfirmation: true,
          reason: `Large deletion detected: ${Math.round(deletionRatio * 100)}% of file removed`,
          suggestion: 'Major content deletion detected. Manual review required.'
        };
      }
    }
    
    return { allowed: true };
  }

  /**
   * Log operation for audit
   */
  logOperation(operation, details, userConfirmed = false) {
    const entry = {
      timestamp: new Date().toISOString(),
      operation,
      details,
      userConfirmed,
      sessionId: process.env.SESSION_ID || 'unknown'
    };
    
    this.auditLog.push(entry);
    
    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
    
    return entry;
  }

  /**
   * Get audit log
   */
  getAuditLog(limit = 100) {
    return this.auditLog.slice(-limit);
  }
}

module.exports = SafetyGuardrails;
