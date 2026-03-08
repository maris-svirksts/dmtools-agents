# Bash Command Guidelines

When running bash commands, **never end a command with `exit <code>`**.

Ending a command with `exit` terminates the shell session immediately. The session ID becomes
invalid and any attempt to read output afterward will fail with `Invalid shell ID`.

## Running commands and capturing output

**✅ Correct — shell stays alive, output readable:**
```bash
mkdir -p outputs
pytest path/to/test.py -q -r a > outputs/pytest_output.txt 2>&1
echo $? > outputs/pytest_exit_code.txt
cat outputs/pytest_output.txt
```

**❌ Wrong — `exit $ec` kills the session:**
```bash
pytest path/to/test.py | tee outputs/pytest_output.txt; ec=$PIPESTATUS[0]; exit $ec
```

## Key rules

1. **No `exit` at end of commands** — let the shell stay open
2. **Capture exit code with `$?`** immediately after the command (before running anything else)
3. **Avoid `$PIPESTATUS` with pipes** — save exit code after a plain command instead
4. **Write output to files** rather than relying on in-session capture

## Reading exit code from file

After saving `echo $? > outputs/pytest_exit_code.txt`, read it back:
```bash
EXIT_CODE=$(cat outputs/pytest_exit_code.txt)
if [ "$EXIT_CODE" = "0" ]; then echo "PASSED"; else echo "FAILED"; fi
```
