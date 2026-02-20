PROJECT NAME

Autonomous CI/CD Healing Agent

⸻

1. Executive Summary

The Autonomous CI/CD Healing Agent is a multi-agent DevOps automation system that:
• Accepts a GitHub repository URL
• Clones and analyzes the codebase
• Automatically discovers and executes tests
• Identifies test failures
• Generates targeted fixes
• Commits fixes with [AI-AGENT] prefix
• Creates a new branch with strict naming format
• Pushes changes to remote
• Monitors CI/CD pipeline status
• Iterates until all tests pass or retry limit reached
• Produces results.json
• Displays comprehensive analytics in a production-ready React dashboard

The system is designed specifically for hackathon evaluation and strict automated test case matching.

⸻

2. Problem Statement

CI/CD failures slow development cycles and require manual debugging.

Challenges:
• Developers manually interpret test failures.
• Fixing CI issues is repetitive.
• Test environments vary across repositories.
• Branch naming and commit conventions are inconsistent.

This system automates failure detection, fix generation, commit process, and CI iteration without human intervention.

⸻

3. Target Users

Primary:
• Hackathon judges evaluating:
• Automation capability
• Correctness
• Branch compliance
• Test case output precision
• System architecture quality

Secondary:
• DevOps engineers
• Platform teams
• Engineering leads

⸻

4. Success Metrics

Metric Target
All tests passing 100% within retry limit
Correct branch naming 100% compliance
Commit prefix validation All commits begin with [AI-AGENT]
Exact test case match 100% string match
results.json generated Always
Retry limit respected Default 5
Execution time < 5 minutes preferred

⸻

5. Functional Requirements

⸻

5.1 Frontend (React Dashboard)

Must be:
• Built using functional components + hooks
• Production deployable
• Publicly accessible
• Located in /frontend

Input Section

Fields:
• GitHub Repository URL
• Team Name
• Team Leader Name

Button:
• “Run Agent”

Loading state:
• Spinner + status message

⸻

Run Summary Card

Displays:
• Repository URL
• Team Name
• Team Leader Name
• Generated branch name
• Total failures detected
• Total fixes applied
• Final CI/CD status (PASSED/FAILED)
• Total time taken

⸻

Score Breakdown Panel

Base score: 100

Rules:
• +10 if total time < 5 minutes
• −2 per commit over 20

Display:
• Final Score
• Breakdown chart
• Progress bar

⸻

Fixes Applied Table

Columns:
• File
• Bug Type
• Line Number
• Commit Message
• Status

Bug Types:
• LINTING
• SYNTAX
• LOGIC
• TYPE_ERROR
• IMPORT
• INDENTATION

Status:
• ✓ Fixed
• ✗ Failed

Color coded rows.

⸻

CI/CD Timeline

Displays:
• Iteration number
• Pass/Fail badge
• Timestamp
• Iteration usage (e.g., 3/5)

⸻

5.2 Backend / Agent

Capabilities: 1. Clone repository 2. Detect project language 3. Discover test files dynamically 4. Execute tests in sandbox 5. Capture structured failure logs 6. Classify error types 7. Generate targeted fixes 8. Apply patches 9. Commit changes with [AI-AGENT] 10. Create branch with strict naming format 11. Push branch 12. Monitor CI pipeline 13. Repeat until success or retry limit 14. Generate results.json

⸻

6. Non-Functional Requirements

Performance
• Execution under 5 minutes preferred
• Retry limit configurable (default 5)

Security
• All execution sandboxed via Docker
• No direct main branch commits
• No arbitrary shell access

Scalability
• Stateless API
• Agent workers containerized
• Horizontal scaling supported

⸻

7. Branch Naming Rules (STRICT FORMAT)

Branch must follow:

TEAM_NAME_LEADER_NAME_AI_Fix

Rules:
• All uppercase
• Replace spaces with underscores
• No special characters
• Ends exactly with \_AI_Fix
• No brackets

Example:

Team Name: RIFT ORGANISERS
Leader: Saiyam Kumar

Branch:

RIFT_ORGANISERS_SAIYAM_KUMAR_AI_Fix

Violation results in disqualification.

⸻

8. Test Case Output Format Requirements

Agent output MUST match judge test strings exactly.

Example:

Input:

src/utils.py — Line 15: Unused import 'os'

Output:

LINTING error in src/utils.py line 15 → Fix: remove the import statement

Strict:
• Same spacing
• Same punctuation
• Same arrow symbol (→)
• Exact casing

No deviations allowed.

⸻

9. Multi-Agent Architecture Overview

Architecture: 1. Orchestrator Agent 2. Repo Analyzer Agent 3. Test Runner Agent 4. Failure Parser Agent 5. Fix Generator Agent 6. Patch Applier Agent 7. Git Manager Agent 8. CI Monitor Agent 9. Scoring Agent 10. Result Aggregator Agent

Recommended Framework:
• LangGraph / CrewAI / AutoGen

Agents communicate via structured JSON messages.

⸻

10. CI/CD Monitoring Flow
    1.  Push branch
    2.  Query GitHub Actions API
    3.  Poll workflow status
    4.  Capture:
        • Success
        • Failure
        • Logs
    5.  Trigger new iteration if failed
    6.  Stop if passed or retry limit reached

⸻

11. Scoring System Logic

Base Score: 100

If execution time < 5 minutes:
+10 bonus

If commits > 20:
Penalty = (commits - 20) × 2

Final Score = 100 + Bonus − Penalty

Minimum score = 0

⸻

12. Dashboard UI Components

Components:
• InputForm
• LoadingOverlay
• RunSummaryCard
• ScorePanel
• ScoreProgressBar
• FixesTable
• CICDTimeline
• StatusBadge
• ErrorToast
• HeaderBar
• Footer

State management:
• Context API or Zustand

⸻

13. API Requirements

POST /run-agent

Input:

{
"repo_url": "",
"team_name": "",
"leader_name": ""
}

Output:

{
"run_id": "",
"status": "running"
}

⸻

GET /run-status/:id

Returns:
• All run metadata
• Score
• Fixes
• CI status
• results.json content

⸻

14. results.json Schema

{
"repository": "",
"branch_name": "",
"total_failures": 0,
"total_fixes": 0,
"iterations_used": 0,
"retry_limit": 5,
"commits": 0,
"final_status": "PASSED | FAILED",
"execution_time_seconds": 0,
"score": 0,
"fixes": [
{
"file": "",
"bug_type": "",
"line_number": 0,
"commit_message": "",
"status": "FIXED | FAILED"
}
],
"ci_timeline": [
{
"iteration": 1,
"status": "PASSED | FAILED",
"timestamp": ""
}
]
}

⸻

15. Retry & Iteration Logic

Default retry limit: 5

Loop: 1. Run tests 2. If fail:
• Generate fixes
• Commit
• Push
• Monitor CI 3. Increment iteration counter 4. Stop if:
• All tests pass
• Iteration == retry limit

No manual intervention allowed.

⸻

16. Risk Analysis

Risk Mitigation
Infinite loop Retry cap
Hallucinated fixes Structured error parsing
CI delay Polling timeout
Wrong branch name Regex validation
Judge string mismatch Exact template enforcement

⸻

17. Deployment Plan

Frontend:
• Vercel / Netlify

Backend:
• Railway / AWS / Render

Worker:
• Docker container

Environment Variables:
• GITHUB_TOKEN
• OPENAI_API_KEY
• RETRY_LIMIT

⸻

18. Future Improvements
    • Support multiple languages
    • Support self-healing PR comments
    • Auto-merge after success
    • GitHub App integration
    • Slack notifications
    • Performance optimization agent

⸻
