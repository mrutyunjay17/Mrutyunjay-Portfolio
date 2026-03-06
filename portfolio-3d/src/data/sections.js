function createSubSections(sectionId) {
  return [
    {
      id: `${sectionId}-sub-1`,
      heading: "Insight 01",
      description: "Placeholder content for this corner panel. Replace with section-specific details.",
    },
    {
      id: `${sectionId}-sub-2`,
      heading: "Insight 02",
      description: "Placeholder content for this corner panel. Replace with section-specific details.",
    },
    {
      id: `${sectionId}-sub-3`,
      heading: "Insight 03",
      description: "Placeholder content for this corner panel. Replace with section-specific details.",
    },
    {
      id: `${sectionId}-sub-4`,
      heading: "Insight 04",
      description: "Placeholder content for this corner panel. Replace with section-specific details.",
    },
  ]
}

export const sections = [
  {
    id: "about",
    title: "About",
    subtitle: "The developer behind the build",
    body: "I design and ship immersive web experiences that balance visual ambition with product clarity and performance.",
    cta: { label: "Read Story", href: "#about" },
    checkpointT: 0.05,
    subSections: createSubSections("about"),
  },
  {
    id: "experience",
    title: "Experience",
    subtitle: "Systems, teams, and delivery",
    body: "From frontend architecture to polished interaction design, I have delivered production-grade interfaces across fast-moving teams.",
    cta: { label: "View Timeline", href: "#experience" },
    checkpointT: 0.18,
    subSections: createSubSections("experience"),
  },
  {
    id: "projects",
    title: "Projects",
    subtitle: "Selected product work",
    body: "A curated set of work across UI engineering, 3D interaction, and performance-focused implementation details.",
    cta: { label: "Open Projects", href: "#projects" },
    checkpointT: 0.32,
    subSections: createSubSections("projects"),
  },
  {
    id: "skills",
    title: "Skills",
    subtitle: "Tools and technical range",
    body: "JavaScript, React, Three.js, motion systems, and pragmatic architecture choices that scale from prototype to production.",
    cta: { label: "See Stack", href: "#skills" },
    checkpointT: 0.45,
    subSections: createSubSections("skills"),
  },
  {
    id: "architecture",
    title: "Architecture",
    subtitle: "How this portfolio is engineered",
    body: "A modular render pipeline with scroll-driven camera control, reusable spline sampling utilities, and UI state synchronization.",
    cta: { label: "Explore System", href: "#architecture" },
    checkpointT: 0.6,
    subSections: createSubSections("architecture"),
  },
  {
    id: "achievements",
    title: "Achievements",
    subtitle: "Impact and milestones",
    body: "Highlights from shipped outcomes: performance wins, UX improvements, and product features that moved business metrics.",
    cta: { label: "View Results", href: "#achievements" },
    checkpointT: 0.8,
    subSections: createSubSections("achievements"),
  },
  {
    id: "contact",
    title: "Contact",
    subtitle: "Let us build something memorable",
    body: "Open to collaboration, consulting, and full-time opportunities where craft, product thinking, and engineering rigor matter.",
    cta: { label: "Start Conversation", href: "#contact" },
    checkpointT: 0.95,
    subSections: createSubSections("contact"),
  },
]
