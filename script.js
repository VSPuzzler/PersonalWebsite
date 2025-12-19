function toggleMenu() {
  const menu = document.querySelector(".menu-links");
  const icon = document.querySelector(".hamburger-icon");
  menu.classList.toggle("open");
  icon.classList.toggle("open");
}

// Sticky Navbar / Pillbox effect
window.addEventListener("scroll", function () {
  const navs = document.querySelectorAll("nav");
  const scrollPosition = window.scrollY;

  navs.forEach((nav) => {
    // Trigger slightly earlier for a more gradual feel
    if (scrollPosition > 20) {
      nav.classList.add("scrolled");
    } else {
      nav.classList.remove("scrolled");
    }
  });
});
