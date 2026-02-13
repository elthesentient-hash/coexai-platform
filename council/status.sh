#!/bin/bash

# COUNCIL DASHBOARD - Quick status check
echo ""
echo "🏛️ EL AGENTIC COUNCIL - STATUS DASHBOARD"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Check if council is running
if pgrep -f "agentic-council-v2.js" > /dev/null; then
  PID=$(pgrep -f "agentic-council-v2.js")
  echo "✅ Council Status: RUNNING"
  echo "   PID: $PID"
  
  # Get CPU and Memory
  STATS=$(ps -p $PID -o %cpu,rss --no-headers 2>/dev/null || echo "0 0")
  CPU=$(echo $STATS | awk '{print $1}')
  MEM=$(echo $STATS | awk '{print $2}')
  MEM_MB=$((MEM / 1024))
  
  echo "   CPU: ${CPU}% | Memory: ${MEM_MB}MB"
else
  echo "❌ Council Status: NOT RUNNING"
  echo "   Run: ./council/run-council.sh"
fi

echo ""
echo "📊 AGENT ACTIVITY:"
echo "───────────────────────────────────────────────────────────"

# Check for recent file modifications
echo "Recent File Changes (Last 10 min):"
find . -type f -mmin -10 -not -path "./node_modules/*" -not -path "./.git/*" -exec ls -lh {} \; 2>/dev/null | while read file; do
  echo "  ✏️  $file"
done

echo ""
echo "📝 GIT ACTIVITY:"
echo "───────────────────────────────────────────────────────────"
echo "Last Commit:"
git log -1 --oneline 2>/dev/null || echo "  No git history"

echo ""
echo "Uncommitted Changes:"
UNCOMMITTED=$(git status --porcelain 2>/dev/null | wc -l)
if [ "$UNCOMMITTED" -gt 0 ]; then
  echo "  $UNCOMMITTED files modified"
  git status --short 2>/dev/null | head -5
else
  echo "  No uncommitted changes"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "COMMANDS:"
echo "  ./council/run-council.sh         # Start council"
echo "  node council/monitor.js          # Live monitoring"
echo "  tail -f /var/log/council.log     # View logs"
echo "  kill $(pgrep -f council)         # Stop council"
echo "═══════════════════════════════════════════════════════════"
echo ""
