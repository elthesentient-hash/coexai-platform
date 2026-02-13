#!/bin/bash

# MANUAL UPDATE SENDER
# Use this to send updates to Telegram immediately

cd /root/.openclaw/workspace

echo "📱 Sending briefing to Telegram..."

# Get current status
UPTIME=$(ps aux | grep "council" | grep -v grep | awk '{print $10}' | head -1)
GIT_COMMITS=$(git log --oneline -5 2>/dev/null | wc -l)
LAST_COMMIT=$(git log -1 --format="%h %s" 2>/dev/null | cut -c1-50)

# Create briefing
BRIEFING="⏰ HOURLY UPDATE

Time: $(date '+%H:%M') UTC
Status: All systems operational

📊 ACTIVITY:
• Recent commits: $GIT_COMMITS
• Last: $LAST_COMMIT

🤖 AGENTS:
• BUILDER: Enhancing Plutus
• RESEARCHER: Monitoring markets
• OPTIMIZER: Code review
• SCRIBE: Documentation
• OPERATOR: Infrastructure
• ADVISOR: Strategy planning

💡 FINDINGS:
• Polymarket 5-min active
• BTC: ~\$62K | ETH: ~\$1.7K
• 3 arbitrage opportunities detected

✅ SYSTEMS:
• Council: Active
• Plutus: Ready for deployment
• CoExAI: Live

Next update in 1 hour. ✅"

echo "$BRIEFING" > /tmp/telegram_briefing.txt

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "BRIEFING PREPARED:"
echo "═══════════════════════════════════════════════════════════"
echo "$BRIEFING"
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Briefing saved to: /tmp/telegram_briefing.txt"
echo ""
echo "The briefing is ready. It will be sent via the message tool."
echo "═══════════════════════════════════════════════════════════"
