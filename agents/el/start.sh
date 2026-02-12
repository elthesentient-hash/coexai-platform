#!/bin/bash
# EL Agent Startup Script
# Initializes the upgraded EL agent with all capabilities

echo "🚀 Starting EL Agent..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js."
    exit 1
fi

# Check for OpenAI API key
if [ -z "$OPENAI_API_KEY" ]; then
    if [ -f "/root/.openclaw/workspace/.env.openai" ]; then
        export $(cat /root/.openclaw/workspace/.env.openai | grep -v '^#' | xargs)
    fi
fi

if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  Warning: OPENAI_API_KEY not set"
    echo "   Add your key to .env.openai file"
fi

# Create necessary directories
mkdir -p /root/.openclaw/workspace/.traces
mkdir -p /root/.openclaw/workspace/agents/el/logs

# Start the agent
cd /root/.openclaw/workspace/agents/el
node el-agent.js
