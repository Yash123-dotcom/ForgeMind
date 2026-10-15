# ForgeMind — AI-Powered Unity Development Intelligence

> **Tagline:** Understand your Unity project. Solve problems smarter.  
> **Parent Brand:** AssetForge  
> **Category:** AI SaaS for Unity Developers

ForgeMind is a dedicated diagnostic workspace designed for Unity game developers. Unlike generic chatbots, ForgeMind combines a **deterministic Unity rules engine**, stack trace frame extractors, safe evidence attachment inspection, and server-side AI reasoning to produce structured, traceable diagnostic reports with ordered fixes and verification steps.

---

## Architecture & System Overview

```
                      ┌──────────────────────────────────────────────┐
                      │              ForgeMind Client UI             │
                      │  - Landing Page (Workflow & Preview)         │
                      │  - Diagnostic Workbench (New Investigation)  │
                      │  - Diagnostic Report View & Verification     │
                      │  - Historical Investigation Dashboard        │
                      └──────────────────────┬───────────────────────┘
                                             │ POST /api/investigations
                                             ▼
                      ┌──────────────────────────────────────────────┐
                      │          Diagnostic Orchestration API        │
                      │   - Zod Input Sanitization (Files <= 2MB)    │
                      │   - Error Log & Stack Trace Normalization    │
                      └──────────────┬───────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌──────────────────────────────────────┐    ┌───────────────────────────────────┐
│     Deterministic Unity Rules        │    │        AI Provider Layer          │
│ - CS0246 Assembly/Namespace Resolver │    │ - Server-Side OpenAI-Compatible   │
│ - NullReferenceException Stack Trace │    │   Provider Abstraction            │
│ - URP / HDRP Shader Pass Incompatible│    │ - Validated Zod Structured Output │
│ - manifest.json Dependency Verifier  │    │ - Fallback Deterministic Mode     │
│ - Script / Class Name Discrepancies  │    │   (When AI_API_KEY is not set)    │
└──────────────────┬───────────────────┘    └─────────────────┬─────────────────┘
                   │                                          │
                   └─────────────────────┬────────────────────┘
                                         ▼
                      ┌──────────────────────────────────────────────┐
                      │           Persistence Abstraction            │
                      │  - Local Atomic JSON Store (Zero external    │
                      │    dependencies required out-of-the-box)     │
                      │  - Supabase PostgreSQL (Full RLS & schema    │
                      │    ready in supabase/schema.sql)             │
                      └──────────────────────────────────────────────┘
```

---

## Key Features

1. **Project-Aware Unity Debugging**:
   - Ingests Unity version (`Unity 6 (6000.0)`, `2023.3 LTS`, `2022.3 LTS`, etc.), render pipeline (`URP`, `HDRP`, `Built-in`), and target platform.
   - Accepts console logs, stack traces, and relevant C# code.
   - Safe in-memory attachment inspection for `.cs`, `.json` (`manifest.json`), `.shader`, `.hlsl`, `.txt`, `.log`, and `.asmdef`.

2. **Deterministic Rules Engine**:
   - `UNITY-RULE-CS0246`: Discovers missing using directives (`TMPro`, `UnityEngine.InputSystem`, `UnityEngine.Rendering.Universal`, etc.) and assembly references.
   - `UNITY-RULE-NULLREF`: Parses file paths, methods, and line numbers from stack traces to identify unassigned `[SerializeField]` fields or `GetComponent<T>()` failures.
   - `UNITY-RULE-PIPELINE-MISMATCH`: Detects Built-in shader passes (`UniversalForward`) or legacy includes (`UnityCG.cginc`) causing magenta shaders or compile errors.
   - `UNITY-RULE-MANIFEST-DEPS`: Audits `manifest.json` for missing package dependencies.
   - `UNITY-RULE-CS0103`: Flags scope and Unity version API incompatibilities (e.g. `FindObjectOfType` in Unity 6).
   - `UNITY-RULE-MONOBEHAVIOUR-NAME`: Detects script class and filename mismatches.

