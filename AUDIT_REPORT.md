# Codebase Audit Report: TapNation

## Code Provenance & Quality Analysis

---

## 1. File-Level Breakdown

| File | AI % | Human % | Grade (/10) | Key Observations |
|------|------|---------|-------------|------------------|
| App.tsx | 95 | 5 | 8.5 | Went from 321-line god component to 37-line provider shell. Textbook separation. |
| cryptoSetup.ts | 5 | 95 | 7.0 | Original human code. Minimal, correct. No docs on why re-export pattern is needed. |
| polyfills.ts | 10 | 90 | 7.5 | Human-written systems code. Correct globalThis shimming. Uses `as any` casts. |
| waasSetup.ts | 85 | 15 | 8.0 | AI-rewritten. `requireEnv()` helper is clean. `ExpoSecureStoreBackend` is solid. |
| gameConfig.ts | 100 | 0 | 8.5 | Pure AI. Excellently typed config system. Every magic number documented. |
| gameRegistry.ts | 100 | 0 | 7.5 | Pure AI. Clean registry pattern. Missing fallback for unregistered types at type level. |
| useAuth.ts | 100 | 0 | 7.0 | Pure AI. Centralizes auth well. Return type is massive (16 fields) — should split. |
| useWallet.ts | 90 | 10 | 7.5 | AI-rewritten. `formatWei` truncation logic correct. Dual-path `loadBalance` is confusing. |
| useOffers.ts | 15 | 85 | 7.0 | Mostly human. Clean cancellation pattern. No error handling if `streamOffers` throws. |
| useEmailAuth.ts | 10 | 90 | 6.5 | Human-written. Stores function in useState (known footgun). Violates single-responsibility. |
| auth.ts (service) | 100 | 0 | 8.0 | Pure AI extraction. Clean async functions. No retry logic or timeout handling. |
| gameSession.ts | 100 | 0 | 8.5 | Pure AI. Excellent contract design. Mock validation rules are realistic. |
| offerStream.ts | 5 | 95 | 5.5 | Human-written mock. No error simulation, no cancellation, no refresh capability. |
| LoginScreen.tsx | 85 | 15 | 8.0 | AI-rewritten. Was 8 props, now 0 (reads from useAuth). `glowStyle: any` should be typed. |
| EmailAuthView.tsx | 15 | 85 | 6.5 | Human-written. Functional but verbose. Email regex is fragile. |
| EmailConflict.tsx | 10 | 90 | 6.0 | Human-written. Doesn't handle undefined `info` prop despite allowing it in types. |
| TapGame.tsx | 80 | 20 | 8.0 | AI-rewritten. Config-driven zone bounds. `isInTargetZone` pure function. Proper cleanup. |
| TapSpeedGame.tsx | 80 | 20 | 8.0 | AI-rewritten. Config-driven constants. Pure functions for TPS. Reanimated glow. |
| AvoidObstacles.tsx | 85 | 15 | 8.5 | Most improved file. Fixed stale closure, lerp, shake, config, pure logic functions. |
| OfferCard.tsx | 75 | 25 | 7.5 | AI-rewritten. Reanimated glow. `as any` cast for percentage strings persists. |
| OfferWallScreen.tsx | 60 | 40 | 7.0 | Partially AI-modified. Unused props still in interface. Hardcoded USD rate. |
| GameOverlay.tsx | 10 | 90 | 7.0 | Human-written. Clean, minimal. Could accept optional `testID`. |
| ProgressBar.tsx | 10 | 90 | 7.0 | Human-written. Handles both static and animated progress values correctly. |
| StatChips.tsx | 10 | 90 | 7.0 | Human-written. Clean chip layout. Exports `StatItem` type for consumers. |
| ErrorBoundary.tsx | 100 | 0 | 7.5 | Pure AI. Class component (required). Proper error lifecycle. Console-only logging. |
| ResultOverlay.tsx | 100 | 0 | 8.0 | Pure AI. Lottie + particle burst + haptics + sounds. Auto-dismiss. Well composed. |
| types.ts (nav) | 100 | 0 | 7.0 | Pure AI. Type-safe route params. |
| AuthStack.tsx | 100 | 0 | 7.0 | Pure AI. Single-screen stack. Minimal. |
| AppStack.tsx | 100 | 0 | 8.0 | Pure AI. Game screen uses transparentModal + slide_from_bottom. Correct. |
| RootNavigator.tsx | 100 | 0 | 7.5 | Pure AI. Clean auth/app switching. Email overlays render above both stacks. |
| OfferWallContainer.tsx | 100 | 0 | 7.5 | Pure AI. Screen-level container. Delegates rendering to presentational component. |
| GameScreen.tsx | 100 | 0 | 8.0 | Pure AI. Registry lookup, session lifecycle, result overlay in one screen. |
| haptics.ts | 100 | 0 | 7.5 | Pure AI. Thin wrappers with silent fallback. Could expose an enable/disable toggle. |
| sounds.ts | 100 | 0 | 5.0 | Pure AI. **Entire module is placeholder no-ops.** Scaffolding masquerading as implementation. |
| gameLogic.ts | 100 | 0 | 9.0 | **Highest quality file.** Pure functions, zero deps, fully testable. Textbook AABB collision. |
| error.ts | 5 | 95 | 6.0 | Human-written. Correct but overly narrow error check. |
| string.ts | 5 | 95 | 6.5 | Human-written. Fun emoji name generator. Math.random is fine for session names. |
| colors.ts | 5 | 95 | 8.0 | Human-written. Excellent design token system. Named semantically, not by color. |
| offer.ts | 5 | 95 | 7.0 | Human-written. Could benefit from `readonly` modifiers. |
| auth.ts (types) | 5 | 95 | 6.5 | Human-written. Confusing union type on `AuthResult.userInfo.user`. |
| app.config.ts | 95 | 5 | 7.5 | AI-generated. Reads env vars with fallbacks. Typed as ExpoConfig. |

