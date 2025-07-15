# Publish Command Tests

The publish command tests are organized into three categories:

## CLI Tests (`publish.cli.test.ts`)

These tests focus on the command-line interface aspects of the `publish` command:

- Verifying that the command correctly processes command-line arguments
- Testing default behavior when no options are provided
- Testing each option individually
- Testing error handling for various failure scenarios
- Verifying that the command returns the correct exit codes

Key test cases:
- Publishing with default options
- Using custom CLI name
- Using custom package manager
- Using package manager from config
- Using quiet mode
- Handling private option
- Handling OTP option
- Handling tag option
- Handling newVersion option
- Handling different bump types (major, minor, patch, prerelease)
- Handling Yarn with nextVersion
- Handling invalid version in package.json
- Handling invalid bump type
- Handling empty bump type
- Handling package.json not found
- Handling setPackageJson error
- Handling publish error
- Working with process.exit as default callback

## Integration Tests (`publish.integration.test.ts`)

These tests verify that the `publish` command works correctly as a whole:

- Testing the complete workflow from version bumping to package publishing
- Verifying that different version bump types work correctly
- Verifying that error handling works correctly

Key test cases:
- Executing the full publish workflow with patch bump
- Executing the full publish workflow with yarn and prerelease
- Executing the full publish workflow with specific version
- Handling package.json not found error
- Handling invalid version error
- Handling publish error

## Options Tests (`publish.options.test.ts`)

These tests focus on verifying that the command accepts and processes all supported options:

- Testing each option individually
- Testing combinations of options
- Verifying default values when options are not provided

Key test cases:
- Testing the `bump` option
- Testing the `cliName` option
- Testing the `newVersion` option
- Testing the `otp` option
- Testing the `packageManager` option
- Testing the `private` option
- Testing the `quiet` option
- Testing the `tag` option
- Testing all options together
- Testing different bump types

## Mocking Strategy

The tests use the following mocks to isolate the `publish` command functionality:

- `execa`: Mocked to simulate package publishing
- `semver`: Mocked to simulate version bumping
- `LexConfig`: Mocked to provide configuration values
- `app.js`: Mocked to simulate spinner, package.json operations
- `log.js`: Mocked to capture log messages

## Test Coverage

The tests aim to cover:

- All code paths in the `publish` function
- All options and their combinations
- All error handling scenarios
- All version bump types 