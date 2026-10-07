export default function AboutSection() {
  return (
    <section className="about-section" id="about" aria-labelledby="about-heading">
      <div className="about-inner">
        <div className="about-content">
          <h2 id="about-heading">A bit about me<span>.</span></h2>
          <p className="about-lead">Hi, I’m Felix. I’m 21 and studying computer science. I’ve been interested in computers for as long as I can remember.</p>
          <a className="work-link" href="https://github.com/Felixpj8h" target="_blank" rel="noopener noreferrer">Find me on GitHub <span aria-hidden="true">↗</span></a>
          <div className="about-more">
            <div>
              <h3>Why programming?</h3>
              <p>I like being able to take an idea and build it myself. There’s a lot to figure out along the way, but that’s part of what I enjoy about it.</p>
            </div>
            <div>
              <h3>Other interests</h3>
              <p>Outside of coding, I spend time lifting weights, practicing guitar, and walking my dog.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
