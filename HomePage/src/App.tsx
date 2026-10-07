import { useEffect, useState } from 'react'
import SolarSystemScene from './SolarSystemScene'
import type { FocusTarget } from './SolarSystemScene'
import ProjectsSection from './ProjectsSection'
import AboutSection from './AboutSection'
import './App.css'

function App() {
  const [paused, setPaused] = useState(false)
  const [labels, setLabels] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [focus, setFocus] = useState<FocusTarget | null>(null)
  const [returningHome, setReturningHome] = useState(false)

  const focusPlanet = (target: FocusTarget) => {
    setReturningHome(false)
    setFocus(target)
  }

  const clearFocus = () => {
    if (!focus) return
    setFocus(null)
    setReturningHome(true)
  }

  useEffect(() => {
    if (!focus) return
    const exitOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setFocus(null)
      setReturningHome(true)
    }
    window.addEventListener('keydown', exitOnEscape)
    return () => window.removeEventListener('keydown', exitOnEscape)
  }, [focus])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (media.matches) setPaused(true)
  }, [])

  return (
    <main className="site">
    <section className="experience" id="home" aria-label="Introduction">
      <SolarSystemScene paused={paused} labels={labels} focus={focus} returningHome={returningHome} onFocus={focusPlanet} onExitFocus={clearFocus} onReturnComplete={() => setReturningHome(false)} />
      <div className="cosmic-haze" />

      <header className="topbar">
        <a className="wordmark" href="#home" aria-label="Felix Johannessen, home">FJ<span>.</span></a>
        <button type="button" className="menu-toggle" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span /><span /></button>
        <nav className={menuOpen ? 'nav nav-open' : 'nav'} aria-label="Primary navigation">
          <a className="active" href="#home" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#projects" onClick={() => { setMenuOpen(false); clearFocus() }}>Projects</a>
          <a href="#about" onClick={() => { setMenuOpen(false); clearFocus() }}>About</a>
          <a href="https://www.linkedin.com/in/felix-johannessen-83bb85258/" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>
      </header>

      <div className="hero-copy">
        <h1>Felix<br />Johannessen</h1>
        <p className="About">Hi, I’m Felix, a third year computer science student at the University of Bergen. I enjoy building things and solving problems.</p>
        <a className="work-link" href="#projects" onClick={clearFocus}>Explore my projects <span aria-hidden="true">↗</span></a>
      </div>

      <aside className="scene-controls" aria-label="Solar system controls">
        <div>
          <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused}>{paused ? 'Play' : 'Pause'}</button>
          <button type="button" onClick={() => setLabels((value) => !value)} aria-pressed={labels}>{labels ? 'Hide names' : 'Show names'}</button>
          {focus && <button type="button" className="focus-exit" onClick={clearFocus}>Exit focus · Esc</button>}
        </div>
      </aside>

    </section>
    <ProjectsSection />
    <AboutSection />
    </main>
  )
}

export default App
