export type Publication = {
  title: string;
  authors: string;
  venue: string;
  year: number;
  links?: { label: string; href: string }[];
};

export type Project = {
  title: string;
  description: string;
  status?: string;
  href?: string;
};

export const siteContent = {
  identity: {
    initials: "YC",
    name: "Your Name",
    role: "Researcher · Builder · Artist",
    location: "Based somewhere between a laboratory and the stars",
    email: "you@example.com",
    portrait: "",
  },
  links: [
    { label: "CV", href: "#" },
    { label: "Google Scholar", href: "#" },
    { label: "GitHub", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "X", href: "#" },
  ],
  about: [
    "Write a short introduction here: what you study, what you build, and the questions that keep pulling you forward.",
    "This second paragraph can connect your scientific work with music, visual art, writing, photography, or anything else that belongs in your personal universe.",
  ],
  currentQuestion: "What is the question you are most curious about right now?",
  news: [
    { date: "2026", text: "Add a recent publication, project launch, exhibition, album, or life update." },
    { date: "2025", text: "Add another milestone. This list can grow without changing the page layout." },
  ],
  publications: [
    {
      title: "Your Published Paper Title",
      authors: "Your Name, Collaborator One, Collaborator Two",
      venue: "Journal or Conference",
      year: 2026,
      links: [{ label: "paper", href: "#" }, { label: "code", href: "#" }],
    },
    {
      title: "Another Paper Lives Here",
      authors: "Your Name et al.",
      venue: "Journal or Conference",
      year: 2025,
      links: [{ label: "paper", href: "#" }],
    },
  ] satisfies Publication[],
  research: [
    { title: "Research Project One", description: "A concise explanation of the problem, your approach, and why it matters.", status: "Ongoing" },
    { title: "Research Project Two", description: "Add methods, collaborators, results, or a link to the full project.", status: "Published" },
  ] satisfies Project[],
  products: [
    { title: "Open-source Project", description: "What it does, who it helps, and what you learned while building it.", href: "#" },
    { title: "Independent Product", description: "A product, startup experiment, tool, or strange prototype worth sharing.", href: "#" },
  ] satisfies Project[],
  creative: [
    { category: "Music", title: "Album / Composition", note: "Add listening links and the story behind the work." },
    { category: "Visual Art", title: "Paintings & Illustrations", note: "Add a selection of paintings, drawings, and visual experiments." },
    { category: "Writing", title: "Fiction & Children's Books", note: "Drafts can stay hidden until you are ready to publish them." },
    { category: "Photography", title: "Mountain Light", note: "A photographic collection of snow mountains, travel, and memory." },
  ],
};

export type SiteContent = typeof siteContent;
