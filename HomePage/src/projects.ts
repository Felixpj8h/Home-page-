export type Project = {
  id: string
  title: string
  summary: string
  overview: string
  role?: string
  highlights?: string[]
  workflow?: { title: string; description: string }[]
  origin?: string
  previewImage?: string
  detailImages?: string[]
  languages: { name: string; percent: number; color: string }[]
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
    languages: [
      { name: 'TypeScript', percent: 42.9, color: '#4b80c8' },
      { name: 'Python', percent: 39.3, color: '#4a78a8' },
      { name: 'CSS', percent: 15.8, color: '#713fa3' },
      { name: 'PowerShell', percent: 1.3, color: '#4f7f9e' },
      { name: 'HTML', percent: 0.3, color: '#e35d3e' },
      { name: 'Dockerfile', percent: 0.3, color: '#386b7a' },
      { name: 'Mako', percent: 0.1, color: '#a08a7d' },
    ],
    featured: true,
  },
  {
    id: 'examgen',
    title: 'Examgen',
    summary: 'Project description coming soon.',
    overview: 'An overview of Examgen will be added here.',
    role: 'Role details coming soon.',
    highlights: ['Project highlights coming soon.'],
    languages: [
      { name: 'HTML', percent: 54.8, color: '#e35d3e' },
      { name: 'Python', percent: 30.9, color: '#4a78a8' },
      { name: 'TypeScript', percent: 11.5, color: '#4b80c8' },
      { name: 'CSS', percent: 2.5, color: '#713fa3' },
      { name: 'JavaScript', percent: 0.3, color: '#e2c64f' },
    ],
    featured: true,
  },
  {
    id: 'dagenstall',
    title: 'Dagens tall',
    previewImage: '/projects/dagenstall.png',
    detailImages: ['/projects/dagenstall-report.png'],
    languages: [
      { name: 'TypeScript', percent: 65.7, color: '#4b80c8' },
      { name: 'Python', percent: 31.8, color: '#4a78a8' },
      { name: 'CSS', percent: 1.8, color: '#713fa3' },
      { name: 'HTML', percent: 0.7, color: '#e35d3e' },
    ],
    summary: 'A tool that helps me write closing reports at work.',
    overview: 'Dagens tall turns the numbers and highlights from a workday into a closing report I can review and share with my team.',
    workflow: [
      { title: 'Results', description: 'Enter the daily budget and earnings. The app calculates the difference.' },
      { title: 'Top 3', description: 'Add the three top sellers and their results.' },
      { title: 'Extra effort', description: 'Add optional shoutouts for colleagues.' },
      { title: 'ASO and NPS', description: 'Fill in the final figures for the day.' },
      { title: 'Closing report', description: 'Review the draft, edit it if needed, and copy it to Teams.' },
    ],
    origin: 'I built this for my work at a Norwegian electronics store and to keep practising Python while taking courses at UiB.',
    featured: false,
  },
]
