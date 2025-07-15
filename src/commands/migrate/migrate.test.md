# Migrate Command Tests

The migrate command tests are organized into three categories:

## CLI Tests (`migrate.cli.test.ts`)

These tests focus on the command-line interface aspects of the `migrate` command:

- Verifying that the command correctly processes command-line arguments
- Testing default behavior when no options are provided
- Testing each option individually
- Testing error handling for various failure scenarios
- Verifying that the command returns the correct exit codes

Key test cases:
- Migrating with default options
- Using custom CLI name
- Using custom package manager
- Using package manager from config
- Using quiet mode
- Handling installation errors
- Working with process.exit as default callback

## Integration Tests (`migrate.integration.test.ts`)

These tests verify that the `migrate` command works correctly as a whole:

- Testing the complete workflow from module removal to dependency installation
- Verifying that error handling works correctly

Key test cases:
- Executing the full migration workflow
- Handling installation errors gracefully

## Options Tests (`migrate.options.test.ts`)

These tests focus on verifying that the command accepts and processes all supported options:

- Testing each option individually
- Testing combinations of options
- Verifying default values when options are not provided

Key test cases:
- Testing the `cliName` option
- Testing the `packageManager` option
- Testing the `quiet` option
- Testing all options together

## Mocking Strategy

The tests use the following mocks to isolate the `migrate` command functionality:

- `execa`: Mocked to simulate package installation
- `LexConfig`: Mocked to provide configuration values
- `app.js`: Mocked to simulate spinner, module removal, and package.json operations
- `log.js`: Mocked to capture log messages

## Test Coverage

The tests aim to cover:

- All code paths in the `migrate` function
- All options and their combinations
- All error handling scenarios 