# Update Command Testing

The update command is tested using three types of tests:

## CLI Tests

CLI tests verify that the update command correctly interacts with the command line interface:

- Verifies that the command correctly uses npm or yarn based on the packageManager option
- Tests that the interactive flag works correctly
- Tests that the registry option is passed correctly
- Verifies error handling

## Integration Tests

Integration tests verify that the update command correctly integrates with other parts of the system:

- Tests that the command correctly uses the packageManager from LexConfig when not provided in the command
- Tests that the command packageManager takes precedence over the config packageManager
- Verifies that the command defaults to npm if no packageManager is specified
- Tests that the command returns the correct exit codes on success and failure

## Options Tests

Options tests verify that the UpdateOptions interface works correctly:

- Tests that all options can be set correctly
- Tests that partial options work correctly
- Tests that empty options work correctly 