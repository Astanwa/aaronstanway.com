import { useUIStore } from '../store/uiStore'
import { sections } from '../config/content'

export default function NavDots() {
  const currentSection = useUIStore((s) => s.currentSection)

  return (
    <div className="nav-dots">
      {sections.map((label, i) => (
        <div
          key={label}
          className={`nav-dot ${i === currentSection ? 'active' : ''}`}
        >
          <span className="nav-dot-label">{label}</span>
        </div>
      ))}
    </div>
  )
}
