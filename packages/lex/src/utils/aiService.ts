/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { resolve as pathResolve } from 'path';
import { createSpinner } from './app.js';
import { log } from './log.js';
import { LexConfig, AIConfig } from '../LexConfig.js';
import readline from 'readline';

// Cursor IDE API integration (conceptual - actual implementation may differ)
async function callCursorAI(prompt: string, options: AIConfig): Promise<string> {
  try {
    // This is a conceptual implementation
    // In a real implementation, you would use Cursor's API client
    const response = await fetch('https://api.cursor.sh/v1/ai/code/fix', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.apiKey || process.env.CURSOR_API_KEY}`
      },
      body: JSON.stringify({
        prompt,
        model: options.model || 'cursor-code',
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`Cursor API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].text;
  } catch (error) {
    throw new Error(`Cursor AI error: ${error.message}`);
  }
}

// GitHub Copilot API integration (conceptual - actual implementation may differ)
async function callCopilotAI(prompt: string, options: AIConfig): Promise<string> {
  try {
    // This is a conceptual implementation
    // In a real implementation, you would use GitHub's Copilot API client
    const response = await fetch('https://api.github.com/copilot/v1/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${options.apiKey || process.env.GITHUB_COPILOT_TOKEN}`
      },
      body: JSON.stringify({
        prompt,
        model: options.model || 'copilot-codex',
        max_tokens: options.maxTokens || 4000,
        temperature: options.temperature || 0.1
      })
    });

    if (!response.ok) {
      throw new Error(`GitHub Copilot API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].text;
  } catch (error) {
    throw new Error(`GitHub Copilot AI error: ${error.message}`);
  }
}

// Prompt the user to choose an AI provider if none is configured
async function promptForAIProvider(): Promise<'cursor' | 'copilot' | 'none'> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\nNo AI provider configured. Please choose an AI provider:');
    console.log('1. Cursor IDE');
    console.log('2. GitHub Copilot');
    console.log('3. None (Skip AI features)');
    
    rl.question('Enter your choice (1-3): ', (answer) => {
      rl.close();
      
      switch (answer) {
      case '1':
        resolve('cursor');
        break;
      case '2':
        resolve('copilot');
        break;
      default:
        resolve('none');
      }
    });
  });
}

// Prompt the user for an API key if needed
async function promptForAPIKey(provider: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`Please enter your ${provider} API key: `, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Main function to call AI service
export async function callAIService(
  prompt: string,
  quiet: boolean = false
): Promise<string> {
  const spinner = createSpinner(quiet);
  spinner.start('Calling AI service to fix code issues...');

  try {
    // Get AI configuration from LexConfig
    let aiConfig = LexConfig.config.ai || { provider: 'none' };
    
    // Support legacy config
    if (aiConfig.provider === 'none' && LexConfig.config.ai.apiKey) {
      aiConfig = {
        provider: 'openai',
        apiKey: LexConfig.config.ai.apiKey,
        model: LexConfig.config.ai.model || 'gpt-4o'
      };
    }

    // If no provider is configured, prompt the user to choose one
    if (aiConfig.provider === 'none') {
      const provider = await promptForAIProvider();
      
      if (provider === 'none') {
        spinner.fail('AI features skipped');
        return '';
      }
      
      aiConfig.provider = provider;
      
      // Prompt for API key if needed
      if (!process.env[`${provider.toUpperCase()}_API_KEY`]) {
        aiConfig.apiKey = await promptForAPIKey(provider);
      }
      
      // Save the configuration for future use
      LexConfig.config.ai = aiConfig;
      
      // Write the configuration to a file
      const configPath = pathResolve(process.cwd(), 'lex.config.js');
      if (existsSync(configPath)) {
        try {
          const configContent = readFileSync(configPath, 'utf8');
          const updatedConfig = configContent.replace(
            /ai:.*?[,}]/s,
            `ai: { provider: '${aiConfig.provider}' },`
          );
          writeFileSync(configPath, updatedConfig);
        } catch (_error) {
          // Ignore errors when trying to update config
        }
      }
    }

    // Call the appropriate AI service based on the provider
    let result = '';
    switch (aiConfig.provider) {
    case 'cursor':
      result = await callCursorAI(prompt, aiConfig);
      break;
    case 'copilot':
      result = await callCopilotAI(prompt, aiConfig);
      break;
    default:
      spinner.fail('No AI provider configured');
      return '';
    }

    spinner.succeed('AI code fixes generated successfully');
    return result;
  } catch (_error) {
    spinner.fail(`AI service error: ${_error.message}`);
    log(`Error details: ${_error.stack}`, 'error', quiet);
    return '';
  }
} 