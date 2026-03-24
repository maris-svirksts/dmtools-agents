You are fixing code issues identified in a Pull Request review.

**IMPORTANT**: Before starting, list the `input/` directory to find the ticket subfolder (e.g. `input/PROJ-123/`), then read ALL files from that subfolder in this order:
1. `request.md` — original ticket requirements and acceptance criteria
2. `comments.md` *(if present)* — ticket comment history with additional context or prior decisions
3. `existing_questions.json` *(if present)* — clarification questions with PO answers; treat answered questions as binding requirements
3. `pr_info.md` — Pull Request metadata (PR number, URL, branch)
4. `pr_diff.txt` — Current code changes already in the PR (what was implemented)
5. `merge_conflicts.md` *(if present)* — **Merge conflicts that MUST be resolved FIRST** before any rework
6. `ci_failures.md` *(if present)* — **CI check failures with error logs that MUST be fixed**
7. `pr_discussions.md` — **Review comments that MUST be fixed** (human-readable, your primary task list)
8. `pr_discussions_raw.json` — Same threads with numeric IDs — use `rootCommentId` and `id` when writing `outputs/review_replies.json`

**If `merge_conflicts.md` is present**: The branch was automatically merged with the base branch before you started. There are unresolved conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) in the listed files. **Resolve all conflicts first** — open each conflicting file, fix the markers keeping the correct code, then `git add <file>`. Only after all conflicts are staged should you proceed with review fixes.

**If `ci_failures.md` is present**: CI checks are currently failing on this PR. Read the error logs in that file carefully to identify the root cause, then fix the code. CI failures are **blocking** — they must be resolved along with the review comments. After pushing, CI will re-run automatically.

Your mission is to address every issue raised in `pr_discussions.md`. For each review thread or comment:
1. Understand the issue described by the reviewer
2. Locate the relevant code in the codebase
3. Apply the required fix
4. Note exactly what you changed

After fixing all issues, compile and run all tests to confirm they pass. If tests fail, fix them before finishing.

**⚠️ CRITICAL: All output files MUST be written to `outputs/` at the repository root** (e.g. `/home/runner/work/repo/repo/outputs/`).
Do NOT write them inside `input/`, `input/TICKET-KEY/`, or any subfolder of `input/`. The post-processing script reads from `outputs/` at the repo root — writing elsewhere means all results will be silently lost.

Run `mkdir -p outputs` first to ensure the directory exists.

Write two output files:

**`outputs/response.md`** — detailed fix summary posted as a **GitHub PR comment** (this IS a PR conversation, write as much technical detail as needed):
- For each review thread: what was changed, why, and any trade-offs
- Any issues you could NOT fix and a clear explanation of why
- Test status (pass/fail) and any test changes made

**`outputs/review_replies.json`** — concise per-thread reply (posted inline in each discussion thread — 1-3 sentences, just enough to confirm the fix):
```json
{
  "replies": [
    {
      "inReplyToId": <rootCommentId from pr_discussions_raw.json>,
      "threadId": "<id from pr_discussions_raw.json>",
      "reply": "Fixed: <1-3 sentence description of what was done>"
    }
  ]
}
```

DO NOT create branches, commit, or push — git operations are handled automatically.
