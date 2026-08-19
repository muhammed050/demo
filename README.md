# Eldevo AI Agency — Autonomous SEO & Website Intelligence

An open-source experimental platform for analyzing websites, repositories, SEO performance, and growth signals using AI agents and external integrations.

> This project is an independent extension of the original [The Delegation](https://github.com/arturitu/the-delegation) project. Please review the original project's license and attribution requirements before redistributing or modifying this project.

---

## ✨ What is Eldevo AI Agency?

Eldevo AI Agency transforms an AI-agent playground into a practical website intelligence and SEO analysis environment.

The goal is simple:

**Connect a website → inspect its code → analyze SEO → collect performance data → generate recommendations → request approval before making changes.**

The system is designed around human approval rather than unrestricted autonomous modification.

---

## 🚀 Main Capabilities

### 🌐 Website Analysis

- Inspect public websites.
- Fetch HTML and HTTP metadata.
- Analyze technical SEO signals.
- Inspect public resources.
- Detect potential SEO problems.
- Analyze page structure and metadata.
- Prepare actionable SEO recommendations.

### 🐙 GitHub Integration

The agent can work with a connected GitHub account to:

- List repositories.
- Read source files.
- Search source code.
- Inspect project structure.
- Analyze implementation details.
- Prepare proposed file changes.
- Request human approval before editing files.

### 🔎 Google Integrations

The project includes integrations for:

- Google Search Console
- Google Analytics
- PageSpeed Insights
- Google Trends
- Google Sheets

These integrations allow the agent to combine technical website information with search, traffic, performance, and trend data.

### 📊 SEO Analysis

The platform is designed to analyze:

- Page titles
- Meta descriptions
- Canonical URLs
- Heading structure
- Technical SEO
- Page performance
- Search visibility
- Search queries
- Clicks
- Impressions
- CTR
- Analytics traffic
- Keyword opportunities
- Google Trends
- Content opportunities

---

# 🔄 SEO Analysis Workflow

The intended workflow is:

```text
1. Enter website URL
        ↓
2. Connect GitHub repository
        ↓
3. Connect Google services when required
        ↓
4. Inspect website
        ↓
5. Analyze technical SEO
        ↓
6. Analyze PageSpeed
        ↓
7. Analyze Search Console
        ↓
8. Analyze Analytics
        ↓
9. Research Google Trends
        ↓
10. Combine collected data
        ↓
11. AI SEO analysis
        ↓
12. Generate recommendations
        ↓
13. Generate optional report
        ↓
14. Request human approval
        ↓
15. Prepare code changes
        ↓
16. Apply approved changes

The goal is to let the AI perform analysis while keeping important modifications under human control.

🧠 AI Agent Architecture

The application uses an external-tool architecture.

The AI agent can request tools such as:

github_read_file
github_search_code
github_edit_file


browser_fetch
terminal_run


google_search_console
google_analytics
google_pagespeed
google_trends
google_sheets_report

Tool access is controlled through permissions.

State-changing operations should require explicit human approval.

🔐 Human Approval Model

The system intentionally avoids unrestricted autonomous modifications.

Example:

AI detects SEO problem
        ↓
AI analyzes the problem
        ↓
AI prepares proposed change
        ↓
Human approval requested
        ↓
Approved
        ↓
Change is executed

This architecture is intended to provide a safer environment for AI-assisted website management.

🛡️ Security

Never commit:

.env
OAuth client secrets
API keys
Access tokens
Refresh tokens
Private credentials
.delegation/

Use .env.example as the configuration template.

Example:

API_PORT=8787
CLIENT_URL=http://localhost:3000


GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_OAUTH_REDIRECT_URI=http://localhost:8787/api/github/callback


GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8787/api/google/callback


PAGESPEED_API_KEY=

Each developer should use their own OAuth applications and API credentials.

See SECURITY.md for security guidelines.

🧩 Project Structure
.
├── src/
│   ├── core/
│   │   └── agent/
│   │       └── tools/
│   ├── interface/
│   ├── simulation/
│   └── data/
│
├── server/
│   ├── index.mjs
│   └── google.mjs
│
├── scripts/
├── public/
│
├── .env.example
├── .gitignore
├── CONTRIBUTING.md
├── SECURITY.md
├── PROJECT_SUMMARY.md
└── package.json
⚙️ Requirements

Recommended environment:

Node.js 22+
npm
Git
Modern Chromium-based browser

Optional integrations require their own credentials.

📦 Installation

Clone the repository:

git clone https://github.com/muhammed050/demo.git
cd demo

Install dependencies:

npm install

Create the local environment file.

Windows PowerShell
Copy-Item .env.example .env
Linux / macOS
cp .env.example .env

Then edit .env and provide your own credentials.

Never commit .env.

▶️ Development

Start the frontend:

npm run dev

Start the tools server:

npm run tools

If supported by the project configuration:

npm run dev:full

Default development endpoints:

Frontend:
http://localhost:3000


Tools server:
http://localhost:8787
🧪 Validation

Run TypeScript validation:

npm run lint

Build the production application:

npm run build

Preview the production build:

npm run preview

A successful build should finish without TypeScript errors.

🔑 OAuth Integrations

OAuth integrations are optional.

GitHub

Configure your own GitHub OAuth application:

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_OAUTH_REDIRECT_URI=http://localhost:8787/api/github/callback

The application uses GitHub OAuth to access repositories authorized by the user.

Google

Configure your own Google OAuth client:

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:8787/api/google/callback

Enable only the Google APIs required by your installation.

Supported functionality includes:

Search Console
Analytics
Sheets
Trends-related research
PageSpeed Insights
Vercel

Vercel integration is optional:

VERCEL_CLIENT_ID=
VERCEL_CLIENT_SECRET=
VERCEL_OAUTH_REDIRECT_URI=http://localhost:8787/api/vercel/callback

The integration can be disabled if deployment functionality is not required.

📊 SEO Analysis Architecture

The main purpose of the integrations is to create a unified SEO analysis workflow.

                    Website
                       │
              ┌────────┴────────┐
              │                 │
           Browser           GitHub
              │                 │
              └────────┬────────┘
                       │
          ┌────────────┼────────────┐
          │            │            │
      PageSpeed   Search Console  Analytics
          │            │            │
          └────────────┼────────────┘
                       │
                 Google Trends
                       │
                       ▼
                AI SEO Analysis
                       │
              ┌────────┴────────┐
              │                 │
       Recommendations       Report
              │                 │
              │          Google Sheets
              │
              ▼
       Human Approval
              │
              ▼
       Proposed Changes
📋 Example SEO Report

A generated report can contain:

Category    Metric    Result    Recommendation
Technical SEO    Title    Too long    Shorten title
Technical SEO    Meta Description    Missing    Add description
Technical SEO    Canonical    Missing    Add canonical URL
Performance    Performance Score    62    Optimize assets
Search    Clicks    1,240    Improve CTR
Search    Impressions    32,400    Target additional queries
Content    Keywords    Limited    Expand topical coverage
📑 Google Sheets Reporting

The Google Sheets tool accepts a two-dimensional array.

Example:

{
  "spreadsheetId": "YOUR_SPREADSHEET_ID",
  "title": "SEO Report",
  "values": [
    ["Metric", "Value", "Recommendation"],
    ["Title", "Too long", "Shorten the title"],
    ["Performance", "62", "Optimize images and scripts"],
    ["Meta Description", "Missing", "Add a unique description"]
  ]
}

The values property is intentionally defined as an array of arrays so that it can be represented correctly in AI function-calling schemas.

🤖 AI Usage & API Quotas

AI providers may enforce request, token, and rate limits.

The application should avoid unnecessary repeated AI requests.

A recommended architecture is:

Collect website data
        ↓
Collect SEO data
        ↓
Combine results
        ↓
One focused AI analysis
        ↓
Generate recommendations
        ↓
Generate report

Instead of sending multiple independent AI requests for every small SEO issue.

This reduces unnecessary API usage and makes the analysis more consistent.

🧰 External Tool Permissions

The project supports permission-based access to external capabilities.

Examples include:

GitHub
Browser
Terminal
Google
Vercel

Example permission model:

{
  "github": {
    "read": true,
    "write": true,
    "branch": true,
    "commit": true,
    "pullRequest": true,
    "merge": false
  },
  "browser": {
    "browse": true,
    "interact": false
  },
  "terminal": {
    "enabled": true
  },
  "google": {
    "searchConsole": true,
    "analytics": true,
    "pageSpeed": true,
    "trends": true,
    "sheets": true
  }
}

Production deployments and potentially destructive operations should remain disabled or approval-gated unless explicitly enabled.

🔄 Recommended Agent Workflow

For a complete website audit:

Website URL
    ↓
Inspect website
    ↓
Identify repository
    ↓
Read relevant source files
    ↓
Run PageSpeed
    ↓
Read Search Console
    ↓
Read Analytics
    ↓
Research Google Trends
    ↓
Combine collected information
    ↓
AI SEO analysis
    ↓
Generate SEO report
    ↓
Recommend changes
    ↓
Request human approval
    ↓
Apply approved changes

The agent should avoid repeatedly asking the AI model to analyze information that has already been collected.

🎯 SEO-First Mode

The platform can also be used as a focused SEO analysis system without requiring every integration.

A minimal SEO audit can work with:

Website URL
      ↓
Browser inspection
      ↓
PageSpeed
      ↓
Technical SEO analysis
      ↓
AI recommendations

Additional data sources can be enabled when available.

This makes the system useful even when Google Analytics, Search Console, or GitHub are not connected.

📝 Example Agent Task

Example:

Analyze https://example.com for SEO issues.


Check:


- Technical SEO
- Page title
- Meta description
- Headings
- Canonical URL
- Robots directives
- Structured data
- Open Graph metadata
- PageSpeed
- Internal links
- Content quality


Return:


1. Critical issues
2. High-priority issues
3. Medium-priority issues
4. Recommended improvements
5. Suggested code changes


Do not modify the repository without human approval.
🤝 Contributing

Contributions are welcome.

Please read CONTRIBUTING.md before submitting changes.

Before submitting a pull request:

npm run lint
npm run build
🔒 Security

Security issues should be reported privately.

Please read SECURITY.md.

Never publish:

OAuth secrets
API keys
Access tokens
Refresh tokens
Private credentials

If a credential is accidentally exposed, revoke it immediately and replace it.

⚠️ Responsible Use

This project is intended for:

Education
Research
Development
SEO experimentation
AI-agent experimentation
Website analysis
Open-source development

Only connect websites, repositories, Google properties, and other resources that you are authorized to access.

Do not use the platform to:

Bypass authentication.
Access private systems without authorization.
Circumvent security controls.
Execute unauthorized commands.
Modify repositories without permission.
Access data belonging to other users.
🎨 Original Project & Attribution

This project is based on and extends the concepts and source code of:

The Delegation

Original author:

Arturo Paracuellos

Original repository:

https://github.com/arturitu/the-delegation

Original project:

https://arturitu.github.io/the-delegation/

The original project uses a dual-license model:

Source code: MIT
Certain 3D models and assets: CC BY-NC 4.0

The applicable license must be respected for each component.

In particular, CC BY-NC assets must not be treated as MIT-licensed code or used commercially without the required permission.

📜 License

This repository contains derivative work and components originating from the original The Delegation project.

Before redistributing this project, review:

The original source-code license.
The original 3D asset license.
Attribution requirements.
Licenses applicable to newly added dependencies.
Licenses applicable to newly added assets.

The project is intended for open-source development and experimentation.

📌 Project Status

Experimental / Active Development

The project is continuously evolving.

APIs, integrations, agent tools, UI components, and internal architecture may change between versions.

This project should currently be considered a development and research platform rather than a fully production-ready autonomous deployment system.

🗺️ Roadmap

Potential future improvements include:

Automated technical SEO crawler
Sitemap analysis
Robots.txt analysis
Canonical URL detection
Structured-data validation
Open Graph analysis
Broken-link detection
Internal-link analysis
Keyword clustering
Content-gap analysis
AI-generated SEO tasks
GitHub pull-request automation
SEO monitoring dashboards
Scheduled audits
Historical SEO reports
Multi-site management
Better human approval workflows
SEO issue prioritization
Automated regression checks
SEO score history
Competitor analysis
Content recommendations
⭐ Why Eldevo AI Agency?

Traditional SEO tools often provide isolated reports.

Eldevo AI Agency is designed around a different workflow:

DATA
 ↓
UNDERSTANDING
 ↓
AI ANALYSIS
 ↓
RECOMMENDATION
 ↓
HUMAN APPROVAL
 ↓
IMPLEMENTATION

The objective is to connect website intelligence, source-code understanding, SEO data, performance information, and AI-assisted development into one environment.

❤️ Credits

Original project:

The Delegation — Arturo Paracuellos

Extended with additional:

Website intelligence
SEO analysis
GitHub tooling
Google integrations
PageSpeed analysis
Google Trends research
Google Sheets reporting
AI-agent tools
Human approval workflows
📬 Project

GitHub:

https://github.com/muhammed050/demo

Original project:

https://github.com/arturitu/the-delegation

Eldevo AI Agency

Experimental AI-powered website intelligence and SEO automation.
