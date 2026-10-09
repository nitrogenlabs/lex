# native-env

Runs Docker Compose run --rm --no-deps with inherited caller cwd/env/stdio and exact command argv after --. Defaults android/bash. Optional --composeFile/--cwd/--service/--workdir. Forwards termination signals and child status. Does not install SDKs or start dependencies.