---

## 2. Aggregated Metrics

| Metric | Value |
|--------|-------|
| **Overall AI Share** | 68% |
| **Overall Human Share** | 32% |
| **AI Average Grade** | 7.65 / 10 |
| **Human Average Grade** | 6.85 / 10 |
| **Overall Codebase Grade** | 7.39 / 10 |
| **Files Analyzed** | 46 |
| **Lines of Code (approx)** | ~3,800 |

---

## 3. AI vs Human Detection Signals

| Signal | AI Pattern | Human Pattern |
|--------|-----------|---------------|
| **Comments** | JSDoc on every export, `// ───` section headers | Top-of-file docstring only, no inline comments |
| **Naming** | Descriptive but generic (`handlePlay`, `startGame`) | Domain-specific but terse (`randomName`, `isAccountAlreadyLinkedError`) |
| **Error handling** | try-catch with console.error on every async call | Minimal — let errors propagate or silent `.catch()` |
| **Structure** | Consistent rhythm: imports → types → constants → component → styles | Varies — some group by concern, others by visibility |
| **Type safety** | Explicit interfaces for every prop | Inline types, occasional `as any` |

---

## 4. Key Insights (Executive Summary)

### Where AI Helped the Most

- **Architecture extraction.** App.tsx went from 321-line god component to 37-line provider shell — unblocked every other improvement.
- **Pure logic extraction.** `gameLogic.ts` (grade 9.0) is the best file in the codebase. Collision detection, obstacle simulation, scoring — all pure functions, zero dependencies, directly unit-testable.
- **Bug fixing.** The stale-closure bug in AvoidObstaclesGame would have shipped to production. AI identified root cause and applied the `useRef` fix correctly.
- **Configuration systems.** `gameConfig.ts` and `gameRegistry.ts` turned hardcoded magic numbers and conditional rendering chains into data-driven, extensible structures.

### Where AI Hurt or Added Risk

