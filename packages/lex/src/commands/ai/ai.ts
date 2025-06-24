/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {readFileSync} from 'fs';
import {sync as globSync} from 'glob';
import OpenAI from 'openai';

import {LexConfig} from '../../LexConfig.js';
import {createSpinner} from '../../utils/app.js';
import {log} from '../../utils/log.js';

export interface AIOptions {
  readonly cliName?: string;
  readonly context?: boolean;
  readonly file?: string;
  readonly lexConfig?: string;
  readonly model?: string;
  readonly prompt?: string;
  readonly quiet?: boolean;
  readonly task?: 'generate' | 'explain' | 'test' | 'optimize' | 'help';
}

/**
 * Extract context from a specific file
 */
const getFileContext = (filePath: string): string => {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return `File: ${filePath}\n\n${content}`;
  } catch(_error) {
    return `Error reading file: ${filePath}`;
  }
};

/**
 * Get context from the project based on the task
 */
const getProjectContext = async (options: AIOptions): Promise<string> => {
  const {file, task, context} = options;

  // If context is disabled or no specific context is needed
  if(context === false) {
    return '';
  }

  let projectContext = '';

  // Get context from specific file if provided
  if(file) {
    projectContext += getFileContext(file);
  }

  // Add additional context based on the task
  switch(task) {
    case 'generate':
    // Add project structure info for generation context
      const files = globSync('src/**/*.{ts,tsx,js,jsx}', {
        cwd: process.cwd(),
        ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.*', '**/*.spec.*'],
        maxDepth: 3
      });
      projectContext += `\n\nProject structure:\n${files.join('\n')}`;
      break;

    case 'test':
    // Add test configuration and similar test files
      if(file) {
        const testConfig = getFileContext('jest.config.js');
        projectContext += `\n\nTest configuration:\n${testConfig}`;
      }
      break;

    case 'optimize':
    // Add build configuration
      const webpackConfig = getFileContext('webpack.config.js');
      projectContext += `\n\nWebpack configuration:\n${webpackConfig}`;
      break;

    default:
    // No additional context
      break;
  }

  return projectContext;
};

/**
 * Construct the prompt to send to the AI model
 */
const constructPrompt = (options: AIOptions, projectContext: string): string => {
  const {task = 'help', prompt = ''} = options;

  const taskInstructions: Record<string, string> = {
    generate: 'Generate code according to the following request. Make sure it follows best practices and is well documented:',
    explain: 'Explain the following code in detail, including any patterns, potential issues, and improvement suggestions:',
    test: 'Generate comprehensive unit tests for the following code:',
    optimize: 'Analyze the following code/configuration and suggest optimization improvements:',
    help: 'Provide guidance on the following development question:'
  };

  const taskInstruction = taskInstructions[task] || taskInstructions.help;

  let fullPrompt = `${taskInstruction}\n\n${prompt}`;

  // Add project context if available
  if(projectContext) {
    fullPrompt += `\n\n===CONTEXT===\n${projectContext}`;
  }

  return fullPrompt;
};

/**
 * Display the AI response based on the task
 */
const displayResponse = (response: any, options: AIOptions): void => {
  const {task = 'help', quiet = false} = options;

  const content = response.choices?.[0]?.message?.content || 'No response received from AI model';

  // Display with appropriate formatting based on task
  switch(task) {
    case 'generate':
      log('\nGenerated Code:\n', 'success', quiet);
      log(content, 'default', quiet);
      break;

    case 'explain':
      log('\nCode Explanation:\n', 'success', quiet);
      log(content, 'default', quiet);
      break;

    case 'test':
      log('\nGenerated Tests:\n', 'success', quiet);
      log(content, 'default', quiet);
      break;

    case 'optimize':
      log('\nOptimization Suggestions:\n', 'success', quiet);
      log(content, 'default', quiet);
      break;

    default:
      log('\nAI Response:\n', 'success', quiet);
      log(content, 'default', quiet);
      break;
  }
};

/**
 * Get the appropriate API key or authentication for the selected provider
 */
const getProviderAuth = (provider: string): string | undefined => {
  // Check for generic AI_API_KEY first
  if(process.env.AI_API_KEY) {
    return process.env.AI_API_KEY;
  }

  // Check for provider-specific environment variables
  switch(provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY;
    case 'cursor':
      // Cursor uses its own authentication
      return 'cursor-auth';
    case 'copilot':
      // GitHub Copilot uses GitHub authentication
      return process.env.GITHUB_TOKEN;
    default:
      return undefined;
  }
};

/**
 * The main AI command function
 */
export const ai = async (options: AIOptions): Promise<number> => {
  const {
    cliName = 'Lex',
    lexConfig,
    model,
    prompt = '',
    quiet = false,
    task = 'help'
  } = options;

  // Parse Lex config if provided
  if(lexConfig) {
    await LexConfig.parseConfig({lexConfig, quiet});
  }

  // Display status
  log(`${cliName} AI Assistant...`, 'info', quiet);

  // Spinner
  const spinner = createSpinner(quiet);
  spinner.start(`Processing ${task} request...`);

  try {
    // Check for AI provider in config
    const aiProvider = LexConfig.config.ai?.provider || 'openai';
    // Get model from options, config, or default
    const aiModel = model || LexConfig.config.ai?.model || 'gpt-4o';
    
    // Get authentication for the provider
    const configApiKey = LexConfig.config.ai?.apiKey;
    const envApiKey = getProviderAuth(aiProvider);
    const apiKey = configApiKey || envApiKey;

    // For providers that need direct API access
    if(['openai', 'anthropic'].includes(aiProvider) && !apiKey) {
      spinner.fail(`${aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)} API key not found. Set ${aiProvider.toUpperCase()}_API_KEY environment variable, AI_API_KEY, or add ai.apiKey to your Lex configuration.`);
      return 1;
    }
    
    if(aiProvider === 'cursor') {
      // Handle Cursor provider
      log('Using Cursor AI provider', 'info', quiet);
      
      // Import the AI service dynamically
      const {callAIService} = await import('../../utils/aiService.js');
      
      // Get context from project
      const projectContext = await getProjectContext(options);
      
      // Construct AI prompt based on task
      const aiPrompt = constructPrompt(options, projectContext);
      
      // Call Cursor AI service
      const response = await callAIService(aiPrompt, quiet);
      
      // Stop spinner
      spinner.succeed(`${task} request completed!`);
      
      // Display response
      log('\nAI Response:\n', 'success', quiet);
      log(response, 'default', quiet);
      
      return 0;
    } else if(aiProvider === 'copilot') {
      // Handle GitHub Copilot
      if(!process.env.GITHUB_TOKEN) {
        spinner.fail('GitHub token not found. Set GITHUB_TOKEN environment variable for Copilot access.');
        return 1;
      }
      
      log('Using GitHub Copilot', 'info', quiet);
      
      // Import the AI service dynamically
      const {callAIService} = await import('../../utils/aiService.js');
      
      // Get context from project
      const projectContext = await getProjectContext(options);
      
      // Construct AI prompt based on task
      const aiPrompt = constructPrompt(options, projectContext);
      
      // Call AI service with Copilot provider
      const response = await callAIService(aiPrompt, quiet);
      
      // Stop spinner
      spinner.succeed(`${task} request completed!`);
      
      // Display response
      log('\nAI Response:\n', 'success', quiet);
      log(response, 'default', quiet);
      
      return 0;
    } else {
      // Handle OpenAI/Anthropic provider (default)
      if(!apiKey) {
        spinner.fail(`API key not found for ${aiProvider} provider.`);
        return 1;
      }
      
      // Initialize AI client
      const openai = new OpenAI({
        apiKey: apiKey // Now guaranteed to be string
      });
      
      // Get context from project
      const projectContext = await getProjectContext(options);
      
      // Construct AI prompt based on task
      const aiPrompt = constructPrompt(options, projectContext);
      
      // Call AI service
      const response = await openai.chat.completions.create({
        model: aiModel,
        messages: [
          {role: 'system', content: 'You are a helpful development assistant integrated into the Lex CLI. Provide concise, practical answers.'},
          {role: 'user', content: aiPrompt}
        ]
      });
      
      // Stop spinner
      spinner.succeed(`${task} request completed!`);
      
      // Process and display response
      displayResponse(response, options);
      
      return 0;
    }
  } catch(error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    spinner.fail(`AI request failed: ${errorMessage}`);
    log(`\n${cliName} Error: ${errorMessage}`, 'error', quiet);

    if(!quiet) {
      console.error(error);
    }

    return 1;
  }
};

export default ai;