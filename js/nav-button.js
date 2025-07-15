const toggleBtn = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

toggleBtn.addEventListener("click", () => {
  const isExpanded = toggleBtn.getAttribute("aria-expanded") === "true";
  toggleBtn.setAttribute("aria-expanded", String(!isExpanded));
  navLinks.classList.toggle("show");
});