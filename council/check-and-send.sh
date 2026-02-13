#!/bin/bash

# UPDATE TRIGGER - Manual and automatic updates
# This runs in background and triggers updates every hour

cd /root/.openclaw/workspace

echo "🔄 Autonomous Update System"
echo "═══════════════════════════════════════════════════════════"

# Function to send update
send_update() {
  echo "$(date): Preparing hourly update..."
  
  # Generate the briefing
  node -e "
    const updater = require('./council/autonomous-updater.js');
    const u = new updater.AutonomousUpdater();
    u.init().then(() => u.sendUpdate()).then(msg => {
      console.log('Update prepared');
      console.log('---');
      console.log(msg);
    });
  " > /tmp/briefing.txt
  
  echo "✅ Update generated and saved to /tmp/briefing.txt"
  echo "   Ready to send to Telegram"
}

# Check if we should send update (every hour)
LAST_UPDATE_FILE=".last_update_sent"
CURRENT_HOUR=$(date +%H)

if [ -f "$LAST_UPDATE_FILE" ]; then
  LAST_HOUR=$(cat "$LAST_UPDATE_FILE")
else
  LAST_HOUR=""
fi

if [ "$CURRENT_HOUR" != "$LAST_HOUR" ]; then
  echo "New hour detected. Sending update..."
  send_update
  echo "$CURRENT_HOUR" > "$LAST_UPDATE_FILE"
else
  echo "Already sent update this hour."
  echo "Last update hour: $LAST_HOUR"
  echo "Current hour: $CURRENT_HOUR"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "To send manual update:"
echo "  ./council/send-update.sh"
echo ""
echo "To check update history:"
echo "  ls -la update_*.txt"
echo "═══════════════════════════════════════════════════════════"
