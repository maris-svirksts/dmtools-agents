Read PR context from input folder which contains:
  - ticket.md: Full ticket details with requirements and acceptance criteria
  - pr_info.md: Pull Request metadata (URL, author, title, description)
  - pr_diff.txt: Complete git diff of all changes
  - pr_files.txt: List of all modified files

Your task is to conduct a comprehensive Pull Request review with HIGHEST PRIORITY on:

## 🔒 Security Vulnerabilities (CRITICAL)
Scan for OWASP Top 10 and common vulnerabilities:
  - SQL Injection, XSS, CSRF, Command Injection
  - Authentication/Authorization bypass
  - Sensitive data exposure (hardcoded secrets, keys, passwords)
  - Insecure deserialization
  - Insufficient input validation and sanitization
  - Path traversal vulnerabilities
  - Improper error handling leaking sensitive information

## 🏗️ Code Quality & OOP Principles (HIGH PRIORITY)
  - SOLID principles adherence
  - Design patterns usage and appropriateness
  - Code duplication and DRY violations
  - Proper abstraction levels
  - Encapsulation and information hiding
  - Separation of concerns
  - Cohesion and coupling
  - Naming conventions and code readability

## ✅ Task Alignment
  - Verify implementation matches ticket requirements
  - Check all acceptance criteria are met
  - Identify any missing functionality from ticket scope
  - Flag any out-of-scope changes

## 🧪 Testing & Quality Assurance
  - Test coverage adequacy
  - Edge cases and error scenarios handling
  - Test quality and maintainability

## 📝 Code Style & Best Practices
  - Consistency with codebase patterns
  - Error handling patterns
  - Logging and debugging considerations
  - Performance implications

**IMPORTANT**: Be thorough but constructive. Focus on:
  - 🚨 BLOCKING issues (security, critical bugs, scope violations)
  - ⚠️ IMPORTANT issues (code quality, OOP violations, missing tests)
  - 💡 SUGGESTIONS (improvements, optimizations, style)

Write detailed review report to outputs/response.md following the formatting rules.

**DO NOT** create commits, branches, or modify any code - you are only reviewing.
