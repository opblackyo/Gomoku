#!/usr/bin/env bash
# exit on error
set -o errexit

echo "🔧 Installing pnpm..."
npm install -g pnpm

echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

echo "🏗️ Building project..."
pnpm build

echo "✅ Build completed successfully!"
