#!/bin/bash

# Phase 3 Stress Test Runner
# Tests extreme soul counts to validate system robustness

echo "🔥 Phase 3 Stress Test - High Soul Count Performance"
echo "===================================================="
echo ""
echo "This test will push the system to its limits with soul counts up to 15,000."
echo "Each test runs for 30 seconds to thoroughly validate stability."
echo ""

# Check if the development server is running
echo "📡 Checking development server..."
if ! curl -s http://localhost:5173 > /dev/null; then
    echo "❌ Development server not found at localhost:5173"
    echo "Please start the development server with 'npm run dev' first."
    exit 1
fi

echo "✅ Development server is running"
echo ""

# Run the stress test
echo "🚀 Starting stress test..."
echo ""

cd "$(dirname "$0")/.."
node testing-results/phase3-stress-test.js

echo ""
echo "🎉 Stress test complete!"
echo ""
echo "📊 Check the following files for results:"
echo "   - testing-results/phase3-stress-test-latest.json"
echo "   - testing-results/phase3-stress-test-report.md"
echo ""
