import { useState } from 'react'
import { projects } from './projects'
import type { Project } from './projects'

function ProjectPreview({ project, number, detail = false }: { project: Project; number: string; detail?: boolean }) {
  const image = project.previewImage

  return (
    <div className={`project-preview${detail ? ' project-preview-detail' : ''}`}>
      {image ? (
        <img src={image} alt={`${project.title} project preview`} loading="lazy" />
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

function ProjectDetails({ project, number }: { project: Project; number: string }) {
  return (
    <div className="project-details" id={`${project.id}-details`} role="region" aria-labelledby={`${project.id}-title`}>
      <div className="project-details-content">
        <div className="detail-block">
          <h4>Overview</h4>
          <p>{project.overview}</p>
        </div>
        <div className="detail-block">
          <h4>My role</h4>
          <p>{project.role}</p>
        </div>
        <div className="detail-block">
          <h4>Highlights</h4>
          <ul>{project.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}</ul>
        </div>
        {(project.liveUrl || project.codeUrl) && (
          <div className="project-links">
            {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">Live project ↗</a>}
            {project.codeUrl && <a href={project.codeUrl} target="_blank" rel="noopener noreferrer">View code ↗</a>}
          </div>
        )}
      </div>
      <div className="project-detail-gallery">
        {project.detailImages?.length
          ? project.detailImages.map((image, index) => (
            <div className="project-preview project-preview-detail" key={image}>
              <img src={image} alt={`${project.title} detail ${index + 1}`} loading="lazy" />
            </div>
          ))
          : <ProjectPreview project={project} number={number} detail />}
      </div>
    </div>
  )
}

export default function ProjectsSection() {
  const [openProject, setOpenProject] = useState<string | null>(null)

  return (
    <section className="projects-section" id="projects" aria-labelledby="projects-heading">
      <div className="projects-inner">
        <div className="projects-intro">
          <p className="eyebrow"><span>02</span> Selected work</p>
          <div className="projects-intro-row">
            <h2 id="projects-heading">Projects<span>.</span></h2>
            <p>A selection of things I’ve made. More about each project is on its way.</p>
          </div>
        </div>

        <div className="projects-list">
          {projects.map((project, index) => {
            const number = String(index + 1).padStart(2, '0')
            const isOpen = openProject === project.id

            return (
              <article key={project.id} className={`project-entry ${project.featured ? 'project-featured' : 'project-compact'}`}>
                <div className="project-main">
                  <ProjectPreview project={project} number={number} />
                  <div className="project-copy">
                    <span className="project-number">{number} / {project.featured ? 'Featured' : 'More work'}</span>
                    <h3 id={`${project.id}-title`}>{project.title}</h3>
                    <p>{project.summary}</p>
                    <button
                      type="button"
                      className="project-toggle"
                      aria-expanded={isOpen}
                      aria-controls={`${project.id}-details`}
                      onClick={() => setOpenProject(isOpen ? null : project.id)}
                    >
                      {isOpen ? 'Close details' : 'View details'} <span aria-hidden="true">{isOpen ? '−' : '↗'}</span>
                    </button>
                  </div>
                </div>
                <div hidden={!isOpen}>
                  <ProjectDetails project={project} number={number} />
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
