# AGENTS.md

## Build Commands
- Frontend (portfolio-react): `cd frontend/portfolio-react && pnpm build`
- Frontend (portfolio-cms): `cd frontend/portfolio-cms && npm run build`
- Backend: `cd backend/dotnet && dotnet build`

## Lint Commands
- Frontend: `cd frontend/portfolio-react && npx eslint src/` (if eslint installed)
- Backend: No specific lint command; use `dotnet format` for code formatting

## Test Commands
- Frontend: `cd frontend/portfolio-react && pnpm vitest run`
- Single test: `cd frontend/portfolio-react && pnpm vitest run --grep "test name"`
- Frontend (cms): `cd frontend/portfolio-cms && npm test`
- Backend: `cd backend/dotnet && dotnet test`
- Single test: `cd backend/dotnet && dotnet test --filter "FullyQualifiedName~TestClass.TestMethod"`

## Code Style Guidelines
- **C#**: PascalCase for classes, methods, properties; camelCase for local variables; enable nullable; use implicit usings; group namespaces alphabetically.
- **TypeScript/React**: camelCase for variables/functions; PascalCase for components; use TypeScript types; prefer const/let over var.
- **Imports**: Group by standard library, third-party, then local; sort alphabetically within groups.
- **Error Handling**: Use try-catch blocks; throw meaningful exceptions; avoid silent failures.
- **Naming**: Descriptive names; avoid abbreviations; follow domain conventions.
- **Formatting**: 2 spaces for JS/TS; consistent with existing code; no trailing spaces.</content>
<parameter name="filePath">AGENTS.md