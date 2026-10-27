export interface Project {
  id: string
  name: string
  icon: string
  tagline: string
  description: string
  stack: string[]
  link?: string
}

export const projects: Project[] = [
  {
    id: 'portfolio',
    name: 'Portfolio OS',
    icon: '🖥️',
    tagline: 'This website: a 3D bedroom with a Windows XP style OS inside.',
    description:
      'A personal site built as an operating system. Each visitor logs in as a user and gets their own desktop of apps. Built with React, TypeScript and React Three Fiber.',
    stack: ['React', 'TypeScript', 'Three.js', 'Vite'],
    link: 'https://github.com/JvoProgramming/Personal-Portfolio-v2',
  },
  {
    id: 'recipe-box',
    name: 'Recipe Box',
    icon: '🍳',
    tagline: 'Sample project: a meal planner that turns recipes into a grocery list.',
    description:
      'Placeholder project. Pick recipes for the week and get one combined grocery list sorted by store aisle.',
    stack: ['Next.js', 'PostgreSQL'],
  },
  {
    id: 'rally-tracker',
    name: 'Rally Tracker',
    icon: '🎾',
    tagline: 'Sample project: tennis match stats from your phone.',
    description: 'Placeholder project. Tap to log points during a match and see serve and rally stats afterwards.',
    stack: ['React Native', 'Firebase'],
  },
]
