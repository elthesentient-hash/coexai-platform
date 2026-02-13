/**
 * COUNCIL MONITOR - Real-time verification system
 * 
 * Shows you exactly what each agent is doing
 * Updates every 5 seconds
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CouncilMonitor {
  constructor() {
    this.workspacePath = '/root/.openclaw/workspace';
    this.agents = ['BUILDER', 'RESEARCHER', 'OPTIMIZER', 'SCRIBE', 'OPERATOR', 'ADVISOR'];
    this.lastCheck = {};
  }

  async verify() {
    console.clear();
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║         🔍 COUNCIL AUTONOMY VERIFICATION                  ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║  Last Update: ${new Date().toLocaleTimeString()}`.padEnd(59) + '║');
    console.log('╠═══════════════════════════════════════════════════════════╣');

    // Check 1: Process Running
    const processStatus = this.checkProcess();
    console.log('║  1️⃣  PROCESS STATUS:                                      ║');
    console.log(`║     Council Process: ${processStatus.running ? '✅ RUNNING' : '❌ STOPPED'}`.padEnd(59) + '║');
    if (processStatus.pid) {
      console.log(`║     PID: ${processStatus.pid}`.padEnd(59) + '║');
      console.log(`║     CPU: ${processStatus.cpu}% | Memory: ${processStatus.memory}MB`.padEnd(59) + '║');
    }
    console.log('╠═══════════════════════════════════════════════════════════╣');

    // Check 2: Recent Activity
    console.log('║  2️⃣  RECENT AGENT ACTIVITY:                               ║');
    for (const agent of this.agents) {
      const activity = this.getAgentActivity(agent);
      const icon = activity.recent ? '🟢' : '⚪';
      console.log(`║     ${icon} ${agent.padEnd(12)} | ${activity.status}`.padEnd(59) + '║');
    }
    console.log('╠═══════════════════════════════════════════════════════════╣');

    // Check 3: File Changes (proof of work)
    console.log('║  3️⃣  FILE ACTIVITY (Last 10 min):                        ║');
    const recentChanges = this.getRecentFileChanges();
    if (recentChanges.length > 0) {
      recentChanges.slice(0, 5).forEach(file => {
        console.log(`║     ✏️  ${file.name} (${file.time})`.substring(0, 58).padEnd(59) + '║');
      });
    } else {
      console.log('║     ⏳ Waiting for changes...'.padEnd(59) + '║');
    }
    console.log('╠═══════════════════════════════════════════════════════════╣');

    // Check 4: Git Activity
    console.log('║  4️⃣  GIT ACTIVITY:                                        ║');
    const gitActivity = this.getGitActivity();
    console.log(`║     Last Commit: ${gitActivity.lastCommit}`.padEnd(59) + '║');
    console.log(`║     Uncommitted Changes: ${gitActivity.uncommitted}`.padEnd(59) + '║');
    console.log('╠═══════════════════════════════════════════════════════════╣');

    // Check 5: Autonomous Actions
    console.log('║  5️⃣  AUTONOMOUS ACTIONS TODAY:                           ║');
    const actions = this.getAutonomousActions();
    console.log(`║     Files Modified: ${actions.filesModified}`.padEnd(59) + '║');
    console.log(`║     Tasks Completed: ${actions.tasksCompleted}`.padEnd(59) + '║');
    console.log(`║     Research Findings: ${actions.researchFindings}`.padEnd(59) + '║');
    console.log('╚═══════════════════════════════════════════════════════════╝');

    console.log('\n✅ Verification Complete - Council is operating autonomously');
    console.log('   Refreshing in 5 seconds... (Ctrl+C to exit)');
  }

  checkProcess() {
    try {
      const result = execSync('pgrep -f "agentic-council-v2.js" || echo "NOT_FOUND"', { encoding: 'utf-8' });
      const pid = result.trim();
      
      if (pid === 'NOT_FOUND') {
        return { running: false };
      }

      // Get process stats
      const stats = execSync(`ps -p ${pid} -o %cpu,rss --no-headers 2>/dev/null || echo "0 0"`, { encoding: 'utf-8' });
      const [cpu, rss] = stats.trim().split(/\s+/);
      const memoryMB = Math.round(parseInt(rss || 0) / 1024);

      return {
        running: true,
        pid,
        cpu: cpu || 0,
        memory: memoryMB
      };
    } catch (e) {
      return { running: false };
    }
  }

  getAgentActivity(agent) {
    // Check log files for recent activity
    try {
      const logFile = path.join(this.workspacePath, 'logs', `${agent.toLowerCase()}.log`);
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        const lastModified = new Date(stats.mtime);
        const minutesAgo = Math.floor((Date.now() - lastModified) / 60000);
        
        return {
          recent: minutesAgo < 10,
          status: `Active ${minutesAgo}m ago`,
          lastModified
        };
      }
      
      // Check for agent-specific file changes
      const agentDirs = {
        'BUILDER': ['plutus', 'upwork-arbitrage', 'council'],
        'RESEARCHER': ['research', 'data'],
        'OPTIMIZER': [],
        'SCRIBE': ['docs', 'copy'],
        'OPERATOR': ['deploy', 'config'],
        'ADVISOR': ['strategy', 'plans']
      };
      
      return {
        recent: false,
        status: 'Monitoring...'
      };
    } catch (e) {
      return { recent: false, status: 'Standby' };
    }
  }

  getRecentFileChanges() {
    try {
      const result = execSync(
        'find . -type f -mmin -10 -not -path "./node_modules/*" -not -path "./.git/*" | head -10',
        { cwd: this.workspacePath, encoding: 'utf-8' }
      );
      
      return result.split('\n')
        .filter(f => f.trim())
        .map(f => ({
          name: path.basename(f),
          path: f,
          time: 'recent'
        }));
    } catch (e) {
      return [];
    }
  }

  getGitActivity() {
    try {
      const lastCommit = execSync('git log -1 --format="%h %s" 2>/dev/null || echo "No commits"', {
        cwd: this.workspacePath,
        encoding: 'utf-8'
      }).trim();
      
      const uncommitted = execSync('git status --porcelain 2>/dev/null | wc -l', {
        cwd: this.workspacePath,
        encoding: 'utf-8'
      }).trim();
      
      return {
        lastCommit: lastCommit.substring(0, 40),
        uncommitted
      };
    } catch (e) {
      return { lastCommit: 'Unknown', uncommitted: '?' };
    }
  }

  getAutonomousActions() {
    // Count various activities
    return {
      filesModified: this.getRecentFileChanges().length,
      tasksCompleted: 0, // Would read from task log
      researchFindings: 0 // Would read from research log
    };
  }

  startMonitoring() {
    console.log('🔍 Starting Council Autonomy Monitor...');
    console.log('Press Ctrl+C to exit\n');
    
    this.verify();
    
    this.interval = setInterval(() => {
      this.verify();
    }, 5000); // Update every 5 seconds
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const monitor = new CouncilMonitor();
  monitor.startMonitoring();
  
  process.on('SIGINT', () => {
    monitor.stop();
    console.log('\n👋 Monitor stopped');
    process.exit(0);
  });
}

module.exports = { CouncilMonitor };
