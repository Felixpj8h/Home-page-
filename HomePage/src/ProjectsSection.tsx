import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { projects } from './projects'
import type { Project } from './projects'

type OpenImage = (src: string, alt: string, trigger: HTMLButtonElement) => void
type ExpandedImage = { src: string; alt: string; trigger: HTMLButtonElement }

function ProjectPreview({ project, number, onExpand, detail = false }: { project: Project; number: string; onExpand: OpenImage; detail?: boolean }) {
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

function ProjectDetails({ project, number, onExpand }: { project: Project; number: string; onExpand: OpenImage }) {
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
        {project.detailImages?.length
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
  const [expandedImage, setExpandedImage] = useState<ExpandedImage | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

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

  const closeImage = () => {
    if (!expandedImage) return
    expandedImage.trigger.focus()
    setExpandedImage(null)
  }

  useEffect(() => {
    if (!expandedImage) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButtonRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        expandedImage.trigger.focus()
        setExpandedImage(null)
      } else if (event.key === 'Tab') {
        event.preventDefault()
        closeButtonRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [expandedImage])

  const openImage: OpenImage = (src, alt, trigger) => setExpandedImage({ src, alt, trigger })

  return (
    <section className="projects-section" id="projects" aria-labelledby="projects-heading">
      <div className="projects-inner">
        <div className="projects-intro">
          <p className="eyebrow"><span>02</span> Selected work</p>
          <div className="projects-intro-row">
            <h2 id="projects-heading">Projects<span>.</span></h2>
            <p>A selection of things I’ve made.</p>
          </div>
        </div>

        <div className="projects-list">
          {projects.map((project, index) => {
            const number = String(index + 1).padStart(2, '0')
            const isOpen = openProject === project.id

            return (
              <article key={project.id} className={`project-entry ${project.featured ? 'project-featured' : 'project-compact'}`}>
                <div className="project-main">
                  <ProjectPreview project={project} number={number} onExpand={openImage} />
                  <div className="project-copy">
                    <span className="project-number">{number} / {project.featured ? 'Featured' : 'More work'}</span>
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
                  <ProjectDetails project={project} number={number} onExpand={openImage} />
                </div>
              </article>
            )
          })}
        </div>
      </div>
      {expandedImage && createPortal(
        <div className="image-lightbox" onMouseDown={(event) => { if (event.target === event.currentTarget) closeImage() }}>
          <div className="image-lightbox-dialog" role="dialog" aria-modal="true" aria-label={expandedImage.alt}>
            <button ref={closeButtonRef} type="button" className="image-lightbox-close" onClick={closeImage}>Close <span aria-hidden="true">×</span></button>
            <img src={expandedImage.src} alt={expandedImage.alt} />
            <p>{expandedImage.alt}</p>
          </div>
        </div>,
        document.body,
      )}
    </section>
  )
}
