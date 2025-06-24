/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {existsSync, readFileSync, writeFileSync} from 'fs';
import {resolve as pathResolve} from 'path';
import readline from 'readline';

import {createSpinner} from './app.js';
import {log} from './log.js';
import {LexConfig, AIConfig} from '../LexConfig.js';

// Cursor IDE integration
export const callCursorAI = async (prompt: string, options: AIConfig): Promise<string> => {
  try {
    // When running within Cursor IDE, we can write the prompt to a temporary file
    // that Cursor can use to provide AI assistance
    log('Using Cursor IDE for AI fixes...', 'info');

    // For now, just log the prompt and return a placeholder
    // In a real implementation, Cursor would handle this automatically
    log('AI fix requested via Cursor IDE', 'info');

    // Since we're running inside Cursor IDE, the fixes will be applied
    // through Cursor's AI features instead of external API calls
    return prompt;
  } catch(error) {
    throw new Error(`Cursor AI error: ${error.message}`);
  }
};

// OpenAI API integration
export const callOpenAIAI = async (prompt: string, options: AIConfig): Promise<string> => {
  try {
    // OpenAI API implementation
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    if(!apiKey) {
      throw new Error('OpenAI API key is required. Set it in lex.config.js or as OPENAI_API_KEY environment variable.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      body: JSON.stringify({
        max_tokens: options.maxTokens || 4000,
        messages: [
          {content: 'You are a helpful assistant that fixes ESLint errors in code.', role: 'system'},
          {content: prompt, role: 'user'}
        ],
        model: options.model || 'gpt-4o',
        temperature: options.temperature || 0.1
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      method: 'POST'
    });

    if(!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch(error) {
    throw new Error(`OpenAI AI error: ${error.message}`);
  }
};

// Anthropic API integration
export const callAnthropicAI = async (prompt: string, options: AIConfig): Promise<string> => {
  try {
    // Anthropic API implementation
    const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    if(!apiKey) {
      throw new Error('Anthropic API key is required. Set it in lex.config.js or as ANTHROPIC_API_KEY environment variable.');
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      body: JSON.stringify({
        max_tokens: options.maxTokens || 4000,
        messages: [
          {content: prompt, role: 'user'}
        ],
        model: options.model || 'claude-3-sonnet-20240229',
        temperature: options.temperature || 0.1
      }),
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': apiKey
      },
      method: 'POST'
    });

    if(!response.ok) {
      const error = await response.json();
      throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch(error) {
    throw new Error(`Anthropic AI error: ${error.message}`);
  }
};

// GitHub Copilot API integration (conceptual - actual implementation may differ)
export const callCopilotAI = async (prompt: string, options: AIConfig): Promise<string> => {
  try {
    log('GitHub Copilot AI fixes not directly supported. Using manual fix mode.', 'info');
    return prompt;
  } catch(error) {
    throw new Error(`GitHub Copilot AI error: ${error.message}`);
  }
};

// Prompt the user to choose an AI provider if none is configured
export const promptForAIProvider = async (quiet = false): Promise<'cursor' | 'copilot' | 'openai' | 'anthropic' | 'none'> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    log('\nNo AI provider configured. Please choose an AI provider:', 'info');
    log('1. Cursor IDE', 'info');
    log('2. OpenAI', 'info');
    log('3. Anthropic', 'info');
    log('4. GitHub Copilot', 'info');
    log('5. None (Skip AI features)', 'info');

    rl.question('Enter your choice (1-5): ', (answer) => {
      rl.close();

      switch(answer) {
        case '1':
          resolve('cursor');
          break;
        case '2':
          resolve('openai');
          break;
        case '3':
          resolve('anthropic');
          break;
        case '4':
          resolve('copilot');
          break;
        default:
          resolve('none');
      }
    });
  });
};

// Prompt the user for an API key if needed
export const promptForAPIKey = async (provider: string, quiet = false): Promise<string> => {
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
};

// Main function to call AI service
export const callAIService = async (prompt: string, quiet = false): Promise<string> => {
  const spinner = createSpinner(quiet);
  spinner.start('Calling AI service to fix code issues...');

  try {
    // Get AI configuration from LexConfig
    const aiConfig = LexConfig.config.ai || {provider: 'none'};

    // If running in Cursor IDE, default to cursor as provider
    if(process.env.CURSOR_IDE === 'true' && aiConfig.provider === 'none') {
      aiConfig.provider = 'cursor';
    }

    // If no provider is configured, prompt the user to choose one
    if(aiConfig.provider === 'none') {
      const provider = await promptForAIProvider(quiet);

      if(provider === 'none') {
        spinner.fail('AI features skipped');
        return '';
      }

      aiConfig.provider = provider;

      // Prompt for API key if needed for external services
      if(provider !== 'cursor' && provider !== 'copilot' &&
         !process.env[`${provider.toUpperCase()}_API_KEY`]) {
        aiConfig.apiKey = await promptForAPIKey(provider, quiet);
      }

      // Save the configuration for future use
      LexConfig.config.ai = aiConfig;

      // Write the configuration to a file
      const configPath = pathResolve(process.cwd(), 'lex.config.js');
      if(existsSync(configPath)) {
        try {
          const configContent = readFileSync(configPath, 'utf8');
          const updatedConfig = configContent.replace(
            /ai:.*?[,}]/s,
            `ai: { provider: '${aiConfig.provider}' },`
          );
          writeFileSync(configPath, updatedConfig);
        } catch(_error) {
          // Ignore errors when trying to update config
        }
      }
    }

    // Call the appropriate AI service based on the provider
    let result = '';
    switch(aiConfig.provider) {
      case 'cursor':
        result = await callCursorAI(prompt, aiConfig);
        log('Cursor IDE AI integration active', 'info', quiet);
        break;
      case 'openai':
        result = await callOpenAIAI(prompt, aiConfig);
        break;
      case 'anthropic':
        result = await callAnthropicAI(prompt, aiConfig);
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
  } catch(error) {
    spinner.fail(`AI service error: ${error.message}`);
    if(!quiet) {
      log(error, 'error');
    }
    return '';
  }
};