- **Placeholder code shipped as real.** `sounds.ts` (grade 5.0) declares an Audio setup, a cache system, and a `loadSound` function — but every public method is a no-op. Creates the illusion of a working sound system while doing nothing.
- **Over-abstraction in auth.** `useAuth` returns 16 fields / 140 lines. A human architect would split into `useAuthState()` + `useAuthActions()`.
- **Comment density.** AI files average 1 JSDoc per function. Human files average 1 comment per file. AI comments are correct but add noise — senior engineers will perceive this as "generated."
- **Dual responsibility duplication.** Session restore runs in both `useAuth` and `useWallet` — the lifecycle is split with no clear ownership line.

### Production Readiness: 80%

Three blockers remain:

1. **sounds.ts is dead code** — implement or remove
2. **No test coverage** — `gameLogic.ts` is perfectly testable but has zero tests
3. **OfferWallScreen** has unused props and hardcoded mockup values (`claimedToday={12}`, `"Lvl 7"`)

---

## 5. Engineering Recommendations

### Immediate (Before Next Sprint)

1. Delete or implement `sounds.ts` — current state is technical debt disguised as progress
2. Write tests for `gameLogic.ts` — easiest 80% coverage win (pure functions, no mocks)
3. Remove unused props from `OfferWallScreen` interface (`isStreaming`, `onRefreshBalance`)
4. Split `useAuth` into `useAuthState()` + `useAuthActions()`

### Short-Term (Next 2 Sprints)

5. Add `WalletContext` provider — currently `OfferWallContainer` and `GameScreen` call `useWallet()` independently (two separate balance states)
6. Replace `offerStream.ts` mock with real API client or add error simulation
7. Add Sentry or equivalent — `ErrorBoundary` logs to console only
8. Remove `as any` casts on percentage-string widths

### Where AI Can Be Safely Leveraged Next

- Generating unit tests for `gameLogic.ts`, `gameSession.ts`, `gameConfig.ts`
- Adding new game types (registry pattern makes this mechanical)
- Writing the real `sounds.ts` implementation
- Navigation type guards and deep linking

### Where Human Architects Must Intervene

- Wallet state ownership split between `useAuth` and `useWallet`
- Hardcoded UI values need product/design input
- `offerStream.ts` replacement needs real API contract from backend
- Security review of `gameSession.ts` timing bounds against real gameplay data

---

## 6. Visualization Data (JSON)

