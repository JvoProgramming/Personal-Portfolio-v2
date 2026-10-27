// Mock resume. Swap these values for the real thing; the Resume app and /resume page both read from here.
export const resume = {
  name: 'Johnny Vo',
  title: 'Software Engineer',
  location: 'Los Angeles, CA',
  email: 'hello@example.com',
  links: [
    { label: 'GitHub', href: 'https://github.com/JvoProgramming' },
    { label: 'LinkedIn', href: 'https://www.linkedin.com/' },
  ],
  summary:
    'Software engineer who likes building things people enjoy using, from backend services to playful front ends. Placeholder summary until the real one lands.',
  experience: [
    {
      company: 'Example Corp',
      role: 'Software Engineer',
      start: '2023',
      end: 'Present',
      bullets: [
        'Built and maintained services that handle millions of requests a day (sample bullet).',
        'Led a migration that cut page load times by 40% (sample bullet).',
        'Mentored two new engineers through their first launches (sample bullet).',
      ],
    },
    {
      company: 'Sample Startup',
      role: 'Software Engineering Intern',
      start: '2022',
      end: '2022',
      bullets: [
        'Shipped an internal dashboard used by the whole support team (sample bullet).',
        'Wrote end-to-end tests that caught regressions before release (sample bullet).',
      ],
    },
  ],
  education: [{ school: 'University of California', degree: 'B.S. Computer Science', year: '2022' }],
  skills: ['TypeScript', 'React', 'Node.js', 'Python', 'SQL', 'AWS', 'Three.js'],
}

export type Resume = typeof resume
