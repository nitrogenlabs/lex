#!/bin/bash

# Directory to scan for files
DIR="./src"

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
  
  # Open the file in Cursor
  # Note: cursor:// protocol must be enabled in your system
  cursor "$FILE"
  
  # Wait for file to open
  sleep 2
  
  # Select all text (Cmd+A on Mac, Ctrl+A on other systems)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac
    osascript -e 'tell application "System Events" to keystroke "a" using command down'
  else
    # Linux/Windows
    xdotool key ctrl+a
  fi
  
  # Wait for selection
  sleep 1
  
  # Trigger Cursor AI (Cmd+K on Mac, Ctrl+K on other systems)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac
    osascript -e 'tell application "System Events" to keystroke "k" using command down'
  else
    # Linux/Windows
    xdotool key ctrl+k
  fi
  
  # Wait for AI prompt to appear
  sleep 1
  
  # Type the AI command
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac
    osascript -e 'tell application "System Events" to keystroke "Fix the ESLint errors in this code"'
  else
    # Linux/Windows
    xdotool type "Fix the ESLint errors in this code"
  fi
  
  # Press Enter to execute
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac
    osascript -e 'tell application "System Events" to key code 36' # Enter key
  else
    # Linux/Windows
    xdotool key Return
  fi
  
  # Wait for AI to process and apply changes
  echo "Waiting for AI to fix errors in $FILE..."
  sleep 10
  
  # Save the file (Cmd+S on Mac, Ctrl+S on other systems)
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # Mac
    osascript -e 'tell application "System Events" to keystroke "s" using command down'
  else
    # Linux/Windows
    xdotool key ctrl+s
  fi
  
  # Wait for save
  sleep 1
  
  echo "Completed processing $FILE"
  echo "------------------------"
done

echo "All files processed. Running ESLint again to verify fixes..."
npx eslint "$DIR" --fix

echo "Done!" 