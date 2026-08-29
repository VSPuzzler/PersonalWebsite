/* ========================================
   Mini Projects - project list
   Add a new entry to this array to add a card.
   ======================================== */

const PROJECTS = [
  {
    title: "Claude Artifact",
    blurb: "An interactive artifact built with Claude, running live in the browser.",
    url: "https://claude.ai/public/artifacts/bef6759c-e76d-48de-aa20-c26c313fe15d",
    icon: "fa-solid fa-wand-magic-sparkles",
    tags: ["claude", "interactive"],
  },
];

/* ======================================== */

const grid = document.getElementById("project-grid");

function buildCard(project, index) {
  const card = document.createElement("a");
  card.className = "card";
  card.href = project.url;
  card.style.setProperty("--delay", `${index * 60}ms`);

  if (/^https?:/.test(project.url)) {
    card.target = "_blank";
    card.rel = "noopener";
  }

  const tags = (project.tags || [])
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join("");

  card.innerHTML = `
    <div class="card-titlebar">
      <span class="dots"><i></i><i></i><i></i></span>
      <span class="card-index">${String(index + 1).padStart(2, "0")}</span>
    </div>
    <div class="card-body">
      <div class="card-icon"><i class="${project.icon}"></i></div>
      <h2 class="card-title">${project.title}</h2>
      <p class="card-blurb">${project.blurb}</p>
      <div class="card-tags">${tags}</div>
    </div>
    <div class="card-footer">
      <span>open</span>
      <i class="fa-solid fa-arrow-right"></i>
    </div>
  `;

  return card;
}

PROJECTS.forEach((project, i) => grid.appendChild(buildCard(project, i)));

if (PROJECTS.length === 0) {
  grid.innerHTML = '<p class="empty">Nothing here yet. Check back soon.</p>';
}
