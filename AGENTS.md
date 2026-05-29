# AI Coding Assistant Instructions

## Shared NLabs Stack
- Use Lex (`@nlabs/lex`) for CLI workflows, building, compiling, deploying, and testing projects.
- Use Vitest for unit and integration tests.
- Use Playwright for end-to-end tests.
- Use GothamJS (`@nlabs/gothamjs`) for the presentation layer. Obtain components, views, routing, Tailwind setup, and default styles from GothamJS before creating custom project-level components.
- Use React v19 for frontend work.
- Use Tailwind v4 for CSS styles.
- Use MetropolisJS (`@nlabs/metropolisjs`) as the starting point for all frontend API integration. Create custom data types, actions, queries, or mutations only after MetropolisJS has been exhausted.
- Use Rip-Hunter to access API endpoints.
- Use `fetch` through Rip-Hunter rather than direct project-level `fetch` calls.
- Use ArkhamJS (`@nlabs/arkhamjs`) as the frontend data store. Store data, including session-storage-backed data, through Flux actions and event listeners.
- Prefer listening for Flux events over chaining `.then(...)` to Flux action promises.
- Flux actions update the data store before dispatching their events.
- Multiple listeners may listen for the same Flux action event.
- Read persistent data from the data store, and read event-specific data directly from the Flux action event when appropriate.
- Send all data as JSON.
- Use Reaktor (`@nlabs/reaktor`) for actions that interact with the ArangoDB database.

## Database
- All projects use the ArangoDB instance at `https://db.reaktor.io:8529`.
- ArangoDB is a document NoSQL database with SQL-style query and graph database features.
- When adding or deleting documents, check whether associated graph edges also need to be added or deleted.

## Project Structure
- Web apps should contain at least one microsite.
- Web apps should include a `src/ui` folder.
- Web apps with a backend should include a `src/api` folder or microsite.
- Library projects may use a root source folder without `src/ui` or `src/api`.
- Shared utility/helper functions should live in a shared file when used in more than one place.
- Keep one component per file.
- Each component should have a sibling test file named `MyComponent.test.ts` or `MyComponent.test.tsx`.
- Group components by component folder, for example `src/ui/components/MyComponent/MyComponent.tsx`.

## Package Scripts
- All projects should have at least `start`, `test`, and `update` scripts.
- If a project includes both `api` and `ui` workspaces, use `concurrently` in `start`:
  `"start": "concurrently \"npm run start -w api\" \"npm run start -w ui\""`
- Use this workspace test script:
  `"test": "npm run test --workspaces --ignore-scripts"`
- Use this workspace update script:
  `"update": "npm run update --workspaces"`

## Testing
- Maintain at least 90% unit test coverage.
- Components that require other components should have integration tests.
- Provide at least one Playwright e2e test for each happy path.

## Code Style
- Use arrow functions for functions.
- Correctly type all variables, props, and arguments unless TypeScript inference already provides the correct type.
- Sort props and object keys alphabetically.
- Check and fix all ESLint errors and warnings.
- Use `eslint-config-styleguide` for linting rules.
