# Repository Guidelines

## Project Structure & Module Organization
This repository is a pnpm + Turborepo monorepo.

- `packages/next-safe-action`: main library source (`src/`) and tests (`src/__tests__/`).
- `apps/playground`: Next.js playground app for validating library behavior (`src/app`).
- `website`: Docusaurus docs site (managed separately from the root workspace).
- `assets`: shared repository assets (images/logo files).

Keep library changes in `packages/next-safe-action`; use `apps/playground` for usage examples and manual verification.

## Build, Test, and Development Commands
Run from repository root unless noted.

- `pnpm install`: install root workspace dependencies.
- `pnpm run build`: run turbo builds across workspace packages.
- `pnpm run lint`: run lint tasks across workspace packages.
- `pnpm run test:lib`: run library tests only.
- `pnpm run build:lib && pnpm run pg`: rebuild library and start playground dev server.
- `pnpm run build:pg`: build playground only.
- `cd website && pnpm install && pnpm run start`: install and run docs site locally.

## Coding Style & Naming Conventions
TypeScript is the primary language. Formatting/linting is required.

- Prettier rules: tabs (`tabWidth: 2`), `printWidth: 120`, semicolons, double quotes, trailing commas (`es5`).
- Library lint command: `pnpm --filter next-safe-action run lint` (includes `tsc`, Prettier, ESLint).
- Follow existing naming patterns such as action files like `*-action.ts` and tests like `*.test.ts`.
- Prefer explicit type imports/exports (enforced by ESLint).

## Testing Guidelines
- Framework: Node test runner with `tsx` (`node --import tsx --test`).
- Location: `packages/next-safe-action/src/__tests__/`.
- Naming: `feature-name.test.ts` (e.g., `middleware.test.ts`).
- Run all library tests: `pnpm run test:lib`.
- Run a single test file (from `packages/next-safe-action`): `node --import tsx --test ./src/__tests__/middleware.test.ts`.

No explicit coverage threshold is configured; add regression tests for behavioral or API changes.

## Commit & Pull Request Guidelines
- Common patterns in history: `fix: ...`, `chore: ...`, `build: ...`, `docs(readme): ...`.
- For PRs targeting `main` that touch package or release-related files, include a Changeset file in `.changeset/`.
- If no version bump should be produced, add an empty Changeset (`pnpm run changeset -- --empty`).
- Before significant work, open or link an issue/discussion.
- PRs should include: clear summary, linked issue (if applicable), test updates, and docs updates for user-facing API changes.
