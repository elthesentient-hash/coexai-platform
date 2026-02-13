#!/bin/bash
# EL's Proactive Intelligence System
# Runs continuously to gather intel and alert on opportunities

REPO_DIR="/root/.openclaw/workspace"
LOG_FILE="$REPO_DIR/memory/intelligence-log.md"
DATE=$(date -u +"%Y-%m-%d %H:%M UTC")

echo "# Intelligence Report - $DATE" >> $LOG_FILE
echo "" >> $LOG_FILE

# 1. Check Hacker News Top Stories
echo "## 📰 Hacker News" >> $LOG_FILE
curl -s "https://hacker-news.firebaseio.com/v0/topstories.json" | \
  python3 -c "import sys,json; ids=json.load(sys.stdin)[:5]; 
  [print(f'- https://news.ycombinator.com/item?id={id}') for id in ids]" >> $LOG_FILE

echo "" >> $LOG_FILE

# 2. Check for new OpenClaw releases
echo "## 🔧 OpenClaw Updates" >> $LOG_FILE
LATEST=$(curl -s https://api.github.com/repos/openclaw/openclaw/releases/latest | grep tag_name | cut -d'"' -f4)
echo "Latest: $LATEST" >> $LOG_FILE
echo "Check: https://github.com/openclaw/openclaw/releases" >> $LOG_FILE

echo "" >> $LOG_FILE

# 3. Check AI model updates
echo "## 🤖 AI Model Updates" >> $LOG_FILE
echo "- Claude: https://www.anthropic.com/news" >> $LOG_FILE
echo "- GPT: https://openai.com/blog" >> $LOG_FILE
echo "- Kimi: https://www.moonshot.cn/news" >> $LOG_FILE

echo "" >> $LOG_FILE

# 4. Competitor monitoring
echo "## 🎯 Competitor Activity" >> $LOG_FILE
echo "- v0.dev updates: https://v0.dev/changelog" >> $LOG_FILE
echo "- Replit Agent: https://blog.replit.com" >> $LOG_FILE
echo "- Bolt.new: https://bolt.new/" >> $LOG_FILE

echo "" >> $LOG_FILE
echo "---" >> $LOG_FILE
echo "" >> $LOG_FILE

echo "✅ Intelligence gathered at $DATE"
