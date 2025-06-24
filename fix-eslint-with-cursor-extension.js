// This script uses VS Code API with Cursor extension
// Save this as a .js file and run it from VS Code's command palette:
// 1. Open Command Palette (Cmd+Shift+P or Ctrl+Shift+P)
// 2. Type "Run JavaScript in Editor" and select it
// 3. This script will be executed

const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configuration
const srcDir = './packages/lex/src';
const cursorExtensionId = 'cursor.cursor';

async function getFilesWithEslintErrors() {
  return new Promise((resolve, reject) => {
    exec(`npx eslint "${srcDir}" --format json`, (error, stdout) => {
      if (error && !stdout) {
        reject(error);
        return;
      }
      
      try {
        const results = JSON.parse(stdout);
        const fileSet = new Set();
        
        results.forEach(result => {
          if (result.errorCount > 0) {
            fileSet.add(result.filePath);
          }
        });
        
        resolve(Array.from(fileSet));
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function fixEslintErrorsWithCursor() {
  // Check if Cursor extension is installed
  const extension = vscode.extensions.getExtension(cursorExtensionId);
  if (!extension) {
    vscode.window.showErrorMessage('Cursor extension is not installed or not active');
    return;
  }
  
  try {
    // Get files with ESLint errors
    const filesWithErrors = await getFilesWithEslintErrors();
    
    if (filesWithErrors.length === 0) {
      vscode.window.showInformationMessage('No files with ESLint errors found');
      return;
    }
    
    vscode.window.showInformationMessage(`Found ${filesWithErrors.length} files with ESLint errors. Starting fixes...`);
    
    // Process each file
    for (const filePath of filesWithErrors) {
      try {
        // Open the file
        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document);
        
        // Select all text
        const lastLine = document.lineCount - 1;
        const lastChar = document.lineAt(lastLine).text.length;
        editor.selection = new vscode.Selection(0, 0, lastLine, lastChar);
        
        // Trigger Cursor AI command
        await vscode.commands.executeCommand('cursor.promptGPT');
        
        // Wait for the prompt input box to appear
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Type the prompt
        const prompt = "Fix all ESLint errors in this file. Focus on naming conventions, sort-keys issues, replacing console.log, fixing no-plusplus issues, and unnecessary escape characters.";
        await vscode.commands.executeCommand('editor.action.insertSnippet', { text: prompt });
        
        // Press Enter to execute
        await vscode.commands.executeCommand('acceptSelectedSuggestion');
        
        // Wait for AI to process
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Save the file
        await document.save();
        
        vscode.window.showInformationMessage(`Processed ${path.basename(filePath)}`);
      } catch (err) {
        vscode.window.showErrorMessage(`Error processing ${filePath}: ${err.message}`);
      }
    }
    
    vscode.window.showInformationMessage('All files processed. Running ESLint again to verify fixes...');
    
    // Run ESLint again to verify fixes
    exec(`npx eslint "${srcDir}" --fix`, (error) => {
      if (error) {
        vscode.window.showWarningMessage('ESLint still found some issues, but fixes were applied');
      } else {
        vscode.window.showInformationMessage('All ESLint errors fixed successfully!');
      }
    });
  } catch (err) {
    vscode.window.showErrorMessage(`Error: ${err.message}`);
  }
}

// Run the function
fixEslintErrorsWithCursor().catch(err => {
  vscode.window.showErrorMessage(`Unhandled error: ${err.message}`);
}); 