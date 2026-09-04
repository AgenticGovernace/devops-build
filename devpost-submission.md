# Project title

**TODO — choose the final project name.** The existing repository name is Semantic Loop DevOps Demonstrator; the organizers recommend that the participant choose the submission name personally.

> Draft only. This document has not been submitted to Devpost.

## One-line Summary

A shared schema-design workspace where people shape the model visually and WebMCP agents inspect, edit, seed, and export the same live project.

## Problem

Database design often splits into two disconnected experiences. A person works visually in a browser while an AI assistant receives pasted fragments, guesses at current state, or drives the page through brittle clicks. That gap makes collaboration slow and risky: the person cannot easily review what the agent believes, and the agent cannot reliably act on the model the person is seeing.

## Solution

Semantic Loop turns the browser page into a shared, structured workspace. The person can continue using the visual schema editor while an agent discovers purpose-built WebMCP tools on that same page. The agent can inspect the current project, create or revise a schema, add sample data, and export the project through typed operations. Every change flows through the application's real React state, so the interface immediately shows the result for human review.

This is stronger than generic browser automation: the agent works with domain concepts such as tables, columns, keys, sample data, and project exports instead of screen coordinates or incidental DOM text.

## Why This Matters

The target users are developers, data architects, product teams, and technical operators who need to turn requirements into a reviewable data model. WebMCP gives them a collaboration loop that was previously awkward:

1. A person describes intent and watches the model evolve.
2. An agent reads the exact current project state.
3. The agent proposes or applies a structured change.
4. The person reviews the result in the visual interface and can edit it directly.
5. Either participant can continue from the same state and export a portable result.

That shortens the path from conversation to an auditable artifact while keeping the person in control of the visible source of truth.

## How We Used AI

- WebMCP-enabled agents operate the application through explicit, typed tools rather than DOM scraping.
- A provider-neutral server-side gateway supports optional natural-language schema, data, visualization, and artifact generation using Gemini, OpenAI, or Anthropic when the operator configures credentials.
- The core WebMCP demonstration is designed to remain usable without sharing any provider credential: judges can exercise the page-state tools and review their visible effects directly.

## How We Used Codex

Codex helped inspect the existing codebase, separate pre-challenge product work from the new challenge contribution, design the WebMCP tool boundary around the application's existing state model, implement and test the adapter, harden the no-secret judge path, and prepare the Netlify and Devpost materials. Human review remained the decision point for project selection, rules acceptance, product positioning, and final submission.

## Key Features

- A visual React schema-design workflow that remains usable by a person.
- Discoverable WebMCP tools with JSON schemas and focused descriptions.
- A single shared project state for human UI actions and agent tool calls.
- Structured read, create, update, sample-data, and export operations.
- Visible feedback after agent mutations so the person can review the outcome.
- A no-secret judge path for the core WebMCP flow, with multi-provider AI features as an optional enhancement.
- Browser code never receives provider keys. Local development can load them using macOS Keychain, production reads protected Netlify secrets, and the gateway sends credentials only to the selected provider over HTTPS.
- Portable project export for continuing the work outside the current browser session.

## WebMCP Tools

| Tool                   | What the agent provides                                                     | Effect                                                                                                                                |
| ---------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `get_project_state`    | `{}`                                                                        | Returns `{ok, activeTab, dialect, schema, counts, artifacts}` without exposing chat or uploaded-file contents.                        |
| `create_schema`        | `{description?, tables:[...]}`                                              | Validates and installs the schema, clears stale derived outputs, opens Refine, and returns a summary and table names.                 |
| `apply_schema_changes` | `{description?, addTables?, removeTables?, upsertColumns?, removeColumns?}` | Applies bounded named edits, clears stale derived outputs, opens Refine, and returns the resulting table names or a structured error. |
| `set_sample_data`      | `{data:{[table]: rows[]}}`                                                  | Validates table/column names and primitive cells, enforces 1,000-row and 250 KB caps, opens Data, and reports row counts.             |
| `export_project`       | `{dialect?: "PostgreSQL"                                                    | "MySQL", includeSampleData?: boolean}`                                                                                                | Deterministically creates SQL/JSON file objects, stores the SQL, and opens Export; it does not upload or publish. |

