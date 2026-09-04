# WebMCP Challenge provenance

The Semantic Loop DevOps Demonstrator submission is an **existing project that has been meaningfully extended during the challenge submission period**.

## Before the submission period

The repository history establishes that the original Semantic Loop DevOps Demonstrator predates the challenge:

- The initial application commit is `8bc48fb` (January 1, 2026).
- The latest pre-challenge commit is `d4be2bb` (August 7, 2026).
- Before August 25, the application already offered a React/TypeScript interface for conversational schema generation, visual schema refinement, sample-data generation, visualization, and artifact export.
- Those features were designed for direct human interaction and optional Gemini-assisted generation. The page did not expose its workflow as WebMCP tools or offer a provider-neutral AI boundary.

## Added during the submission period

The WebMCP Challenge submission period began August 25, 2026. The challenge work is a distinct interoperability layer added after that date:

- Browser-native WebMCP tool registration through `document.modelContext.registerTool`.
- Structured, discoverable tools for inspecting and changing the same live project state shown to the person in the interface.
- Read and write operations that reuse the application's React state rather than maintaining a hidden agent-only copy.
- Clear tool responses intended to make agent actions observable and recoverable.
- A safe, usable no-secret path for judges, plus a server-side provider gateway for optional Gemini, OpenAI, or Anthropic generation.
- macOS Keychain set/list/remove helpers for local provider keys, avoiding plaintext `.env` files and browser key entry.
- WebMCP-focused automated tests, judge instructions, deployment configuration, and demo materials.

The submission should link to the final challenge commit or comparison once the branch is published:

- Pre-challenge baseline: `d4be2bb`
- Challenge implementation commit: **TODO — add the final commit SHA**
- Public comparison URL: **TODO — add `<repo>/compare/d4be2bb...<challenge-commit>`**

## Reproducibility notes

To review only the challenge contribution, compare the final submission commit against `d4be2bb`. The comparison should show the WebMCP adapter and tests, the judge-accessible runtime path, deployment configuration, and this submission documentation. Existing product capabilities should not be represented as newly built for the challenge.
