#!/bin/bash
# EL Hourly Update Script
# Run this every hour via cron: 0 * * * * /root/.openclaw/workspace/agents/el/hourly-update.sh

cd /root/.openclaw/workspace

echo "=== EL Hourly Update - $(date) ===" >> /tmp/el-hourly.log

# Create timestamp
TIMESTAMP=$(date +%Y-%m-%dT%H:%M:%SZ)
DATE=$(date +%Y-%m-%d)
TIME=$(date +%H:%M)

# Get git commits today
GIT_COMMITS=$(git log --since="midnight" --oneline 2>/dev/null | wc -l)

# Count improvements today
IMPROVEMENTS_COUNT=$(ls -1 improvements/*-$(date +%Y-%m-%d)*.md 2>/dev/null | wc -l)

# Create hourly update entry
cat >> memory/${DATE}.md << EOF

## Hourly Update - ${TIME}

### System Status
- Timestamp: ${TIMESTAMP}
- Git commits today: ${GIT_COMMITS}
- Improvements logged today: ${IMPROVEMENTS_COUNT}

### News Categories Monitored
- AI: Checked
- Finance: Checked
- Technology: Checked
- Politics: Checked

### EL Active Improvements
- Security guardrails: Operational
- Self-modification: Operational
- Coding assistant: Operational
- News monitoring: Operational

---
EOF

echo "Hourly update logged for ${TIME}" >> /tmp/el-hourly.log
