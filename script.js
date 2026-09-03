const menuToggle = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");
const navLinkItems = document.querySelectorAll(
  ".nav-links a, .nav-links button",
);
const contactDialog = document.querySelector("#contact-dialog");
const contactTriggers = document.querySelectorAll("[data-open-contact]");
const closeContact = document.querySelector("[data-close-contact]");
const contactForm = document.querySelector("#contact-form");
const formStatus = document.querySelector("#form-status");
const copyMessageButton = document.querySelector("#copy-message");
const projectsGrid = document.querySelector("#projects-grid");

const liveProjectUrls = {
  "Hello-Website-Blog": "https://urielfranco11.github.io/Hello-Website-Blog/",
  ai_challenge_level_03:
    "https://urielfranco11.github.io/ai_challenge_level_03/",
};

const renderProjects = (repositories) => {
  if (!projectsGrid) return;

  repositories.forEach((repo, index) => {
    const projectLink = document.createElement("a");
    projectLink.className = "project-card";
    if (index === 0) projectLink.classList.add("project-card-featured");
    projectLink.dataset.reveal = "";
    projectLink.classList.add("is-visible");
    projectLink.href = liveProjectUrls[repo.name];
    projectLink.target = "_blank";
    projectLink.rel = "noopener noreferrer";
    projectLink.setAttribute("aria-label", `Abrir proyecto ${repo.name}`);

    const overlay = document.createElement("div");
    overlay.className = "project-overlay";

    const content = document.createElement("div");
    content.className = "project-content";

    const projectNumber = document.createElement("span");
    projectNumber.textContent = `${String(index + 1).padStart(2, "0")} / GitHub`;

    const projectName = document.createElement("h3");
    projectName.textContent = repo.name;

    const projectDescription = document.createElement("p");
    projectDescription.textContent =
      repo.description || "Proyecto desarrollado por Uriel Franco.";

    const arrow = document.createElement("span");
    arrow.className = "project-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";

    content.append(projectNumber, projectName, projectDescription);
    projectLink.append(overlay, content, arrow);
    projectsGrid.append(projectLink);
  });

  projectsGrid.setAttribute("aria-busy", "false");
};

const loadProjects = async () => {
  if (!projectsGrid) return;

  try {
    const response = await fetch(
      "https://api.github.com/users/UrielFranco11/repos",
    );
    if (!response.ok) throw new Error("No se pudieron cargar los proyectos.");

    const repositories = await response.json();
    const selectedRepositories = repositories.filter((repo) =>
      Object.hasOwn(liveProjectUrls, repo.name),
    );
    renderProjects(selectedRepositories);
  } catch {
    projectsGrid.setAttribute("aria-busy", "false");
    projectsGrid.innerHTML =
      '<p class="projects-status">No se pudieron cargar los proyectos.</p>';
  }
};

loadProjects();

document.querySelector("#year").textContent = new Date().getFullYear();

menuToggle?.addEventListener("click", () => {
  const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
  menuToggle.setAttribute("aria-expanded", String(!isOpen));
  navLinks.classList.toggle("is-open", !isOpen);
});

navLinkItems.forEach((item) => {
  item.addEventListener("click", () => {
    menuToggle?.setAttribute("aria-expanded", "false");
    navLinks?.classList.remove("is-open");
  });
});

const openContactDialog = () => {
  if (!contactDialog) return;
  if (typeof contactDialog.showModal === "function") {
    contactDialog.showModal();
  } else {
    contactDialog.setAttribute("open", "");
  }
  window.setTimeout(() => contactDialog.querySelector("input")?.focus(), 120);
};

const closeContactDialog = () => {
  if (!contactDialog) return;
  if (typeof contactDialog.close === "function") {
    contactDialog.close();
  } else {
    contactDialog.removeAttribute("open");
  }
};

contactTriggers.forEach((trigger) =>
  trigger.addEventListener("click", openContactDialog),
);
closeContact?.addEventListener("click", closeContactDialog);

contactDialog?.addEventListener("click", (event) => {
  const dialogBounds = contactDialog.getBoundingClientRect();
  const clickedOutside =
    event.clientX < dialogBounds.left ||
    event.clientX > dialogBounds.right ||
    event.clientY < dialogBounds.top ||
    event.clientY > dialogBounds.bottom;

  if (clickedOutside) closeContactDialog();
});

document.querySelectorAll("[data-flip-card]").forEach((card) => {
  card.addEventListener("click", () => {
    const flipped = card.classList.toggle("is-flipped");
    card.setAttribute("aria-pressed", String(flipped));
  });
});

const createMessage = () => {
  if (!contactForm || !contactForm.checkValidity()) return null;

  const data = new FormData(contactForm);
  return [
    `Hola Uriel, mi nombre es ${data.get("name")}.`,
    "",
    `Correo para responder: ${data.get("email")}`,
    `Proyecto: ${data.get("service")}`,
    "",
    "Mensaje:",
    data.get("message"),
  ].join("\n");
};

const copyMessage = async () => {
  const message = createMessage();
  if (!message) {
    contactForm?.reportValidity();
    return false;
  }

  try {
    await navigator.clipboard.writeText(message);
    formStatus.textContent = "Mensaje copiado. Puedes pegarlo donde prefieras.";
    return true;
  } catch {
    formStatus.textContent =
      "No se pudo copiar automáticamente. Selecciona el texto desde tu correo.";
    return false;
  }
};

copyMessageButton?.addEventListener("click", copyMessage);

contactForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const message = createMessage();
  if (!message) {
    contactForm.reportValidity();
    return;
  }

  const recipient = document.documentElement.dataset.contactEmail?.trim();
  const isConfigured =
    recipient && !recipient.includes("TU_CORREO@EJEMPLO.COM");

  if (!isConfigured) {
    formStatus.textContent =
      "Falta configurar el correo de recepción en index.html antes de publicar el portafolio.";
    return;
  }

  const submitButton = contactForm.querySelector('[type="submit"]');
  const formData = new FormData(contactForm);
  formData.append("_subject", `Nueva consulta de ${formData.get("name")}`);
  formData.append("_template", "table");
  formData.append("_captcha", "false");

  submitButton.disabled = true;
  formStatus.textContent = "Enviando tu mensaje…";

  fetch(`https://formsubmit.co/ajax/${encodeURIComponent(recipient)}`, {
    method: "POST",
    body: formData,
    headers: { Accept: "application/json" },
  })
    .then((response) => {
      if (!response.ok) throw new Error("No se pudo enviar el formulario.");
      contactForm.reset();
      formStatus.textContent = "¡Gracias! Tu mensaje llegó correctamente.";
    })
    .catch(() => {
      const subject = encodeURIComponent(
        `Nueva consulta de ${formData.get("name")}`,
      );
      const body = encodeURIComponent(message);
      window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
      formStatus.textContent =
        "No hubo conexión con el formulario. Abrimos tu correo como alternativa.";
    })
    .finally(() => {
      submitButton.disabled = false;
    });
});

const revealItems = document.querySelectorAll("[data-reveal]");

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.13 },
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
