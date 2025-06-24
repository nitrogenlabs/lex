#!/bin/bash

# Directory to scan for files
DIR="./packages/lex/src"

# Run ESLint to get a list of files with errors
echo "Finding files with ESLint errors..."
FILES_WITH_ERRORS=$(npx eslint "$DIR" --format json | jq -r '.[].filePath' | sort | uniq)

if [ -z "$FILES_WITH_ERRORS" ]; then
  echo "No files with ESLint errors found."
  exit 0
fi

# Count the number of files with errors
NUM_FILES=$(echo "$FILES_WITH_ERRORS" | wc -l)
echo "Found $NUM_FILES files with ESLint errors."

# Process each file
for FILE in $FILES_WITH_ERRORS; do
  echo "Processing $FILE..."
  
  # Use Cursor CLI to fix the file
  # This requires Cursor CLI to be installed and in your PATH
  # You can install it from Cursor's settings > CLI
  
  # Create a prompt file with instructions
  PROMPT_FILE=$(mktemp)
  echo "Fix all ESLint errors in this file. Focus on:
  1. Fixing naming conventions
  2. Fixing sort-keys issues
  3. Replacing console.log with log utility
  4. Fixing no-plusplus issues
  5. Fixing unnecessary escape characters
  6. Fixing other ESLint errors" > "$PROMPT_FILE"
  
  # Run the Cursor CLI command to fix the file
  cursor edit --file "$FILE" --prompt-file "$PROMPT_FILE"
  
  # Clean up
  rm "$PROMPT_FILE"
  
  echo "Completed processing $FILE"
  echo "------------------------"
done

echo "All files processed. Running ESLint again to verify fixes..."
npx eslint "$DIR" --fix || true

echo "Done!" 