The source registers these tools with `document.modelContext.registerTool`.

`webmcp/tools.ts` defines `registerWebMcpTools`; `webmcp/useWebMcpTools.ts` mounts the `document.modelContext.registerTool` registration into React. `export_project` returns `files: [{name, mediaType, content}]`.

## Architecture

The application is a Vite-built React 19 and TypeScript single-page app. React Context and a reducer hold the canonical project state. The WebMCP adapter registers browser-native tools, validates structured inputs, and dispatches through that existing state boundary. UI components subscribe to the same state and immediately render agent-initiated changes. Browser persistence keeps the working project local, and the export path produces a portable project representation.

Gemini, OpenAI, and Anthropic are optional service integrations behind one provider-neutral server-side boundary. They are not the state store and are not required for the basic WebMCP tool demonstration.

## Testing Instructions

### Local build and automated checks

```bash
npm install --legacy-peer-deps
npm run validate
npm run test:run -- tests/webmcp.test.ts
npm run build
npm run dev
```

Open `http://localhost:3000` in Chrome with WebMCP enabled or in ChatGPT's in-app browser.

### Judge flow

1. Open the live application URL in a WebMCP-capable client.
2. Ask the client to list the page's available tools; confirm the tools in the table above are discoverable.
3. Call `get_project_state` and confirm its response matches the page.
4. Call `create_schema` with a small schema, such as `customers`, `orders`, and a foreign-key relationship.
5. Confirm the new tables appear in the visual editor.
6. Call `apply_schema_changes` to add a field or table; confirm the interface updates.
7. Call `set_sample_data` with rows whose keys match the schema; confirm the response reports the supplied row counts and the page opens Data.
8. Call `export_project` with a dialect and sample-data preference; confirm it returns deterministic SQL/JSON file objects and opens Export without uploading anything.
9. Refresh or repeat `get_project_state` as documented and confirm the application remains coherent.

No judge credentials should be required for the core flow. AI generation requires operator-provided server-side credentials for the selected provider and should be presented as optional.

## Public Demo Link

**TODO — add the final public Netlify URL after a successful production deploy.**

## Public Repository Link

**TODO — confirm the repository is public, contains the final challenge commit, exposes the Apache-2.0 license, and add its public URL.**

## Demo Video

**TODO — add the public YouTube URL. The recording must include audio and remain under three minutes.**

### Demo script (target: 2 minutes 40 seconds)

- **0:00–0:18 — Problem.** “A person can see a database model, but an assistant normally sees only pasted text or a fragile webpage. Semantic Loop gives both of them one shared, structured workspace.”
- **0:18–0:35 — Product.** Show the visual editor and briefly point out schema, refine, data, and export stages.
- **0:35–0:52 — Discovery.** Open the WebMCP client, list the page tools, and explain that they are registered by the application rather than inferred from the DOM.
- **0:52–1:08 — Inspect.** Call `get_project_state`. Compare the structured result with the visible empty or current project.
- **1:08–1:38 — Create.** Call `create_schema` with customers and orders. Show the interface updating immediately, including the relationship.
- **1:38–1:58 — Collaborate.** Make one small human edit, then call `apply_schema_changes` for a second change. Call `get_project_state` again to show that both changes share one state.
- **1:58–2:18 — Data.** Call `set_sample_data` with two concise rows and show the data reflected in the project.
- **2:18–2:32 — Export.** Call `export_project` and point out that the output contains the agent-and-human-authored result.
- **2:32–2:40 — Close.** “WebMCP turns a visual schema prototype into a reliable human-agent collaboration surface—structured, inspectable, and still under human review.”

## Screenshot Shot List

1. Hero or initial workspace showing the complete product shell.
2. WebMCP client showing the five discovered tool names.
3. `create_schema` result beside the rendered multi-table schema.
4. The updated schema and sample data after agent and human changes.
5. Final export response or artifact with the completed project visible.