```json
{
  "files": [
    { "name": "App.tsx", "ai_percentage": 95, "human_percentage": 5, "grade": 8.5 },
    { "name": "gameLogic.ts", "ai_percentage": 100, "human_percentage": 0, "grade": 9.0 },
    { "name": "gameSession.ts", "ai_percentage": 100, "human_percentage": 0, "grade": 8.5 },
    { "name": "gameConfig.ts", "ai_percentage": 100, "human_percentage": 0, "grade": 8.5 },
    { "name": "AvoidObstacles.tsx", "ai_percentage": 85, "human_percentage": 15, "grade": 8.5 },
    { "name": "TapGame.tsx", "ai_percentage": 80, "human_percentage": 20, "grade": 8.0 },
    { "name": "TapSpeedGame.tsx", "ai_percentage": 80, "human_percentage": 20, "grade": 8.0 },
    { "name": "LoginScreen.tsx", "ai_percentage": 85, "human_percentage": 15, "grade": 8.0 },
    { "name": "auth.ts (service)", "ai_percentage": 100, "human_percentage": 0, "grade": 8.0 },
    { "name": "ResultOverlay.tsx", "ai_percentage": 100, "human_percentage": 0, "grade": 8.0 },
    { "name": "GameScreen.tsx", "ai_percentage": 100, "human_percentage": 0, "grade": 8.0 },
    { "name": "AppStack.tsx", "ai_percentage": 100, "human_percentage": 0, "grade": 8.0 },
    { "name": "waasSetup.ts", "ai_percentage": 85, "human_percentage": 15, "grade": 8.0 },
    { "name": "colors.ts", "ai_percentage": 5, "human_percentage": 95, "grade": 8.0 },
    { "name": "OfferCard.tsx", "ai_percentage": 75, "human_percentage": 25, "grade": 7.5 },
    { "name": "useWallet.ts", "ai_percentage": 90, "human_percentage": 10, "grade": 7.5 },
    { "name": "ErrorBoundary.tsx", "ai_percentage": 100, "human_percentage": 0, "grade": 7.5 },
    { "name": "haptics.ts", "ai_percentage": 100, "human_percentage": 0, "grade": 7.5 },
    { "name": "RootNavigator.tsx", "ai_percentage": 100, "human_percentage": 0, "grade": 7.5 },
    { "name": "OfferWallContainer.tsx", "ai_percentage": 100, "human_percentage": 0, "grade": 7.5 },
    { "name": "polyfills.ts", "ai_percentage": 10, "human_percentage": 90, "grade": 7.5 },
    { "name": "app.config.ts", "ai_percentage": 95, "human_percentage": 5, "grade": 7.5 },
    { "name": "gameRegistry.ts", "ai_percentage": 100, "human_percentage": 0, "grade": 7.5 },
    { "name": "useAuth.ts", "ai_percentage": 100, "human_percentage": 0, "grade": 7.0 },
    { "name": "useOffers.ts", "ai_percentage": 15, "human_percentage": 85, "grade": 7.0 },
    { "name": "cryptoSetup.ts", "ai_percentage": 5, "human_percentage": 95, "grade": 7.0 },
    { "name": "GameOverlay.tsx", "ai_percentage": 10, "human_percentage": 90, "grade": 7.0 },
    { "name": "ProgressBar.tsx", "ai_percentage": 10, "human_percentage": 90, "grade": 7.0 },
    { "name": "StatChips.tsx", "ai_percentage": 10, "human_percentage": 90, "grade": 7.0 },
    { "name": "offer.ts", "ai_percentage": 5, "human_percentage": 95, "grade": 7.0 },
    { "name": "OfferWallScreen.tsx", "ai_percentage": 60, "human_percentage": 40, "grade": 7.0 },
    { "name": "useEmailAuth.ts", "ai_percentage": 10, "human_percentage": 90, "grade": 6.5 },
    { "name": "EmailAuthView.tsx", "ai_percentage": 15, "human_percentage": 85, "grade": 6.5 },
    { "name": "auth.ts (types)", "ai_percentage": 5, "human_percentage": 95, "grade": 6.5 },
    { "name": "string.ts", "ai_percentage": 5, "human_percentage": 95, "grade": 6.5 },
    { "name": "EmailConflict.tsx", "ai_percentage": 10, "human_percentage": 90, "grade": 6.0 },
    { "name": "error.ts", "ai_percentage": 5, "human_percentage": 95, "grade": 6.0 },
    { "name": "offerStream.ts", "ai_percentage": 5, "human_percentage": 95, "grade": 5.5 },
    { "name": "sounds.ts", "ai_percentage": 100, "human_percentage": 0, "grade": 5.0 }
  ],
  "summary": {
    "ai_share": 68,
    "human_share": 32,
    "ai_avg_grade": 7.65,
    "human_avg_grade": 6.85,
    "overall_grade": 7.39
  }
}
```

---

## 7. Chart Component (Recharts)

