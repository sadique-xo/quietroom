#!/bin/bash

# Compile and run storage test scripts

echo "=== Testing Supabase Storage Integration ==="

# Ensure TypeScript is installed
if ! command -v npx &> /dev/null; then
  echo "Error: npx not found. Please install Node.js and npm."
  exit 1
fi

echo "Compiling and running bucket test..."
npx tsx scripts/debug-image-upload.ts

echo ""
echo "Compiling and running image upload test..."
npx tsx scripts/test-image-upload.ts

echo ""
echo "Tests complete!" 