Capture at a consistent desktop viewport, avoid exposing keys or personal data, and keep the WebMCP call/result legible.

## Submission Readiness Notes

- [x] Verify all five tools in a real WebMCP-enabled client. Verified locally in the Codex in-app browser WebMCP preview (client version not exposed): all five tools were discovered; `create_schema`, `get_project_state`, `set_sample_data`, and `export_project` were invoked successfully, with state changes visible in the UI.
- [x] Run `npm run validate` and `npm run build`. Final local result: 57 tests passed across nine files, type checking passed, lint completed with no errors, and the production Vite build succeeded.
- [ ] Deploy to Netlify, test the production URL, and add it above.
- [ ] Confirm the public repository contains all source, instructions, and the detectable Apache-2.0 license.
- [ ] Add the final challenge commit and comparison URL to `docs/hackathon/provenance.md`.
- [ ] Capture three to five screenshots using the shot list.
- [ ] Record the demo with audio, keep it under three minutes, publish it to YouTube, and add the URL.
- [ ] Replace every remaining `TODO` and re-read all claims against the deployed build.
- [ ] Freeze the submitted build, public repository, and video for the judging period.

## Known Limitations

- WebMCP support currently depends on ChatGPT's in-app browser or a compatible Chrome configuration.
- The project is a browser-local collaboration surface, not a multi-user server or hosted database.
- Optional AI generation depends on the selected external provider and operator-managed server-side credentials; the core WebMCP demonstration does not.
- WebMCP operations act on the project open in the current page and do not coordinate changes across multiple tabs or devices.
- Final production behavior and tool responses must be re-verified after deployment.

## Existing-project Disclosure

The base Semantic Loop DevOps Demonstrator existed before the submission period. Its React interface, Gemini-powered generation, visual schema refinement, sample-data workflow, visualization, and artifact export predate August 25, 2026. The provider-neutral OpenAI and Anthropic gateway is challenge-period work.

The hackathon contribution is the WebMCP interoperability layer and judge-ready extension: typed tool registration, shared human-agent state operations, visible/recoverable tool feedback, a no-secret evaluation path, focused tests, deployment configuration, and submission documentation. The detailed baseline and comparison instructions are in `docs/hackathon/provenance.md`.

Suggested answer for the “If Existing” field:

> Semantic Loop was an existing React schema-design demonstrator before the submission period. During the challenge we meaningfully extended it with browser-native WebMCP tools that let an agent inspect, create, update, seed, and export the same live project state a person reviews in the visual UI. We also added structured tool validation and feedback, a no-secret judge path, WebMCP-focused tests, Netlify configuration, and reproducible judge and provenance documentation. The public repository identifies `d4be2bb` (August 7, 2026) as the pre-challenge baseline and links to the final challenge comparison.

## TODO Official Form Fields

Official fields fetched from Devpost for The WebMCP Challenge:

- **Submitter Type (required):** TODO — choose Individual, Team of Individuals, or Organization.
- **Country of residence (required):** TODO — participant must supply the truthful country or countries.
- **Organization name (conditional):** TODO — complete only if submitting on behalf of an organization.
- **App Status (required):** `Existing`.
- **Existing-project update (conditional):** Drafted in “Existing-project Disclosure”; verify against the final build.
- **Live URL (required):** TODO — add the tested Netlify production URL.
- **Private judge testing instructions (optional):** Use “Testing Instructions”; update after production verification. Do not add credentials unless the deployment actually requires them.
- **Public code repository URL (required):** TODO — add the verified public repository URL.
- **Agents/clients tested (required):** TODO — list only clients used in successful final tests.
- **AI tools leveraged (required):** Draft: OpenAI Codex for codebase analysis, implementation support, testing, and submission preparation; optional in-product generation supports Google Gemini, OpenAI, and Anthropic through a common server-side gateway. Verify which configured providers were actually demonstrated.
- **Learning derived (required):** TODO — choose None, Moderate, or Significant.
- **Career AI value (required):** TODO — choose Yes or No.
- **Project video (required):** TODO — add the public YouTube URL.

The live requirements did not ask for a Codex session ID when this draft was prepared.
