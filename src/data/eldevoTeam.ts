import { DEFAULT_MODELS } from '../core/llm/constants';
import type { AgenticSystem } from './agents';

export const ELDEVO_TEAM: AgenticSystem = {
  id: 'eldevo-autonomous-agency', teamName: 'Eldevo Autonomous Agency', teamType: 'AI Engineering & Growth',
  teamDescription: 'Autonomous product engineering and growth team using GitHub, browser QA, Vercel, Google Search Console, GA4, PageSpeed, Google Trends and Google Sheets.',
  color: '#2563EB', outputType: 'text', outputModel: DEFAULT_MODELS.text, outputAutoApprove: false,
  user: { index: 0, model: 'Human', position: { x: 0, y: 0 } },
  leadAgent: {
    id: 'eldevo-ceo', index: 1, name: 'CEO / Orchestrator', description: 'Coordinates engineering and growth, delegates work, reviews tool results, creates reports and waits for human approval for risky actions.', color: '#2563EB', model: DEFAULT_MODELS.text, humanInTheLoop: true, position: { x: 0, y: 130 },
    subagents: [
      { id: 'eldevo-research', index: 2, name: 'Market Research', description: 'Research competitors, users, market opportunities and product positioning.', color: '#7C3AED', model: DEFAULT_MODELS.text, position: { x: -1200, y: 320 } },
      { id: 'eldevo-seo', index: 3, name: 'SEO Strategist', description: 'Audits technical SEO, Search Console performance, keywords, structured data, internal links and content opportunities.', color: '#F59E0B', model: DEFAULT_MODELS.text, position: { x: -900, y: 320 } },
      { id: 'eldevo-trends', index: 4, name: 'Google Trends Researcher', description: 'Monitors rising search topics and turns trends into content and product opportunities.', color: '#E11D48', model: DEFAULT_MODELS.text, position: { x: -600, y: 320 } },
      { id: 'eldevo-analytics', index: 5, name: 'Analytics Analyst', description: 'Reads GA4 traffic, engagement and conversion trends and recommends measurable actions.', color: '#0F766E', model: DEFAULT_MODELS.text, position: { x: -300, y: 320 } },
      { id: 'eldevo-performance', index: 6, name: 'Performance Engineer', description: 'Runs PageSpeed and Core Web Vitals audits and prioritizes performance fixes.', color: '#EA580C', model: DEFAULT_MODELS.text, position: { x: 0, y: 320 } },
      { id: 'eldevo-product', index: 7, name: 'Product Manager', description: 'Turns research into prioritized product requirements, roadmaps and experiments.', color: '#0EA5E9', model: DEFAULT_MODELS.text, position: { x: 300, y: 320 } },
      { id: 'eldevo-developer', index: 8, name: 'Senior Developer', description: 'Reads and modifies the connected repository, runs tests/builds and prepares focused pull requests.', color: '#16A34A', model: DEFAULT_MODELS.text, humanInTheLoop: true, position: { x: 600, y: 320 } },
      { id: 'eldevo-designer', index: 9, name: 'UX/UI Designer', description: 'Audits UX, responsive design, accessibility and conversion flows.', color: '#EC4899', model: DEFAULT_MODELS.text, position: { x: 900, y: 320 } },
      { id: 'eldevo-content', index: 10, name: 'Content Strategist', description: 'Creates original landing-page, comparison, educational and conversion content plans.', color: '#EF4444', model: DEFAULT_MODELS.text, humanInTheLoop: true, position: { x: 1200, y: 320 } },
      { id: 'eldevo-growth', index: 11, name: 'Growth & Monetization', description: 'Finds acquisition, affiliate, conversion and revenue opportunities and ranks experiments by impact.', color: '#0891B2', model: DEFAULT_MODELS.text, position: { x: -450, y: 500 } },
      { id: 'eldevo-reporting', index: 12, name: 'Reporting Agent', description: 'Combines Search Console, GA4, Trends and PageSpeed results into executive reports and Google Sheets updates.', color: '#4F46E5', model: DEFAULT_MODELS.text, humanInTheLoop: true, position: { x: -150, y: 500 } },
      { id: 'eldevo-qa', index: 13, name: 'QA & Browser Tester', description: 'Tests the live site, regressions, responsive behavior, links, console errors and user flows.', color: '#475569', model: DEFAULT_MODELS.text, position: { x: 150, y: 500 } },
      { id: 'eldevo-security', index: 14, name: 'Security Reviewer', description: 'Reviews authentication, permissions, secrets, API exposure and dangerous changes before deployment.', color: '#991B1B', model: DEFAULT_MODELS.text, humanInTheLoop: true, position: { x: 450, y: 500 } },
      { id: 'eldevo-devops', index: 15, name: 'DevOps / Release', description: 'Validates builds and manages preview/release workflows. Production deployment always requires human approval.', color: '#334155', model: DEFAULT_MODELS.text, humanInTheLoop: true, position: { x: 750, y: 500 } }
    ]
  }
};
