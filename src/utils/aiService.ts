/**
 * Copyright (c) 2022-Present, Nitrogen Labs, Inc.
 * Copyrights licensed under the MIT License. See the accompanying LICENSE file for terms.
 */
import {existsSync, readFileSync, writeFileSync} from 'fs';
import {resolve as pathResolve} from 'path';
import readline from 'readline';

import {AIConfig, LexConfig} from '../LexConfig.js';
import {createSpinner} from './app.js';
import {log} from './log.js';

// Cursor IDE integration
export const callCursorAI = async (prompt: string, _options: AIConfig): Promise<string> => {
  try {
    // When running within Cursor IDE, we can write the prompt to a temporary file
    // that Cursor can use to provide AI assistance
    log('Using Cursor IDE for AI fixes...', 'info');

    // For now, just log the prompt and return a placeholder
    // In a real implementation, Cursor would handle this automatically
    log('AI fix requested via Cursor IDE', 'info');

    const taskMatch = prompt.match(/^(Generate code according to the following request|Explain the following code|Generate comprehensive unit tests|Analyze the following code|Provide guidance on the following development question):/);
    const task = taskMatch ? taskMatch[1] : '';
    const isGenerateTask = task.startsWith('Generate code');

    const questionMatch = prompt.match(/(?:Generate code according to the following request|Explain the following code|Generate comprehensive unit tests|Analyze the following code|Provide guidance on the following development question):\s*([\s\S]+?)(?:===CONTEXT===|$)/);
    const question = questionMatch ? questionMatch[1].trim() : prompt;

    if(question.toLowerCase().includes('how many files') && prompt.includes('Project structure:')) {
      const projectStructure = prompt.split('Project structure:')[1] || '';
      const files = projectStructure.trim().split('\n');
      return `Based on the project structure provided, there are ${files.length} files in the project.`;
    }

    if(isGenerateTask) {
      return `
# Code Generation Request: "${question}"

To generate code using Cursor's AI capabilities:

1. **Open your project in Cursor IDE** (https://cursor.sh)
2. Press **Cmd+L** (or Ctrl+L on Windows/Linux) to open the AI chat
3. Type your request: "${question}"
4. Cursor will generate the code directly in your editor

The current CLI integration doesn't have direct access to Cursor's code generation capabilities.

**Alternative options:**

1. **Use OpenAI or Anthropic directly:**
   Configure in your lex.config file:
   \`\`\`js
   export default {
     ai: {
       provider: 'openai',
       apiKey: process.env.OPENAI_API_KEY,
       model: 'gpt-4o'
     }
   }
   \`\`\`

2. **Use Cursor's command line tool:**
   Install: \`npm install -g @cursor/cli\`
   Run: \`cursor ai "${question}"\`
`;
    }

    return `
To use Cursor's AI capabilities for "${question}", you need to:

1. Open your project in Cursor IDE (https://cursor.sh)
2. Use Cursor's built-in AI features by pressing Cmd+K or Cmd+L
3. Or run the 'cursor' command directly from your terminal

The current integration is limited and doesn't directly access Cursor's AI capabilities.

For the best experience with AI code generation:
- Use Cursor IDE directly
- Or configure OpenAI or Anthropic as your provider in your lex.config file:

\`\`\`js
// lex.config.js (or lex.config.mjs, lex.config.cjs, etc.)
export default {
  ai: {
    provider: 'openai', // or 'anthropic'
    apiKey: process.env.OPENAI_API_KEY, // or ANTHROPIC_API_KEY
    model: 'gpt-4o' // or 'claude-3-opus'
  }
}
\`\`\`

Then set your API key as an environment variable:
\`\`\`
export OPENAI_API_KEY=your_key_here
\`\`\`
`;
  } catch(error) {
    throw new Error(`Cursor AI error: ${error.message}`);
  }
};

export const callOpenAIAI = async (prompt: string, options: AIConfig): Promise<string> => {
  try {
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    if(!apiKey) {
      throw new Error('OpenAI API key is required. Set it in your lex.config file or as OPENAI_API_KEY environment variable.');
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

export const callAnthropicAI = async (prompt: string, options: AIConfig): Promise<string> => {
  try {
    const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    if(!apiKey) {
      throw new Error('Anthropic API key is required. Set it in your lex.config file or as ANTHROPIC_API_KEY environment variable.');
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

export const callCopilotAI = async (prompt: string, _options: AIConfig): Promise<string> => {
  try {
    log('GitHub Copilot AI fixes not directly supported. Using manual fix mode.', 'info');
    return prompt;
  } catch(error) {
    throw new Error(`GitHub Copilot AI error: ${error.message}`);
  }
};

export const promptForAIProvider = async (_quiet = false): Promise<'cursor' | 'copilot' | 'openai' | 'anthropic' | 'none'> => {
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

export const promptForAPIKey = async (provider: string, _quiet = false): Promise<string> => {
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

export const getAIService = (
  provider: string,
  _options: AIConfig
): (prompt: string, options: AIConfig)=> Promise<string> => {
  switch(provider) {
    case 'cursor':
      return callCursorAI;
    case 'openai':
      return callOpenAIAI;
    case 'anthropic':
      return callAnthropicAI;
    case 'copilot':
      return callCopilotAI;
    default:
      return async () => 'No AI provider configured';
  }
};

export const callAIService = async (prompt: string, quiet = false): Promise<string> => {
  const spinner = createSpinner(quiet);
  spinner.start('Calling AI service to fix code issues...');

  try {
    const aiConfig = LexConfig.config.ai || {provider: 'none'};

    const isInCursorIDE = process.env.CURSOR_IDE === 'true';
    if(isInCursorIDE && (aiConfig.provider === 'none' || !aiConfig.provider)) {
      log('Detected Cursor IDE environment, using Cursor as AI provider', 'info', quiet);
      aiConfig.provider = 'cursor';
    }

    if(aiConfig.provider === 'none') {
      const provider = await promptForAIProvider(quiet);

      if(provider === 'none') {
        spinner.fail('AI features skipped');
        return '';
      }

      aiConfig.provider = provider;

      if(provider !== 'cursor' && provider !== 'copilot' &&
        !process.env[`${provider.toUpperCase()}_API_KEY`]) {
        aiConfig.apiKey = await promptForAPIKey(provider, quiet);
      }

      LexConfig.config.ai = aiConfig;

      // Search for config files in multiple formats like LexConfig.parseConfig does
      const configFormats = ['js', 'mjs', 'cjs', 'ts', 'json'];
      const configBaseName = 'lex.config';
      let configPath = '';

      for(const format of configFormats) {
        const potentialPath = pathResolve(process.cwd(), `./${configBaseName}.${format}`);
        if(existsSync(potentialPath)) {
          configPath = potentialPath;
          break;
        }
      }

      if(configPath) {
        try {
          const configContent = readFileSync(configPath, 'utf8');
          const updatedConfig = configContent.replace(
            /ai:.*?[,}]/s,
            `ai: { provider: '${aiConfig.provider}' },`
          );
          writeFileSync(configPath, updatedConfig);
        } catch(_error) {
        }
      }
    }

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