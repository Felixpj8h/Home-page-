export type Project = {
  id: string
  title: string
  summary: string
  overview: string
  role?: string
  highlights?: string[]
  workflow?: { title: string; description: string }[]
  features?: string[]
  origin?: string
  previewImage?: string
  detailImages?: string[]
  detailCaption?: string
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
    previewImage: '/projects/w-tracker-dashboard.png',
    detailImages: ['/projects/w-tracker-coach.png'],
    summary: 'A workout tracker built around how I train and manage my data.',
    overview: 'W-Tracker combines my interests in weightlifting and web development. Spreadsheets gave me control over my workout data but made logging tedious; tracking apps were easier to use, but didn’t give me the flexibility I wanted without paywalls. I built W-Tracker to make logging simple while keeping the tracker tailored to how I train.',
    features: [
      'Log workouts and review recent sessions.',
      'Track bodyweight and weekly activity over time.',
      'Compare training volume and sets by muscle group.',
      'View routines, upcoming workouts, and workout history.',
      'Ask the Coach questions about your training data.',
    ],
    detailCaption: 'The Coach can break down training volume and set distribution by muscle group.',
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
    previewImage: '/projects/examgen-upload.png',
    detailImages: ['/projects/examgen-question.png'],
    summary: 'A Gemini-powered tool for creating interactive practice exams.',
    overview: 'Examgen is a passion project that uses Gemini to create interactive practice exams. Users can enter their answers and view AI-generated solutions.',
    workflow: [
      { title: 'Upload an exam', description: 'Add an exam PDF. A solutions or syllabus PDF is optional.' },
      { title: 'Generate practice questions', description: 'Use Gemini to create a mock exam and AI practice solutions from the uploaded material.' },
      { title: 'Answer the questions', description: 'Choose a question from the list on the left, write an answer, and track your progress.' },
      { title: 'Review the solution', description: 'Reveal the AI answer to compare its explanation and code with your own. It is a practice answer, not an official answer key.' },
    ],
    origin: 'I started it to learn how to build AI workflows. It’s still unfinished because of the time involved, but I plan to complete it.',
    detailCaption: 'Practice view: questions and progress on the left; the answer field and AI-generated solution on the right.',
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
    detailCaption: 'The editable closing report can be copied to Teams.',
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
