import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { projects } from './projects'
import type { Project } from './projects'

type OpenMedia = (src: string, alt: string, trigger: HTMLButtonElement, kind?: 'image' | 'video') => void
type ExpandedMedia = { src: string; alt: string; trigger: HTMLButtonElement; kind: 'image' | 'video' }

function ProjectPreview({ project, number, onExpand, detail = false }: { project: Project; number: string; onExpand: OpenMedia; detail?: boolean }) {
  const image = project.previewImage
  const alt = `${project.title} project preview`

  return (
    <div className={`project-preview${detail ? ' project-preview-detail' : ''}`}>
      {image ? (
        <button type="button" className="project-image-button" aria-label={`Expand ${alt}`} onClick={(event) => onExpand(image, alt, event.currentTarget)}>
          <img src={image} alt={alt} loading="lazy" />
        </button>
      ) : (
        <div className="project-preview-placeholder" role="img" aria-label={`${project.title} image placeholder`}>
          <span className="preview-corner">{number} / {project.title}</span>
          <span className="preview-title" aria-hidden="true">{project.title}</span>
          <span className="preview-status">Image to be added</span>
        </div>
      )}
    </div>
  )
}

function ProjectLanguages({ project }: { project: Project }) {
  return (
    <div className="project-languages">
      <h4>Languages</h4>
      <div className="language-bar" role="img" aria-label={project.languages.map((language) => `${language.name} ${language.percent}%`).join(', ')}>
        {project.languages.map((language) => (
          <span key={language.name} style={{ width: `${language.percent}%`, backgroundColor: language.color }} />
        ))}
      </div>
      <ul className="language-list">
        {project.languages.map((language) => (
          <li key={language.name}>
            <span className="language-dot" style={{ backgroundColor: language.color }} aria-hidden="true" />
            <span>{language.name} <small>{language.percent}%</small></span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProjectDemoGallery({ project, onExpand }: { project: Project; onExpand: OpenMedia }) {
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const demos = project.detailDemos ?? []
  const demo = demos[index]
  if (!demo) return null

  const navigate = (direction: number) => {
    setIndex(current => (current + direction + demos.length) % demos.length)
    setLoading(true)
    setFailed(false)
  }
  const alt = `${project.title}: ${demo.label} demo`

  return (
    <div className="project-demo-gallery" role="region" aria-label={`${project.title} demos`} aria-roledescription={demos.length > 1 ? 'carousel' : undefined} onKeyDown={event => {
      if (demos.length > 1 && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
        event.preventDefault()
        navigate(event.key === 'ArrowLeft' ? -1 : 1)
      }
    }}>
      <div className="project-demo-stage" aria-busy={loading}>
        {loading && <span className="project-demo-status" role="status">Loading {demo.label} demo…</span>}
        {failed ? <span className="project-demo-status" role="status">This demo could not load. {demos.length > 1 ? 'Try the next one.' : 'Reopen the project details to try again.'}</span> : (
          <button type="button" className="project-image-button" aria-label={`Expand ${alt}`} disabled={loading} onClick={event => onExpand(demo.src, alt, event.currentTarget, 'video')}>
            <video key={demo.src} src={demo.src} aria-label={alt} autoPlay loop muted playsInline preload="metadata" onLoadedData={() => setLoading(false)} onError={() => { setLoading(false); setFailed(true) }} />
          </button>
        )}
      </div>
      <div className="project-demo-toolbar">
        <div className="project-demo-label" aria-live="polite" aria-atomic="true">
          <strong>{demo.label}</strong>{demos.length > 1 && <span>{index + 1} / {demos.length}</span>}
        </div>
        {demos.length > 1 && <div className="project-demo-arrows">
          <button type="button" aria-label="Previous demo" onClick={() => navigate(-1)}><span aria-hidden="true">←</span></button>
          <button type="button" aria-label="Next demo" onClick={() => navigate(1)}><span aria-hidden="true">→</span></button>
        </div>}
      </div>
      <p className="gallery-caption">{demo.caption}</p>
    </div>
  )
}
function ProjectDetails({ project, number, onExpand }: { project: Project; number: string; onExpand: OpenMedia }) {
  return (
    <div className={`project-details${project.workflow || project.features?.length ? ' project-details-explained' : ''}`} id={`${project.id}-details`} role="region" aria-labelledby={`${project.id}-title`}>
      <div className={`project-details-content${!project.workflow && !project.role && !project.highlights?.length ? ' project-details-single-copy' : ''}`}>
        {project.workflow || project.features?.length ? (
          <>
            <div className="detail-block project-overview">
              <h4>Project overview</h4>
              <p>{project.overview}</p>
            </div>
            {project.workflow && <div className="project-workflow">
              <h4>How it works</h4>
              <ol>
                {project.workflow.map((step, index) => (
                  <li key={step.title}>
                    <span className="workflow-number">{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <h5>{step.title}</h5>
                      <p>{step.description}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>}
            {project.features?.length ? (
              <div className="project-features">
                <h4>Features</h4>
                <ul>{project.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
              </div>
            ) : null}
            {project.origin && <p className="project-origin">{project.origin}</p>}
          </>
        ) : (
          <>
            <div className="detail-block">
              <h4>Overview</h4>
              <p>{project.overview}</p>
            </div>
            {project.role && (
              <div className="detail-block">
                <h4>My role</h4>
                <p>{project.role}</p>
              </div>
            )}
            {project.highlights?.length ? (
              <div className="detail-block">
                <h4>Highlights</h4>
                <ul>{project.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
              </div>
            ) : null}
          </>
        )}
      </div>
      <div className="project-detail-gallery">
        {project.detailDemos?.length ? <ProjectDemoGallery project={project} onExpand={onExpand} /> : project.detailImages?.length
          ? project.detailImages.map((image, index) => (
            <div className="project-preview project-preview-detail project-preview-detail-image" key={image}>
              <button type="button" className="project-image-button" aria-label={`Expand ${project.title} detail image ${index + 1}`} onClick={(event) => onExpand(image, `${project.title} detail image ${index + 1}`, event.currentTarget)}>
                <img src={image} alt={`${project.title} detail image ${index + 1}`} loading="lazy" />
              </button>
            </div>
          ))
          : <ProjectPreview project={project} number={number} onExpand={onExpand} detail />}
        {project.detailCaption && <p className="gallery-caption">{project.detailCaption}</p>}
      </div>
    </div>
  )
}

export default function ProjectsSection() {
  const [openProject, setOpenProject] = useState<string | null>(null)
  const [expandedMedia, setExpandedMedia] = useState<ExpandedMedia | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!openProject) return

    // Wait until the newly opened details are visible before measuring them.
    const frame = requestAnimationFrame(() => {
      document.getElementById(`${openProject}-details`)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'start',
      })
    })

    return () => cancelAnimationFrame(frame)
  }, [openProject])

  const closeMedia = () => {
    if (!expandedMedia) return
    expandedMedia.trigger.focus()
        void expandedMedia.trigger.querySelector('video')?.play().catch(() => undefined)
    setExpandedMedia(null)
  }

  useEffect(() => {
    if (!expandedMedia) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        expandedMedia.trigger.focus()
        void expandedMedia.trigger.querySelector('video')?.play().catch(() => undefined)
        setExpandedMedia(null)
      } else if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('button, video[controls], a[href], input, select, textarea, [tabindex="0"]')
        const first = focusable?.[0]
        const last = focusable?.[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [expandedMedia])

  const openMedia: OpenMedia = (src, alt, trigger, kind = 'image') => {
    trigger.querySelector('video')?.pause()
    setExpandedMedia({ src, alt, trigger, kind })
  }

  return (
    <section className="projects-section" id="projects" aria-labelledby="projects-heading">
      <div className="projects-inner">
        <div className="projects-intro">
          <div className="projects-intro-row">
            <h2 id="projects-heading">Projects<span>.</span></h2>
          </div>
        </div>

        <div className="projects-list">
          {projects.map((project, index) => {
            const number = String(index + 1).padStart(2, '0')
            const isOpen = openProject === project.id

            return (
              <article key={project.id} className={`project-entry ${project.featured ? 'project-featured' : 'project-compact'}`}>
                <div className="project-main">
                  <ProjectPreview project={project} number={number} onExpand={openMedia} />
                  <div className="project-copy">
                    <h3 id={`${project.id}-title`}>{project.title}</h3>
                    <p>{project.summary}</p>
                    <div className="project-actions">
                      <button
                      type="button"
                      className="project-toggle"
                      aria-expanded={isOpen}
                      aria-controls={`${project.id}-details`}
                      onClick={() => setOpenProject(isOpen ? null : project.id)}
                    >
                      {isOpen ? 'Close details' : 'View details'} <span aria-hidden="true">{isOpen ? '−' : '↗'}</span>
                      </button>
                      {project.codeUrl && <a className="project-toggle" href={project.codeUrl} target="_blank" rel="noopener noreferrer" aria-label={`View ${project.title} code on GitHub`}>View code <span aria-hidden="true">↗</span></a>}
                      {project.liveUrl && <a className="project-toggle" href={project.liveUrl} target="_blank" rel="noopener noreferrer">Live project <span aria-hidden="true">↗</span></a>}
                    </div>
                    <ProjectLanguages project={project} />
                  </div>
                </div>
                <div hidden={!isOpen}>
                  {isOpen && <ProjectDetails project={project} number={number} onExpand={openMedia} />}
                </div>
              </article>
            )
          })}
        </div>
      </div>
      {expandedMedia && createPortal(
        <div className="image-lightbox" onMouseDown={(event) => { if (event.target === event.currentTarget) closeMedia() }}>
          <div ref={dialogRef} className="image-lightbox-dialog" role="dialog" aria-modal="true" aria-label={expandedMedia.alt}>
            <button ref={closeButtonRef} type="button" className="image-lightbox-close" onClick={closeMedia}>Close <span aria-hidden="true">×</span></button>
            {expandedMedia.kind === 'video'
              ? <video src={expandedMedia.src} aria-label={expandedMedia.alt} autoPlay loop muted playsInline controls />
              : <img src={expandedMedia.src} alt={expandedMedia.alt} />}
            <p>{expandedMedia.alt}</p>
          </div>
        </div>,
        document.body,
      )}
    </section>
  )
}
