#!/bin/bash

# Directory to scan for files
DIR="./packages/lex/src"

# Run ESLint to get a list of files with errors (no JSON parsing needed)
echo "Finding files with ESLint errors..."
npx eslint "$DIR" --quiet > eslint-errors.txt

# Extract file paths from ESLint output
FILES_WITH_ERRORS=$(grep -o '/.*\.\(js\|jsx\|ts\|tsx\)' eslint-errors.txt | sort | uniq)

# Clean up
rm eslint-errors.txt

if [ -z "$FILES_WITH_ERRORS" ]; then
  echo "No files with ESLint errors found."
  exit 0
fi

# Count the number of files with errors
NUM_FILES=$(echo "$FILES_WITH_ERRORS" | wc -l)
echo "Found $NUM_FILES files with ESLint errors."

echo "To fix ESLint errors in each file:"
echo "1. Open each file in Cursor"
echo "2. Press Cmd+K (Mac) or Ctrl+K (Windows/Linux)"
echo "3. Type: 'Fix the ESLint errors in this code'"
echo "4. Press Enter and let Cursor AI fix the issues"
echo ""
echo "Files with errors:"
echo "$FILES_WITH_ERRORS"
echo ""

# Ask if user wants to open files in Cursor
read -p "Do you want to open these files in Cursor? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  for FILE in $FILES_WITH_ERRORS; do
    echo "Opening $FILE in Cursor..."
    cursor "$FILE"
    # Wait a bit between files to avoid overwhelming the system
    sleep 1
  done
  
  echo "All files opened in Cursor."
  echo "Use Cmd+K (Mac) or Ctrl+K (Windows/Linux) in each file to fix ESLint errors."
fi

echo "After fixing, run: npx eslint \"$DIR\" --fix" 