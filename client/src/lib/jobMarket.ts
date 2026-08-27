export interface JobMarketPlatform {
  label: string;
  description: string;
  buildUrl: (role: string) => string;
}

const toSearchSlug = (role: string) =>
  role
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const JOB_MARKET_PLATFORMS: JobMarketPlatform[] = [
  {
    label: 'Naukri',
    description: 'India jobs',
    buildUrl: (role) => `https://www.naukri.com/${toSearchSlug(role)}-jobs`,
  },
  {
    label: 'Indeed',
    description: 'Global job search',
    buildUrl: (role) => `https://www.indeed.com/jobs?q=${encodeURIComponent(role)}`,
  },
  {
    label: 'Apna',
    description: 'Jobs across India',
    buildUrl: (role) => `https://apna.co/jobs/${toSearchSlug(role)}-jobs`,
  },
  {
    label: 'Foundit',
    description: 'Jobs and vacancies',
    buildUrl: (role) => `https://www.foundit.in/search/${toSearchSlug(role)}-jobs`,
  },
  {
    label: 'LinkedIn Jobs',
    description: 'Jobs and networking',
    buildUrl: (role) =>
      `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(role)}`,
  },
  {
    label: 'Instahyre',
    description: 'Tech and startup jobs',
    buildUrl: (role) => `https://www.instahyre.com/${toSearchSlug(role)}-jobs/`,
  },
  {
    label: 'Wellfound',
    description: 'Startup jobs',
    buildUrl: (role) => `https://wellfound.com/jobs?query=${encodeURIComponent(role)}`,
  },
];
