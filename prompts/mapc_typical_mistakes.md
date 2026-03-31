# MAPC Typical Mistakes — Lessons from Real PR Reviews

> These patterns are extracted from closed PR review threads by team leads @dmytro-medvediuk-epam and @pavel-kavalchuk-epam.
> **Every item below has been raised as a blocking review comment at least once. Check all of them before submitting.**

---

## 1. `accessibilityRole` — ALWAYS use the enum, never raw strings

**❌ Wrong (flagged in PRs #925, #928, #929, #930):**
```tsx
accessibilityRole="button"
accessibilityRole="radiogroup"
```

**✅ Correct:**
```tsx
import { AccessibilityRoles } from 'src/utils/helpers/accessibilityRoles';
accessibilityRole={AccessibilityRoles.Button}
```

**Rule:** `src/utils/helpers/accessibilityRoles.ts` contains the canonical enum for all React Native accessibility roles. Use it **everywhere** `accessibilityRole` appears — not just in the files you modified, but in **all files across the project** where string literals are still used. If the enum doesn't yet cover a role you need, add it there.

---

## 2. Scope discipline — only change what the Acceptance Criteria requires

**❌ Wrong (flagged in PRs #925, #927, #928):**
- Adding `textContentType` / `autoComplete` / `keyboardType` changes inside an accessibility story (not required by ACs)
- Changing `keyboardType="decimal-pad"` without explicit requirement from the ticket
- Setting `importanceForAccessibility="no"` on a generic `Input` component used across the whole app (this makes ALL inputs inaccessible, not just the targeted one)

**Rule:** Before every line change ask: _"Is this required by the acceptance criteria?"_ If not, revert it. Accessibility-related improvements to **unrelated** components are out of scope and will be rejected.

---

## 3. Reuse existing components, utilities and styles — never duplicate

**❌ Wrong (flagged in PRs #920, #922, #925, #930, #934):**
- Adding `flex: 1` inline or in a new styles object when `commonStyles.flex1` already exists
- Building a new view for "hidden from screen reader" behaviour when the codebase already has one
- Calling `require()` or building a URI inline for country flags — `getCountryFlagUrl()` already exists
- Wrapping `ModalDropdownPicker` / `FlatList` in an extra `View` with `accessibilityRole="radiogroup"` — `ModalDropdownPicker` already sets this internally; the extra wrapper is redundant
- Creating a repeated inline View pattern in a component used multiple times — extract it to a named component

**Rule:** Before adding any helper function, style, or wrapper, run:
```bash
grep -r "<concept>" src/ --include="*.ts" --include="*.tsx" -l
```
If it exists, import and reuse it. If a utility or component is no longer used after your changes, **delete it** (flagged in PR #930: `hideFromScreenReaderProps.ts` left unused).

---

## 4. Accessibility fixes must be applied project-wide, not just to changed files

**❌ Wrong (flagged in PRs #925, #928):**
Fixing `accessibilityRole` string literals only in the 3–4 files that were already modified for the feature, while leaving the same issue in 20 other files.

**Rule:** When fixing an accessibility pattern (enum for roles, accessible label, `accessibilityHint`), search the entire project:
```bash
grep -r 'accessibilityRole="' src/ --include="*.tsx" -l
```
Fix all occurrences in one PR, or open a follow-up ticket. State explicitly in the PR description which scope you chose and why.

---

## 5. Don't hide children of `Pressable` — it is accessible by default

**❌ Wrong (flagged in PR #922):**
```tsx
<Pressable accessible={true}>
  <View importanceForAccessibility="no-hide-descendants">
    <Text>label</Text>
  </View>
</Pressable>
```

**Rule:** `Pressable` (and `TouchableOpacity`) already makes its subtree accessible as a single focusable element. Explicitly hiding descendants is redundant and breaks VoiceOver/TalkBack traversal. Pass `accessibilityLabel` directly to the `Pressable`.

---

## 6. Never pass `undefined` to screen reader props

**❌ Wrong (flagged in PR #922):**
```tsx
accessibilityLabel={someValue ?? undefined}
accessibilityValue={{ text: condition ? value : undefined }}
```

**Rule:** Screen readers on both iOS and Android may announce `"undefined"` literally. Always provide a fallback empty string:
```tsx
accessibilityLabel={someValue ?? ''}
accessibilityValue={{ text: condition ? value : '' }}
```

---

## 7. Extract complex accessibility label logic from JSX into helper functions

**❌ Wrong (flagged in PRs #920, #922):**
Placing multi-line `accessibilityLabel` construction (date formatting, conditional joins, `$t` calls) inline in JSX — makes the component hard to read and test.

**Rule:** If an accessibility label requires more than a simple template literal, extract it to a pure helper function in a `*-helpers.ts` file co-located with the component. This keeps JSX clean and makes unit testing trivial.

---

## 8. Keep branch up-to-date with `develop` before submitting

**❌ Wrong (flagged in PR #925):**
Submitting a PR that is many commits behind `develop` — causes merge conflicts and reviewers seeing stale code.

**Rule:** Before raising a PR, always run:
```bash
git fetch origin && git merge origin/develop
```
Resolve any conflicts, run `yarn test`, then push.

---

## 9. No inline styles — all styles go in a `.styles.ts` file

**❌ Wrong (flagged in PR #934):**
```tsx
const useStyles = createStyles({ container: { flex: 1 } }); // inside ComponentName.tsx
```

**Rule:** Every component's styles must live in `ComponentName.styles.ts`. Import `useStyles` from that file. This is the established pattern across the entire codebase.
