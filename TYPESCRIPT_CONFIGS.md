# TypeScript Configurations in Lex

Lex now uses specialized TypeScript configurations for different commands to optimize performance and functionality.

## Configuration Files

### 1. `tsconfig.build.json` - For Compilation and Building

Used by: `lex compile`, `lex build`

**Purpose:** Optimized for compilation and bundling with ESM output.

**Key Features:**

- ESM module format (`"module": "ESNext"`)
- Declaration file generation (`"declaration": true`)
- Source maps for debugging (`"inlineSourceMap": true`)
- Strict type checking (`"strict": true`)
- Excludes test files for faster compilation

**Use Cases:**

- Building production bundles
- Generating type declarations
- Compiling source code for distribution

### 2. `tsconfig.lint.json` - For Static Analysis

Used by: `lex lint`

**Purpose:** Optimized for static analysis and linting.

**Key Features:**

- No emission (`"noEmit": true`)
- Strict unused variable checking (`"noUnusedLocals": true`)
- Disabled pretty printing for faster analysis
- Excludes test files to focus on source code
- ESLint-friendly settings

**Use Cases:**

- Static type checking
- Code quality analysis
- Linting with ESLint + TypeScript

### 3. `tsconfig.test.json` - For Testing

Used by: `lex test`

**Purpose:** Optimized for testing environment.

**Key Features:**

- Includes test files (`**/*.test.*`, `**/*.spec.*`)
- Jest types included (`"types": ["jest", "node"]`)
- Relaxed strict mode for test flexibility (`"strict": false`)
- Source maps for debugging tests
- Coverage reporting support

**Use Cases:**

- Running unit tests
- Integration testing
- Test debugging and coverage

## Automatic Configuration

Lex automatically creates these configuration files when needed:

1. **First run:** If no specialized config exists, Lex creates it from templates
2. **Fallback:** If specialized config doesn't exist, falls back to default `tsconfig.json`
3. **Custom configs:** You can override any config by creating your own version

## Migration from Single Config

If you're migrating from a single `tsconfig.json`:

1. **Keep your existing config:** It will be used as a fallback
2. **Customize specialized configs:** Modify the generated configs for your needs
3. **Gradual adoption:** Commands will automatically use the appropriate config

## Customization

You can customize any of these configurations:

```json
// tsconfig.build.json - Customize for your build needs
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./lib",  // Custom output directory
    "target": "ES2020"  // Custom target
  }
}
```

## Benefits

1. **Performance:** Each config is optimized for its specific use case
2. **Clarity:** Clear separation of concerns between compilation, linting, and testing
3. **Flexibility:** Easy to customize each workflow independently
4. **Compatibility:** Maintains backward compatibility with existing setups
