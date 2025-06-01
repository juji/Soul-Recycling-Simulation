#!/bin/bash

# Phase 3 Benchmark Runner
# Soul Recycling Simulation - GPU Instanced Rendering Performance Test

echo "🎯 Phase 3 GPU Instanced Rendering Benchmark"
echo "============================================="

# Check if the dev server is running
echo "📡 Checking if development server is running..."
if curl -s http://localhost:5173 > /dev/null; then
    echo "✅ Development server is running"
else
    echo "❌ Development server not found at localhost:5173"
    echo "Please start the development server first:"
    echo "  npm run dev"
    echo ""
    echo "Then run this benchmark again."
    exit 1
fi

# Check if node_modules exists and install if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if puppeteer is installed
if ! npm list puppeteer > /dev/null 2>&1; then
    echo "📦 Installing puppeteer for testing..."
    npm install puppeteer
fi

echo ""
echo "🚀 Starting Phase 3 Performance Benchmark..."
echo "This will test both individual mesh and instanced rendering modes"
echo "Expected runtime: ~5-8 minutes"
echo ""

# Run the benchmark
node testing-results/phase3-benchmark.js

echo ""
echo "✅ Benchmark completed!"
echo "📊 Check the following files for results:"
echo "  - testing-results/phase3-benchmark-report.html (Visual report)"
echo "  - testing-results/phase3-benchmark-report.md (Text report)"
echo "  - testing-results/phase3-benchmark-latest.json (Raw data)"
