Autonomous CI/CD Healing Agent

Technical Architecture & Implementation Document

⸻

1. System Overview

The Autonomous CI/CD Healing Agent is a distributed multi-agent DevOps system that:
• Accepts a GitHub repository URL
• Clones and analyzes repository structure
• Discovers and runs test files
• Identifies failures
• Generates targeted fixes
• Commits fixes with [AI-AGENT] prefix
• Pushes to a strictly formatted branch
• Monitors CI/CD status
• Iterates until success or retry limit
• Generates results.json
• Displays results in a production React dashboard

This system is fully autonomous and requires zero human intervention during execution.

⸻

2. High-Level Architecture

┌──────────────────────────────┐
│ React Dashboard │
│ (Vite + TypeScript + UI) │
└──────────────┬───────────────┘
│
▼
┌──────────────────────────────┐
│ FastAPI API │
│ /run-agent /run-status │
└──────────────┬───────────────┘
│
▼
┌──────────────────────────────┐
│ LangGraph Orchestrator │
│ Multi-Agent Workflow Engine │
└──────────────┬───────────────┘
│
┌─────────┼─────────┬─────────┐
▼ ▼ ▼ ▼
Repo Agent Test Agent Fix Agent Git Agent
│
▼
CI Monitor
│
▼
Score Agent
│
▼
results.json

3. Tech Stack

Frontend
• React 18
• Vite
• TypeScript
• TailwindCSS
• Zustand (State Management)
• Recharts (Score Visualization)
• Axios (API Communication)

Deployment:
• Vercel

⸻

Backend
• Python 3.11
• FastAPI
• LangGraph (Multi-Agent orchestration)
• GitPython
• Pytest
• Docker (Sandbox execution)
• GitHub REST API (CI Monitoring)

Deployment:
• Railway / AWS

⸻

4. Folder Structure

autonomous-cicd-healing-agent/
│
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── store/
│ │ ├── services/
│ │ └── App.tsx
│ └── ...
│
├── backend/
│ ├── agents/
│ │ ├── orchestrator.py
│ │ ├── repo_agent.py
│ │ ├── test_agent.py
│ │ ├── fix_agent.py
│ │ ├── git_agent.py
│ │ ├── ci_agent.py
│ │ └── score_agent.py
│ │
│ ├── sandbox/
│ ├── results/
│ ├── main.py
│ └── requirements.txt
│
├── docker/
│ └── Dockerfile.sandbox
│
├── results.json
├── README.md
├── TECH.md
└── .env

5. Multi-Agent Architecture

The system uses LangGraph for orchestrated execution.

Agents

1. Orchestrator Agent

Controls workflow and iteration loop.

Responsibilities:
• Maintain state
• Track retry count
• Coordinate agent execution
• Stop when success or retry limit reached

2. Repo Agent
   • Clones repository
   • Validates URL
   • Detects language
   • Discovers project structure

⸻

3. Test Agent
   • Discovers test files dynamically
   • Executes tests inside Docker sandbox
   • Captures structured failure output

Supported:
• pytest (Python)
• npm test (JS future extension)

4. Failure Parser Agent
   • Extracts file path
   • Extracts line number
   • Extracts error message
   • Classifies bug type

Bug types:
• LINTING
• SYNTAX
• LOGIC
• TYPE_ERROR
• IMPORT
• INDENTATION

⸻

5. Fix Agent
   • Generates targeted patch
   • Applies code modification
   • Ensures no hallucinated files
   • Produces structured fix output

⸻

6. Git Agent
   • Creates new branch
   • Strict naming validation
   • Commits with prefix [AI-AGENT]
   • Pushes to remote
   • Prevents push to main

⸻

7. CI Monitor Agent
   • Polls GitHub Actions API
   • Detects:
   • queued
   • running
   • success
   • failure
   • Captures timestamps
   • Records iteration timeline

⸻

8. Score Agent

Calculates:

Base score = 100
+10 if < 5 minutes
−2 per commit over 20

Ensures minimum score = 0

⸻

6. Branch Naming Logic

Format:
TEAM_NAME_LEADER_NAME_AI_Fix

Transformation Rules: 1. Convert to uppercase 2. Replace spaces with underscore 3. Remove special characters 4. Append \_AI_Fix

Validation Regex:
^[A-Z_]+\_AI_Fix$
Invalid format blocks execution.

⸻

7. Execution Flow

1. Receive API request
1. Generate run_id
1. Clone repository
1. Create new branch
1. Run tests
1. If failure:
   a. Parse failure
   b. Generate fix
   c. Apply patch
   d. Commit
   e. Push
   f. Monitor CI
1. Repeat until:
   - All tests pass
   - Retry limit reached
1. Generate results.json
1. Return final status

1. Docker Sandbox

Each run executes inside:

/backend/sandbox/{run_id}

Docker container:
• Python base image
• Isolated execution
• No root permissions
• Limited memory

Prevents:
• Arbitrary system damage
• Unsafe execution

⸻

9. API Specification

POST /run-agent

Request:
{
"repo_url": "",
"team_name": "",
"leader_name": ""
}
Response:
{
"run_id": "",
"status": "running"
}

GET /run-status/{run_id}

Returns full results:
• Score
• Iterations
• Fixes
• CI timeline
• Branch name
• Final status

⸻

10. results.json Schema
    {
    "repository": "",
    "branch_name": "",
    "total_failures": 0,
    "total_fixes": 0,
    "iterations_used": 0,
    "retry_limit": 5,
    "commits": 0,
    "final_status": "PASSED",
    "execution_time_seconds": 0,
    "score": 0,
    "fixes": [],
    "ci_timeline": []
    }
    Generated at end of every run.

Mandatory for submission compliance.

⸻

11. Retry & Loop Control

Default:
RETRY_LIMIT=5
State maintained in orchestrator.

Stops when:
• All tests pass
• iteration == retry_limit

No manual intervention allowed.

⸻

12. State Management (Frontend)

Zustand Store:
interface RunState {
runId: string
status: string
results: ResultsSchema | null
}
Polling:
• Every 5 seconds
• Stops on final state

⸻

13. Security Model
    • GitHub token stored in .env
    • No direct main branch push
    • Docker sandbox enforced
    • Input validation on repo URL
    • Branch regex validation

⸻

14. Performance Targets
    Metric
    Target
    Clone time
    < 30 sec
    First test run
    < 1 min
    Total execution
    < 5 min preferred
    API response
    < 200 ms

15. Deployment Plan

Frontend:
• Vercel
• Environment variable: VITE_API_URL

Backend:
• Railway
• Environment variables:
• GITHUB_TOKEN
• OPENAI_API_KEY
• RETRY_LIMIT

Docker:
• Built during deployment

⸻

16. Failure Handling
    Scenario
    Handling
    Repo invalid
    400 error
    No tests found
    Return FAILED
    CI timeout
    Mark as FAILED
    Branch exists
    Append run_id
    Docker crash
    Abort run

17. Known Limitations
    • Python projects prioritized
    • Assumes test framework present
    • Does not auto-install dependencies outside sandbox
    • Limited to GitHub (not GitLab/Bitbucket)

⸻

18. Compliance Checklist

✔ Multi-agent architecture
✔ Strict branch naming
✔ Commit prefix enforcement
✔ No main branch push
✔ results.json generation
✔ Exact test case output format
✔ Retry limit respected
✔ Live dashboard integration