3. **Structured Diagnostic Reports**:
   - Executive summary and most likely root cause.
   - Calibrated qualitative confidence level (`high`, `medium`, `low`) with explanatory rationale.
   - Clear distinction between **Direct Facts**, **Deterministic Rule Findings**, and **AI Hypotheses**.
   - Evidence log lines and callstack frames.
   - Ordered, practical remediation steps.
   - Suggested code changes (with copyable snippets).
   - Interactive verification checklist to validate fixes in the Unity Editor.
   - Alternative causes and missing information disclosures.
   - User feedback controls ("This helped" / "Didn't help") persisted to history.

4. **Security & Sandboxing**:
   - Server-side secret management.
   - In-memory parsing only; uploaded scripts are never executed on the host.
   - No shell execution against user machines.
   - File upload constraints: 2MB limit per file, maximum 5 files, strict extension filtering.

---

## Installation & Setup

### Prerequisites
- Node.js `v18+` or `v20+` (tested on Node `v22.19.0`)
- npm `v10+`

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Configure your AI provider credentials in `.env.local`:
```env
# AI Provider Configuration (OpenAI or any OpenAI-compatible endpoint)
AI_API_KEY="your-api-key-here"
AI_BASE_URL="https://api.openai.com/v1"
AI_MODEL="gpt-4o-mini"
```

> **Note on Development Mode:** If `AI_API_KEY` is not set, ForgeMind will run smoothly in **Deterministic Development Mode**. It will evaluate all Unity engine rules, compile diagnostic evidence, and present a complete report without throwing an unhandled exception.

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## Database & Persistence Setup

ForgeMind supports two storage modes:

### Mode A: Local Persistent Store (Default)
ForgeMind includes a persistent atomic JSON database at `data/forgemind.json`. It requires **zero external configuration**, persists across server restarts, and supports creating, searching, updating feedback, and deleting investigations immediately.

### Mode B: Supabase PostgreSQL (Production)
To use Supabase:
1. Create a project in [Supabase](https://supabase.com).
2. Execute the migration script located in [`supabase/schema.sql`](file:///c:/Users/yniga/Desktop/ForgeMind/supabase/schema.sql) in the Supabase SQL Editor. It creates tables for `investigations`, `diagnostic_reports`, and `investigation_feedback`, with Row Level Security (RLS) enabled.
3. Add the following to your `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

---

## Running the Automated Test Suite

ForgeMind includes unit and integration tests covering:
- Deterministic Unity rules evaluations
- Call stack parsing and regex matchers
- Zod request and AI response schema validation
- Persistence layer operations and feedback tracking

Run tests with:
```bash
npm test
```

Test Results:
```
✔ Unity Deterministic Rules Engine (7 tests passed)
✔ Validation Schemas & Models (4 tests passed)
✔ End-to-End Investigation Workflow & Persistence (1 test passed)
Total: 12 tests passing, 0 failing.
```

---

## Important Limitations (MVP Scope)
- **Local Project Access**: ForgeMind does not automatically scan local user hard drives or modify Unity assets on disk. All context must be supplied by the user (pasting errors or uploading files).
- **Binary Asset Formats**: Compiled `.dll` binaries, complex `.prefab` binaries, and serialized binary scene files are not unpacked in this release.
- **Confidence Calibration**: Qualitative confidence ratings (`high`, `medium`, `low`) are grounded in direct rule matches and evidence completeness; percentage estimations are intentionally omitted to avoid false precision.

---

## Next Steps Roadmap
1. **Unity Editor Package**: A lightweight Unity Editor Window (via UPM) that sends console errors and surrounding stack traces directly to ForgeMind via REST API with one click.
2. **Assembly Definition Indexer**: Deeper scanning of multi-package `.asmdef` dependency graphs to resolve complex modular assembly linkage issues.
3. **Shader Graph Visual Node Inspection**: Specialized diagnostics for Unity Shader Graph JSON asset files.

