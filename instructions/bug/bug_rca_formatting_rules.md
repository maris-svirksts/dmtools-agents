Write `outputs/response.md` in **Jira wiki markup** format.

Use Jira wiki syntax strictly — do NOT use Markdown:
- Headings: `h2.` `h3.` (not `##`)
- Bold: `*text*` (not `**text**`)
- Tables: `||header||` / `|cell|`
- Bullets: `* item`
- Code/diagrams: `{code:mermaid}...{code}`

## Required structure for `outputs/response.md`

```
h2. Root Cause Analysis

h3. Symptom
One paragraph describing what the user experiences and under what conditions.

h3. Root Cause
Exact code-level finding: file path, function/component name, what is wrong and why.

h3. Affected Code Path
Step-by-step trace from user action to failure point.

||Step||File||Component / Function / Logic||
|1|src/...|...|
|2|src/...|...|

h3. Impact
* *Platform / Environment*: [e.g. iOS only / all browsers / Node.js backend]
* *Severity*: Critical / High / Medium / Low
* *Scope*: which users, roles, or flows are affected

h3. Recommended Fix Approach
High-level description of what needs to change — no source code.
* What should change and why
* Any environment- or platform-specific considerations
* Any related components or services that need the same fix

h3. Open Questions
Any unknowns that need clarification before a developer can implement the fix.
Leave this section empty (or omit) if there are none.
```
