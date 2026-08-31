/* ========================================
   Mini Projects - project list
   Add a new entry to this array to add a card.
   ======================================== */

const PROJECTS = [
  {
    title: "Gym Tracker",
    blurb: "Log workouts, track sets and reps, and watch lifts trend over time.",
    url: "https://claude.ai/public/artifacts/e6bcd0c7-6301-42ce-a7d0-616f918cca20",
    icon: "fa-solid fa-dumbbell",
    tags: ["fitness", "tracker"],
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
