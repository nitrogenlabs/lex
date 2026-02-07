/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import chalk from 'chalk';
import {Command} from 'commander';
import {readFileSync} from 'fs';
import {sync as globSync} from 'glob';

import {LexConfig} from '../../LexConfig.js';
import {callAIService} from '../../utils/aiService.js';
import {log} from '../../utils/log.js';

if(process.env.CURSOR_EXTENSION === 'true' ||
  process.env.CURSOR_TERMINAL === 'true' ||
  process.env.CURSOR_APP === 'true' ||
  process.env.PATH?.includes('cursor') ||
  process.env.CURSOR_SESSION_ID) {
  process.env.CURSOR_IDE = 'true';
}

export interface AIOptions {
  readonly cliName?: string;
  readonly context?: boolean;
  readonly file?: string;
  readonly lexConfig?: string;
  readonly model?: string;
  readonly prompt?: string;
  readonly quiet?: boolean;
  readonly task?: 'generate' | 'explain' | 'test' | 'optimize' | 'help' | 'ask' | 'analyze';
  readonly debug?: boolean;
  readonly provider?: string;
  readonly dir?: string;
}

const getFileContext = (filePath: string): string => {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return `File: ${filePath}\n\n${content}`;
  } catch(_error) {
    return `Error reading file: ${filePath}`;
  }
};

const getProjectContext = async (options: AIOptions): Promise<string> => {
  const {file, task, context} = options;

  if(context === false) {
    return '';
  }

  let projectContext = '';

  if(file) {
    projectContext += getFileContext(file);
  }

  switch(task) {
    case 'generate':
      const files = globSync('src/**/*.{ts,tsx,js,jsx}', {
        cwd: process.cwd(),
        ignore: ['**/node_modules/**', '**/lib/**', '**/dist/**', '**/*.test.*', '**/*.spec.*'],
        maxDepth: 3
      });
      projectContext += `\n\nProject structure:\n${files.join('\n')}`;
      break;

    case 'test':
      if(file) {
        const testConfig = getFileContext('vitest.config.mjs');
        projectContext += `\n\nTest configuration:\n${testConfig}`;
      }
      break;

    case 'optimize':
      const webpackConfig = getFileContext('webpack.config.js');
      projectContext += `\n\nWebpack configuration:\n${webpackConfig}`;
      break;

    default:
      break;
  }

  return projectContext;
};

const constructPrompt = (options: AIOptions, projectContext: string): string => {
  const {task = 'help', prompt = ''} = options;

  const taskInstructions: Record<string, string> = {
    analyze: 'Analyze the following code:',
    ask: 'Provide guidance on the following development question:',
    explain: 'Explain the following code in detail, including any patterns, potential issues, and improvement suggestions:',
    generate: 'Generate code according to the following request. Make sure it follows best practices and is well documented:',
    help: 'Provide guidance on the following development question:',
    optimize: 'Analyze the following code/configuration and suggest optimization improvements:',
    test: 'Generate comprehensive unit tests for the following code:'
  };

  const taskInstruction = taskInstructions[task] || taskInstructions.help;

  let fullPrompt = `${taskInstruction}\n\n${prompt}`;

  if(projectContext) {
    fullPrompt += `\n\n===CONTEXT===\n${projectContext}`;
  }

  return fullPrompt;
};

const displayResponse = (response: any, options: AIOptions): void => {
  const {task = 'help', quiet = false} = options;

  let content = '';

  if(typeof response === 'string') {
    content = response;
  } else if(response.choices?.[0]?.message?.content) {
    const {content: messageContent} = response.choices[0].message;
    content = messageContent;
  } else if(response.content) {
    const {content: responseContent} = response;
    content = responseContent;
  } else {
    content = 'No response received from AI model';
  }

  const cleanedContent = cleanResponse(content, options);

  switch(task) {
    case 'generate':
      log('\nGenerated Code:\n', 'success', quiet);
      log(cleanedContent, 'default', quiet);
      break;

    case 'explain':
      log('\nCode Explanation:\n', 'success', quiet);
      log(cleanedContent, 'default', quiet);
      break;

    case 'test':
      log('\nGenerated Tests:\n', 'success', quiet);
      log(cleanedContent, 'default', quiet);
      break;

    case 'optimize':
      log('\nOptimization Suggestions:\n', 'success', quiet);
      log(cleanedContent, 'default', quiet);
      break;

    default:
      log('\nAI Response:\n', 'success', quiet);
      log(cleanedContent, 'default', quiet);
      break;
  }
};

const cleanResponse = (content: string, options: AIOptions): string => {
  const {prompt = '', task = 'help'} = options;

  if(!content) {
    return content;
  }

  let cleanedContent = content;

  const taskInstructions: Record<string, string> = {
    analyze: 'Analyze the following code:',
    ask: 'Provide guidance on the following development question:',
    explain: 'Explain the following code in detail, including any patterns, potential issues, and improvement suggestions:',
    generate: 'Generate code according to the following request. Make sure it follows best practices and is well documented:',
    help: 'Provide guidance on the following development question:',
    optimize: 'Analyze the following code/configuration and suggest optimization improvements:',
    test: 'Generate comprehensive unit tests for the following code:'
  };

  const instruction = taskInstructions[task] || '';

  if(instruction && cleanedContent.includes(instruction)) {
    cleanedContent = cleanedContent.replace(instruction, '').trim();
  }

  if(prompt && cleanedContent.includes(prompt)) {
    cleanedContent = cleanedContent.replace(prompt, '').trim();
  }

  if(cleanedContent.includes('===CONTEXT===')) {
    cleanedContent = cleanedContent.split('===CONTEXT===')[0].trim();
  }

  if(!cleanedContent) {
    return content;
  }

  return cleanedContent;
};

