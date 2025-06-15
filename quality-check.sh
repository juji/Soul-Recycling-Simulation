#!/bin/bash

# 🚀 Soul Recycling Simulation - Code Quality Helper
echo "🎯 Code Quality Check for Soul Recycling Simulation"
echo "===================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "success" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "warning" ]; then
        echo -e "${YELLOW}⚠️  $message${NC}"
    elif [ "$status" = "error" ]; then
        echo -e "${RED}❌ $message${NC}"
    else
        echo -e "${BLUE}🔍 $message${NC}"
    fi
}

# TypeScript Check
print_status "info" "Checking TypeScript compilation..."
if npm run type-check > /dev/null 2>&1; then
    print_status "success" "TypeScript compilation passed"
else
    print_status "error" "TypeScript compilation failed"
fi

# ESLint Check
print_status "info" "Checking ESLint rules..."
if npm run lint > /dev/null 2>&1; then
    print_status "success" "ESLint rules passed"
else
    print_status "warning" "ESLint found issues (run 'npm run lint:fix')"
fi

# Prettier Check
print_status "info" "Checking code formatting..."
if npm run format:check > /dev/null 2>&1; then
    print_status "success" "Code formatting is consistent"
else
    print_status "warning" "Code needs formatting (run 'npm run format')"
fi

echo ""
echo "🤖 GitHub Copilot Integration Tips:"
echo "  - Standards are enforced automatically"
echo "  - Write descriptive comments for better suggestions"
echo "  - Use consistent TypeScript interfaces"
echo "  - Let tooling handle formatting and style"
