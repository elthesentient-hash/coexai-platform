#!/bin/bash
# Install Ollama and LLaVA for local vision AI

echo "🦙 Installing Ollama + LLaVA for local vision-to-code..."
echo ""

# Check if Ollama is installed
if ! command -v ollama &> /dev/null; then
    echo "📥 Installing Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
else
    echo "✅ Ollama already installed"
fi

# Pull LLaVA model (vision-capable)
echo ""
echo "📦 Downloading LLaVA vision model (this may take a few minutes)..."
ollama pull llava

echo ""
echo "✅ LLaVA ready!"
echo ""
echo "Test with:"
echo "  ollama run llava"
echo "  Then: 'Describe this image' and paste a base64 image"
