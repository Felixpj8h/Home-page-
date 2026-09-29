export type Project = {
  id: string
  title: string
  summary: string
  overview: string
  role: string
  highlights: string[]
  previewImage?: string
  detailImages?: string[]
  liveUrl?: string
  codeUrl?: string
  featured: boolean
}

// Replace the temporary copy as project material becomes available. Put images
// in public/projects and reference them as /projects/filename.webp.
export const projects: Project[] = [
  {
    id: 'w-tracker',
    title: 'W-Tracker',
    summary: 'Project description coming soon.',
    overview: 'An overview of W-Tracker will be added here.',
    role: 'Role details coming soon.',
    highlights: ['Project highlights coming soon.'],
    featured: true,
  },
  {
    id: 'examgen',
    title: 'Examgen',
    summary: 'Project description coming soon.',
    overview: 'An overview of Examgen will be added here.',
    role: 'Role details coming soon.',
    highlights: ['Project highlights coming soon.'],
    featured: true,
  },
  {
    id: 'dagenstall',
    title: 'Dagenstall',
    summary: 'Project description coming soon.',
    overview: 'An overview of Dagenstall will be added here.',
    role: 'Role details coming soon.',
    highlights: ['Project highlights coming soon.'],
    featured: false,
  },
]
