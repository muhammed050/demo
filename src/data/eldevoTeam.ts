import { DEFAULT_MODELS } from '../core/llm/constants';
import { AgenticSystem } from './agents';

export const ELDEVO_TEAM: AgenticSystem = {
  id: 'eldevo-autonomous-agency',
  teamName: 'Eldevo Autonomous Agency',
  teamType: 'AI Engineering & Growth',
  teamDescription: 'A full autonomous team for product engineering, SEO, research, UX, QA, security, growth and deployment.',
  color: '#2563EB',
  outputType: 'text',
  outputModel: DEFAULT_MODELS.text,
  outputAutoApprove: false,
  user: { index: 0, model: 'Human', position: { x: 0, y: 0 } },
  leadAgent: {
    id: 'eldevo-ceo', index: 1, name: 'CEO / Orchestrator',
    description: 'Coordinates the entire Eldevo operation, delegates work, reviews results, prioritizes impact, and waits for human approval for risky actions.',
    color: '#2563EB', model: DEFAULT_MODELS.text, humanInTheLoop: true, position: { x: 0, y: 130 },
    subagents: [
      { id: 'eldevo-research', index: 2, name: 'Market Research', description: 'Research competitors, users, trends, positioning and opportunities.', color: '#7C3AED', model: DEFAULT_MODELS.text, position: { x: -900, y: 320 } },
      { id: 'eldevo-seo', index: 3, name: 'SEO Strategist', description: 'Audits technical SEO, keywords, search intent, structured data, internal links and content opportunities.', color: '#F59E0B', model: DEFAULT_MODELS.text, position: { x: -600, y: 320 } },
      { id: 'eldevo-product', index: 4, name: 'Product Manager', description: 'Turns research into prioritized product requirements, roadmaps and measurable experiments.', color: '#0EA5E9', model: DEFAULT_MODELS.text, position: { x: -300, y: 320 } },
      { id: 'eldevo-developer', index: 5, name: 'Senior Developer', description: 'Reads and modifies the connected repository, runs tests/builds and prepares focused pull requests.', color: '#16A34A', model: DEFAULT_MODELS.text, humanInTheLoop: true, position: { x: 0, y: 320 } },
      { id: 'eldevo-designer', index: 6, name: 'UX/UI Designer', description: 'Audits UX, responsive design, accessibility and conversion flows and proposes precise improvements.', color: '#EC4899', model: DEFAULT_MODELS.text, position: { x: 300, y: 320 } },
      { id: 'eldevo-content', index: 7, name: 'Content Strategist', description: 'Creates useful, original landing-page, comparison, educational and conversion content plans.', color: '#EF4444', model: DEFAULT_MODELS.text, humanInTheLoop: true, position: { x: 600, y: 320 } },
      { id: 'eldevo-growth', index: 8, name: 'Growth & Monetization', description: 'Finds acquisition, affiliate, conversion and revenue opportunities and ranks experiments by impact.', color: '#0891B2', model: DEFAULT_MODELS.text, position: { x: 900, y: 320 } },
      { id: 'eldevo-qa', index: 9, name: 'QA & Browser Tester', description: 'Tests the live site, checks regressions, responsive behavior, links, console errors and user flows.', color: '#475569', model: DEFAULT_MODELS.text, position: { x: -450, y: 500 } },
      { id: 'eldevo-security', index: 10, name: 'Security Reviewer', description: 'Reviews authentication, permissions, secrets, API exposure and dangerous changes before deployment.', color: '#991B1B', model: DEFAULT_MODELS.text, humanInTheLoop: true, position: { x: 0, y: 500 } },
      { id: 'eldevo-devops', index: 11, name: 'DevOps / Release', description: 'Validates builds and manages preview/release workflows. Production deployment always requires human approval.', color: '#334155', model: DEFAULT_MODELS.text, humanInTheLoop: true, position: { x: 450, y: 500 } }
    ]
  }
};
