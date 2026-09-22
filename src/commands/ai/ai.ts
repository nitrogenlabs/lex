/**
 * Copyright (c) 2018-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import chalk from 'chalk';
import {Command} from 'commander';

import {LexConfig} from '../../LexConfig.js';
import {callAIService} from '../../utils/aiService.js';
import {log} from '../../utils/log.js';

import type {AIConfig} from '../../LexConfig.js';

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

export const aiFunction = async (options: AIOptions): Promise<any> => {
  try {
    await LexConfig.parseConfig(options);
    const config = LexConfig.config || {};
    const aiConfig: AIConfig = {
      ...config.ai,
      ...(options.model ? {model: options.model} : {}),
      ...(options.provider ? {provider: options.provider as AIConfig['provider']} : {})
    };
    LexConfig.config.ai = aiConfig;
    const provider = options.provider || aiConfig.provider || 'none';

    if(provider === 'none' && !process.env.CURSOR_EXTENSION) {
      log(`${chalk.red('Error:')} No AI provider configured.`, 'error');
      return {error: 'No AI provider configured'};
    }

    const task = options.task || 'help';
    const validTasks = ['explain', 'generate', 'test', 'optimize', 'help', 'analyze', 'ask'];

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

    if(options.context !== false && options.file) {
      try {
        const fs = await import('fs/promises');
        const glob = await import('glob');
        const files = await glob.glob(options.file);

        if(files.length === 0) {
          log(`${chalk.yellow('Warning:')} No files found matching "${options.file}"`, 'warning');
        } else {
          const fileContexts = await Promise.all(files.map(async (file) => {
            const content = await fs.readFile(file, 'utf8');
            return `\n===FILE: ${file}===\n${content}\n`;
          }));
          context += fileContexts.join('');
        }
      } catch(error) {
        log(`${chalk.yellow('Warning:')} Error reading file: ${error.message}`, 'warning');
      }
    }

    if(options.context !== false && options.dir) {
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
      case 'optimize':
        formattedPrompt = `Analyze the following code or configuration and suggest optimization improvements:\n${prompt}`;
        break;
      case 'ask':
      case 'help':
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
  .option('--task <task>', 'Task to perform (explain, generate, test, optimize, help, analyze, ask)')
  .option('--prompt <prompt>', 'Prompt to send to AI')
  .option('--file <file>', 'File to analyze')
  .option('--dir <dir>', 'Directory to analyze')
  .action(async (options: AIOptions) => {
    await aiFunction(options);
  });

export default ai;