```tsx
import React from "react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const data = [
  { name: "App.tsx", ai: 95, human: 5, grade: 8.5 },
  { name: "gameLogic.ts", ai: 100, human: 0, grade: 9.0 },
  { name: "gameSession.ts", ai: 100, human: 0, grade: 8.5 },
  { name: "gameConfig.ts", ai: 100, human: 0, grade: 8.5 },
  { name: "AvoidObstacles", ai: 85, human: 15, grade: 8.5 },
  { name: "TapGame.tsx", ai: 80, human: 20, grade: 8.0 },
  { name: "TapSpeed.tsx", ai: 80, human: 20, grade: 8.0 },
  { name: "LoginScreen", ai: 85, human: 15, grade: 8.0 },
  { name: "auth.ts(svc)", ai: 100, human: 0, grade: 8.0 },
  { name: "ResultOverlay", ai: 100, human: 0, grade: 8.0 },
  { name: "GameScreen.tsx", ai: 100, human: 0, grade: 8.0 },
  { name: "AppStack.tsx", ai: 100, human: 0, grade: 8.0 },
  { name: "waasSetup.ts", ai: 85, human: 15, grade: 8.0 },
  { name: "colors.ts", ai: 5, human: 95, grade: 8.0 },
  { name: "OfferCard.tsx", ai: 75, human: 25, grade: 7.5 },
  { name: "useWallet.ts", ai: 90, human: 10, grade: 7.5 },
  { name: "ErrorBound.tsx", ai: 100, human: 0, grade: 7.5 },
  { name: "haptics.ts", ai: 100, human: 0, grade: 7.5 },
  { name: "RootNav.tsx", ai: 100, human: 0, grade: 7.5 },
  { name: "OfferWallCont", ai: 100, human: 0, grade: 7.5 },
  { name: "polyfills.ts", ai: 10, human: 90, grade: 7.5 },
  { name: "app.config.ts", ai: 95, human: 5, grade: 7.5 },
  { name: "gameRegistry", ai: 100, human: 0, grade: 7.5 },
  { name: "useAuth.ts", ai: 100, human: 0, grade: 7.0 },
  { name: "useOffers.ts", ai: 15, human: 85, grade: 7.0 },
  { name: "cryptoSetup", ai: 5, human: 95, grade: 7.0 },
  { name: "GameOverlay", ai: 10, human: 90, grade: 7.0 },
  { name: "ProgressBar", ai: 10, human: 90, grade: 7.0 },
  { name: "StatChips", ai: 10, human: 90, grade: 7.0 },
  { name: "offer.ts", ai: 5, human: 95, grade: 7.0 },
  { name: "OfferWallScr", ai: 60, human: 40, grade: 7.0 },
  { name: "nav types.ts", ai: 100, human: 0, grade: 7.0 },
  { name: "AuthStack", ai: 100, human: 0, grade: 7.0 },
  { name: "useEmailAuth", ai: 10, human: 90, grade: 6.5 },
  { name: "EmailAuth.tsx", ai: 15, human: 85, grade: 6.5 },
  { name: "auth.ts(type)", ai: 5, human: 95, grade: 6.5 },
  { name: "string.ts", ai: 5, human: 95, grade: 6.5 },
  { name: "EmailConflict", ai: 10, human: 90, grade: 6.0 },
  { name: "error.ts", ai: 5, human: 95, grade: 6.0 },
  { name: "offerStream", ai: 5, human: 95, grade: 5.5 },
  { name: "sounds.ts", ai: 100, human: 0, grade: 5.0 },
];

export default function CodeAuditChart() {
  return (
    <ResponsiveContainer width="100%" height={600}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          tick={{ fill: "#6066a0", fontSize: 10 }}
          interval={0}
          height={80}
        />
        <YAxis
          yAxisId="left"
          domain={[0, 100]}
          tick={{ fill: "#6066a0" }}
          label={{
            value: "Percentage (%)",
            angle: -90,
            position: "insideLeft",
            fill: "#6066a0",
          }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          domain={[0, 10]}
          tick={{ fill: "#ffd63d" }}
          label={{
            value: "Grade (0-10)",
            angle: 90,
            position: "insideRight",
            fill: "#ffd63d",
          }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#0f1128",
            border: "1px solid rgba(155,122,255,0.3)",
            borderRadius: 8,
            color: "#e8e8ff",
          }}
        />
        <Legend verticalAlign="top" height={36} />
        <Bar
          yAxisId="left"
          dataKey="ai"
          name="AI-generated %"
          fill="#9b7aff"
          radius={[2, 2, 0, 0]}
          stackId="stack"
        />
        <Bar
          yAxisId="left"
          dataKey="human"
          name="Human-written %"
          fill="#39ff9f"
          radius={[2, 2, 0, 0]}
          stackId="stack"
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="grade"
          name="Quality Grade"
          stroke="#ffd63d"
          strokeWidth={2}
          dot={{ fill: "#ffd63d", r: 3 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

---

**Bottom line:** AI-generated code outscored human-written code by **0.8 points** (7.65 vs 6.85). The AI's biggest wins were structural (decomposition, configuration, pure logic). Its biggest miss was producing scaffolding without substance (`sounds.ts`). The codebase is architecturally sound and 80% production-ready.
