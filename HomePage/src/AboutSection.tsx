export default function AboutSection() {
  return (
    <section className="about-section" id="about" aria-labelledby="about-heading">
      <div className="about-inner">
        <p className="eyebrow"><span>03</span> About</p>
        <div className="about-content">
          <h2 id="about-heading">A bit about me<span>.</span></h2>
          <p className="about-lead">I’m Felix Johannessen, a 21-year-old CS student who’s been curious about computers and technology for as long as I can remember.</p>
          <div className="about-more">
            <div>
              <h3>What keeps me building</h3>
              <p>I love programming because an idea can become something real. I’m always excited to try new approaches, solve problems, and learn along the way.</p>
            </div>
            <div>
              <h3>Outside the screen</h3>
              <p>When I’m not coding, you’ll usually find me weight training, practicing guitar, or out walking my dog.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
