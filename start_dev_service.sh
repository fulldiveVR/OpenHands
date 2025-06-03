#!/bin/bash

# Script to start service in dev container
# This script checks if running in dev container and then executes the required commands

set -e  # Exit on any error

echo "Checking if running in dev container..."

# Check if we're in a dev container
if [ "$REMOTE_CONTAINERS" != "true" ]; then
    echo "❌ ERROR: Not running in a dev container!"
    echo ""
    echo "📋 To fix this issue:"
    echo "1. Make sure you have Docker installed and running"
    echo "2. Open this project in VS Code"
    echo "3. Install the 'Remote - Containers' extension if not already installed"
    echo "4. Use Command Palette (Ctrl+Shift+P / Cmd+Shift+P) and run:"
    echo "   'Remote-Containers: Reopen in Container'"
    echo "5. Wait for the dev container to build and start"
    echo "6. Then run this script again"
    echo ""
    exit 1
fi

echo "✅ Running in dev container. Proceeding with service startup..."
echo ""

# Run the required commands
echo "🔧 Configuring git and building..."
git config --global --unset url.ssh://git@github.com.insteadof || true

echo "🏗️  Running make build..."
make build

echo "🐍 Building runtime with Python/Node.js image..."
poetry run python3 openhands/runtime/utils/runtime_build.py \
    --base_image nikolaik/python-nodejs:python3.12-nodejs22 \
    --build_folder containers/runtime

echo "🚀 Starting the service..."
make run

echo "✅ Service startup complete!"
