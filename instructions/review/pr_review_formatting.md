# PR Review Report Format

Structure your review as follows in outputs/response.md:

```markdown
# Pull Request Review

## 📊 Summary
[Brief overview: PR scope, overall quality assessment, and recommendation (APPROVE/REQUEST CHANGES/BLOCK)]

---

## 🔒 Security Analysis
[List all security findings, or "✅ No security issues found"]

### 🚨 BLOCKING Security Issues
- **[Issue Title]**
  - **Location**: `file.js:123`
  - **Risk**: [High/Critical]
  - **Description**: [What's wrong]
  - **Recommendation**: [How to fix]

### ⚠️ Security Warnings
- [Same structure as blocking]

---

## 🏗️ Code Quality & OOP Review

### 🚨 BLOCKING Issues
- **[Issue Title]**
  - **Location**: `file.js:123`
  - **Principle Violated**: [e.g., Single Responsibility Principle]
  - **Description**: [What's wrong]
  - **Recommendation**: [How to fix]

### ⚠️ Important Issues
- [Same structure]

### 💡 Suggestions
- [Same structure but less critical]

---

## ✅ Task Alignment

### Requirements Coverage
- ✅ [Requirement from ticket] - Implemented
- ⚠️ [Requirement from ticket] - Partially implemented (explain)
- ❌ [Requirement from ticket] - Missing (explain)

### Out of Scope Changes
- [List any changes not mentioned in ticket requirements]

---

## 🧪 Testing Review

### Test Coverage
- ✅ [What's tested well]
- ⚠️ [What needs more tests]
- ❌ [What's missing tests]

### Test Quality Issues
- [List any test quality concerns]

---

## 📝 Additional Notes

### Performance Concerns
- [If any]

### Maintenance & Readability
- [Comments on code maintainability]

### Dependencies
- [Any new dependencies added, are they necessary?]

---

## 🎯 Final Recommendation

**[APPROVE / REQUEST CHANGES / BLOCK]**

**Blocking Issues Count**: [number]
**Important Issues Count**: [number]
**Suggestions Count**: [number]

**Next Steps**:
1. [Action items for developer]
2. [Action items for developer]

---

## 📋 Detailed Findings

[Optional: Additional detailed analysis for complex issues]
```

**IMPORTANT**:
- Use Jira markup syntax (not GitHub markdown)
- Jira code blocks: `{code:language}...{code}`
- Jira headings: `h1. Title`, `h2. Title`, etc.
- Jira lists: `* item` or `# numbered`
- Jira panels: `{panel:title=Title}...{panel}`