const getProviderAuth = (provider: string): string | undefined => {
  if(process.cwd().includes('reaktor')) {
    return 'cursor-auth';
  }

  if(process.env.AI_API_KEY) {
    return process.env.AI_API_KEY;
  }

  if(provider === 'none' && process.env.CURSOR_IDE === 'true') {
    return 'cursor-auth';
  }

  switch(provider) {
    case 'openai':
      return process.env.OPENAI_API_KEY;
    case 'anthropic':
      return process.env.ANTHROPIC_API_KEY;
    case 'cursor':
      return 'cursor-auth';
    case 'copilot':
      return process.env.GITHUB_TOKEN;
    case 'none':
      return undefined;
    default:
      return undefined;
  }
};

const detectCursorIDE = (): boolean => {
  if(process.env.CURSOR_IDE === 'true') {
    return true;
  }

  const possibleCursorSignals = [
    process.env.CURSOR_EXTENSION === 'true',
    process.env.CURSOR_TERMINAL === 'true',
    process.env.CURSOR_APP === 'true',
    process.env.PATH?.includes('cursor'),
    !!process.env.CURSOR_SESSION_ID
  ];

  const isCursorIDE = possibleCursorSignals.some((signal) => signal);

  if(isCursorIDE) {
    process.env.CURSOR_IDE = 'true';
  }

  return isCursorIDE;
};

export const aiFunction = async (options: AIOptions): Promise<any> => {
  try {
    const config = LexConfig.config || {};
    const aiConfig = config.ai || {};
    const provider = options.provider || aiConfig.provider || 'none';

    if(provider === 'none' && !process.env.CURSOR_EXTENSION) {
      log(`${chalk.red('Error:')} No AI provider configured.`, 'error');
      return {error: 'No AI provider configured'};
    }

    const task = options.task || 'ask';
    const validTasks = ['explain', 'generate', 'test', 'analyze', 'ask'];

    if(!validTasks.includes(task)) {
      log(`${chalk.red('Error:')} Invalid task "${task}". Valid tasks are: ${validTasks.join(', ')}`, 'error');
      return {error: `Invalid task "${task}"`};
    }

    const {prompt} = options;

    if(!prompt) {
      log(`${chalk.red('Error:')} No prompt provided. Use --prompt "Your prompt here"`, 'error');
      return {error: 'No prompt provided'};
    }

    let context = '';

    if(options.file) {
      try {
        const fs = await import('fs/promises');
        const glob = await import('glob');
        const files = await glob.glob(options.file);

        if(files.length === 0) {
          log(`${chalk.yellow('Warning:')} No files found matching "${options.file}"`, 'warning');
        } else {
          for(const file of files) {
            const content = await fs.readFile(file, 'utf8');
            context += `\n===FILE: ${file}===\n${content}\n`;
          }
        }
      } catch(error) {
        log(`${chalk.yellow('Warning:')} Error reading file: ${error.message}`, 'warning');
      }
    }

    if(options.dir) {
      try {
        const {execaSync} = await import('execa');
        const result = execaSync('find', [options.dir, '-type', 'f', '|', 'sort']);
        context += `\n===Project structure:===\n${result.stdout}\n`;
      } catch(error) {
        log(`${chalk.yellow('Warning:')} Error reading directory: ${error.message}`, 'warning');
      }
    }

    let formattedPrompt = '';

    switch(task) {
      case 'explain':
        formattedPrompt = `Explain the following code:\n${prompt}`;
        break;
      case 'generate':
        formattedPrompt = `Generate code according to the following request:\n${prompt}`;
        break;
      case 'test':
        formattedPrompt = `Generate comprehensive unit tests:\n${prompt}`;
        break;
      case 'analyze':
        formattedPrompt = `Analyze the following code:\n${prompt}`;
        break;
      case 'ask':
        formattedPrompt = `Provide guidance on the following development question:\n${prompt}`;
        break;
    }

    if(context) {
      formattedPrompt += `\n===CONTEXT===\n${context}`;
    }

    if((provider === 'cursor' || process.env.CURSOR_EXTENSION) && task === 'generate') {
      log('Using Cursor IDE for code generation...', 'info');
      log('Note: For full code generation capabilities, please use Cursor IDE directly with Cmd+L or Cmd+K.', 'info');
      log('The CLI integration has limited capabilities for code generation.', 'warning');
    } else if(provider === 'cursor' || process.env.CURSOR_EXTENSION) {
      log('Using Cursor IDE for AI assistance...', 'info');
      log('Note: This is a limited integration. For full AI capabilities, use Cursor IDE directly.', 'info');
    } else {
      log(`Using ${provider} for AI assistance...`, 'info');
    }

    const response = await callAIService(formattedPrompt, options.quiet || false);

    log(`\n${response}`, 'success');

    return {response};
  } catch(error) {
    log(`${chalk.red('Error:')} ${error.message}`, 'error');
    return {error: error.message};
  }
};

export const ai = new Command('ai')
  .description('Use AI to help with development tasks')
  .option('--provider <provider>', 'AI provider to use (openai, anthropic, cursor)')
  .option('--task <task>', 'Task to perform (explain, generate, test, analyze, ask)')
  .option('--prompt <prompt>', 'Prompt to send to AI')
  .option('--file <file>', 'File to analyze')
  .option('--dir <dir>', 'Directory to analyze')
  .action(async (options: AIOptions) => {
    await aiFunction(options);
  });

export default ai;
