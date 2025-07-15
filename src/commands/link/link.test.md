# Link Command Tests

The link command tests are organized into three categories:

## CLI Tests (`link.cli.test.ts`)

These tests focus on the command-line interface aspects of the `linked` command:

- Verifying that the command correctly processes command-line arguments
- Testing default behavior when no options are provided
- Testing each option individually
- Verifying that the command returns the correct exit codes

Key test cases:
- Checking for linked modules with default options
- Using custom CLI name
- Using quiet mode
- Working without a callback

## Integration Tests (`link.integration.test.ts`)

These tests verify that the `linked` command works correctly as a whole:

- Testing the complete workflow from configuration parsing to module checking
- Verifying that the quiet mode is handled correctly

Key test cases:
- Executing the full linked modules workflow
- Handling quiet mode correctly

## Options Tests (`link.options.test.ts`)

These tests focus on verifying that the command accepts and processes all supported options:

- Testing each option individually
- Testing combinations of options
- Verifying default values when options are not provided

Key test cases:
- Testing the `cliName` option
- Testing the `quiet` option
- Testing all options together

## Mocking Strategy

The tests use the following mocks to isolate the `linked` command functionality:

- `LexConfig`: Mocked to simulate configuration parsing
- `app.js`: Mocked to simulate checking for linked modules
- `log.js`: Mocked to capture log messages

## Test Coverage

The tests aim to cover:

- All code paths in the `linked` function
- All options and their combinations
- Edge cases like missing callback 