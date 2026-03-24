import { AnimatePresence, motion } from 'framer-motion'
import { useUIStore } from '../store/uiStore'

export default function ProjectDetail() {
  const activeProject = useUIStore((s) => s.activeProject)
  const clearActiveProject = useUIStore((s) => s.clearActiveProject)

  return (
    <AnimatePresence>
      {activeProject && (
        <motion.div
          className="project-panel"
          initial={{ x: 420 }}
          animate={{ x: 0 }}
          exit={{ x: 420 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <button
            className="project-panel-close"
            onClick={clearActiveProject}
          >
            ×
          </button>
          <h2>{activeProject.title}</h2>
          <p className="tagline">{activeProject.tagline}</p>
          <p className="description">{activeProject.description}</p>
          <div className="tech-tags">
            {activeProject.tech.map((t) => (
              <span key={t} className="tech-tag">{t}</span>
            ))}
          </div>
          <div className="links">
            {activeProject.links.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                → {link.label}
              </a>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
