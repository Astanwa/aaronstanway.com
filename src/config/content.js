export const hero = {
  name: 'Abenezer Seifu',
  tagline: 'Full-Stack Developer & AI Engineer',
  subtitle: 'Building intelligent systems that see through the noise.',
}

export const projects = [
  {
    id: 'glitchd',
    title: 'GLitchd',
    tagline: 'AI-Generated Content Detector',
    description:
      'Real-time deepfake and AI-generated image/video detection. Chrome extension + API that scans content as you browse — Shazam for deepfakes.',
    tech: ['Python', 'PyTorch', 'CLIP', 'FastAPI', 'Chrome Extension', 'Swift'],
    color: '#00ff41',
    url: 'https://gltchd.net',
    links: [
      { label: 'Visit gltchd.net', url: 'https://gltchd.net' },
      { label: 'Chrome Web Store', url: '#' },
    ],
  },
  {
    id: 'openclaw',
    title: 'OpenClaw',
    tagline: 'AI-Powered Operations Dashboard',
    description:
      'Unified command center for managing AI agents, outreach campaigns, and project orchestration. Built with a terminal-inspired UI.',
    tech: ['React 19', 'FastAPI', 'SQLite', 'Claude API', 'Gmail API'],
    color: '#00bfff',
    links: [{ label: 'Dashboard', url: '#' }],
  },
  {
    id: 'realeyes',
    title: 'RealEyes API',
    tagline: 'Content Authenticity Verification',
    description:
      'REST API for AI content detection. CLIP-based feature extraction with custom MLP classifier. Rate-limited, key-authenticated, production-ready.',
    tech: ['Python', 'CLIP ViT-B/16', 'FastAPI', 'Docker', 'SQLite'],
    color: '#ff6b35',
    links: [{ label: 'API Reference', url: '#' }],
  },
  {
    id: 'lorenzo',
    title: 'Lorenzo',
    tagline: 'AI Engineering Agent',
    description:
      'Describe a part in plain English, get a stress-tested 3D model with real finite element analysis. Uses Blender for 3D modeling and CalculiX for FEA simulation — turning text into engineered, validated parts.',
    tech: ['Python', 'Blender 4.x', 'CalculiX', 'Gmsh', 'MCP Server'],
    color: '#f43f5e',
    links: [
      { label: 'GitHub', url: 'https://github.com/Astanwa/Blender-Physics-Agent-' },
    ],
  },
  {
    id: 'stable-collapse',
    title: 'StableCollapse',
    tagline: 'Quantum Computing Agent',
    description:
      'AI-powered quantum programming agent — "Cursor for Quantum Computing." Generates verified quantum circuits from natural language across Qiskit, Cirq, and PennyLane. Runs on IBM Quantum hardware with simulation verification.',
    tech: ['Python', 'Qiskit', 'Cirq', 'PennyLane', 'IBM Quantum', 'Claude API'],
    color: '#facc15',
    links: [
      { label: 'GitHub', url: 'https://github.com/Astanwa/Stable-Collapse-' },
    ],
  },
  {
    id: 'portfolio',
    title: 'This Portfolio',
    tagline: '3D Immersive Experience',
    description:
      'The site you\'re looking at right now. A scroll-driven 3D journey through space built with React Three Fiber, bloom shaders, and post-processing.',
    tech: ['React', 'Three.js', 'R3F', 'GLSL', 'Framer Motion'],
    color: '#c084fc',
    links: [{ label: 'Source Code', url: '#' }],
  },
]

export const skills = [
  { name: 'Python', category: 'language', level: 0.95 },
  { name: 'JavaScript', category: 'language', level: 0.9 },
  { name: 'TypeScript', category: 'language', level: 0.85 },
  { name: 'Swift', category: 'language', level: 0.7 },
  { name: 'React', category: 'frontend', level: 0.9 },
  { name: 'Three.js', category: 'frontend', level: 0.75 },
  { name: 'FastAPI', category: 'backend', level: 0.9 },
  { name: 'Node.js', category: 'backend', level: 0.8 },
  { name: 'PyTorch', category: 'ai', level: 0.85 },
  { name: 'CLIP', category: 'ai', level: 0.8 },
  { name: 'LLMs', category: 'ai', level: 0.9 },
  { name: 'Docker', category: 'devops', level: 0.8 },
  { name: 'Cloudflare', category: 'devops', level: 0.75 },
  { name: 'SQLite', category: 'backend', level: 0.85 },
  { name: 'Git', category: 'devops', level: 0.9 },
]

export const about = {
  bio: `I'm a full-stack developer and AI engineer focused on building tools that help people navigate an increasingly synthetic digital world. My work spans real-time AI detection systems, developer tooling, and immersive web experiences.\n\nCurrently building GLitchd — making AI-generated content instantly identifiable across every platform.`,
}

export const contact = {
  heading: "Let's Build Something",
  subheading: 'Open to collaborations, freelance work, and interesting conversations.',
  links: [
    { label: 'GitHub', url: 'https://github.com/Astanwa' },
    { label: 'LinkedIn', url: 'https://linkedin.com/' },
    { label: 'Email', url: 'mailto:hello@example.com' },
  ],
}

export const sections = ['Hero', 'Projects', 'Skills', 'About', 'Contact']
