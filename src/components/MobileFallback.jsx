import { motion } from 'framer-motion'
import { hero, projects, skills, about, contact } from '../config/content'

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-50px' },
  transition: { duration: 0.6 },
}

export default function MobileFallback() {
  return (
    <div className="mobile-fallback">
      <motion.section {...fadeIn}>
        <h1>{hero.name}</h1>
        <p style={{ color: '#00ff41', marginBottom: '0.5rem' }}>{hero.tagline}</p>
        <p>{hero.subtitle}</p>
      </motion.section>

      <motion.section {...fadeIn}>
        <h2>Projects</h2>
        {projects.map((p) => (
          <div key={p.id} className="mobile-project-card">
            <h3 style={{ color: p.color }}>{p.title}</h3>
            <p style={{ marginBottom: '0.5rem' }}>{p.tagline}</p>
            <p style={{ color: '#e0e0e0', fontSize: '0.85rem' }}>{p.description}</p>
          </div>
        ))}
      </motion.section>

      <motion.section {...fadeIn}>
        <h2>Skills</h2>
        <div className="mobile-skill-grid">
          {skills.map((s) => (
            <span key={s.name} className="mobile-skill-pill">{s.name}</span>
          ))}
        </div>
      </motion.section>

      <motion.section {...fadeIn}>
        <h2>About</h2>
        {about.bio.split('\n').filter(Boolean).map((line, i) => (
          <p key={i} style={{ marginBottom: '0.5rem' }}>{line}</p>
        ))}
      </motion.section>

      <motion.section {...fadeIn}>
        <h2>{contact.heading}</h2>
        <p style={{ marginBottom: '1rem' }}>{contact.subheading}</p>
        <div className="mobile-contact-links">
          {contact.links.map((link) => (
            <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
              → {link.label}
            </a>
          ))}
        </div>
      </motion.section>
    </div>
  )
}
