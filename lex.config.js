/**
 * Root-level Lex configuration file
 */
export default {
  // Source and output paths
  sourcePath: './src',
  outputPath: './dist',
  
  // Project settings
  name: 'lex',
  useTypescript: true,
  
  // AI configuration for linting
  ai: {
    // Using Cursor IDE as the AI provider
    provider: 'cursor',
    model: 'cursor-code',
    
    // You can customize these settings based on your preferences
    maxTokens: 4000,
    temperature: 0.1
  }
}; 