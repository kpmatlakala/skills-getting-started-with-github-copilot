document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

// Fetch activities and render activity cards with participants list

(async function () {
  // Helper to create elements
  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else node.setAttribute(k, v);
    }
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (typeof c === "string") node.appendChild(document.createTextNode(c));
      else if (c instanceof Node) node.appendChild(c);
    });
    return node;
  }

  // Find container: prefer #activities, fallback to first <main>
  const container =
    document.getElementById("activities") ||
    document.querySelector("main") ||
    document.body;

  // Small title if using main as container
  if (container.tagName.toLowerCase() === "main" && !container.querySelector(".activities-wrapper")) {
    const wrapper = el("div", { class: "activities-wrapper" });
    container.appendChild(wrapper);
  }

  const target = container.querySelector(".activities-wrapper") || container;

  try {
    const res = await fetch("/activities");
    if (!res.ok) throw new Error("Failed to load activities");
    const activities = await res.json();

    // Clear target
    target.innerHTML = "";

    Object.entries(activities).forEach(([name, info]) => {
      const card = el("article", { class: "activity-card" });

      card.appendChild(el("h4", { text: name }));
      if (info.description) {
        card.appendChild(el("p", { text: info.description }));
      }
      if (info.schedule) {
        card.appendChild(el("p", { text: "Schedule: " + info.schedule }));
      }

      // Participants section
      const participantsWrap = el("div", { class: "participants" });
      const headerText = "Participants";
      const header = el("h5", { text: headerText });

      // optional max participants indicator
      if (typeof info.max_participants === "number") {
        const maxSpan = el("span", { class: "max-participants", text: ` (${(info.participants||[]).length}/${info.max_participants})` });
        header.appendChild(maxSpan);
      }

      participantsWrap.appendChild(header);

      const ul = el("ul");
      const participants = Array.isArray(info.participants) ? info.participants : [];

      if (participants.length === 0) {
        // show a subtle message if no participants
        const li = el("li", { text: "No participants yet" });
        li.classList.add("info");
        ul.appendChild(li);
      } else {
        participants.forEach(p => {
          const li = el("li", { text: p });
          ul.appendChild(li);
        });
      }

      participantsWrap.appendChild(ul);
      card.appendChild(participantsWrap);

      target.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    const msg = el("div", { class: "message error", text: "Unable to load activities." });
    target.appendChild(msg);
  }
})();
