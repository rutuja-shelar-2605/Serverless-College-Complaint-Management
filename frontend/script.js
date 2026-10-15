// CASAS Complaint Portal
// The API URL is the existing HTTP API from the project notes.
// This frontend is not production-ready until API responses, CORS and access control are tested.

const API_BASE = "https://kiqrjrhubl.execute-api.ap-south-1.amazonaws.com";

const complaintForm = document.getElementById("complaintForm");
const formMessage = document.getElementById("formMessage");
const submitButton = document.getElementById("submitButton");
const trackForm = document.getElementById("trackForm");
const trackMessage = document.getElementById("trackMessage");
const trackButton = document.getElementById("trackButton");
const trackResult = document.getElementById("trackResult");

function showMessage(element, text, type = "info") {
  element.textContent = text;
  element.className = `message-box ${type}`;
  element.hidden = false;
}

function clearMessage(element) {
  element.textContent = "";
  element.className = "message-box";
  element.hidden = true;
}

function parseResponseBody(data) {
  // Handles API Gateway Lambda proxy responses and already-parsed objects.
  if (data && typeof data.body === "string") {
    try { return JSON.parse(data.body); } catch { return { message: data.body }; }
  }
  if (data && typeof data.body === "object" && data.body !== null) return data.body;
  return data || {};
}

function getErrorText(payload, fallback) {
  return payload?.message || payload?.error || payload?.detail || fallback;
}

complaintForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage(formMessage);

  if (!complaintForm.reportValidity()) return;

  const formData = new FormData(complaintForm);
  const payload = {
    student_name: String(formData.get("student_name") || "").trim(),
    department: String(formData.get("department") || "").trim(),
    category: String(formData.get("category") || "").trim(),
    location: String(formData.get("location") || "").trim(),
    description: String(formData.get("description") || "").trim()
  };

  if (!payload.student_name || !payload.department || !payload.category || payload.description.length < 8) {
    showMessage(formMessage, "Please complete the required fields and provide a little more detail.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.innerHTML = "Submitting…";

  try {
    const response = await fetch(`${API_BASE}/complaints`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const raw = await response.json().catch(() => ({}));
    const data = parseResponseBody(raw);

    if (!response.ok) {
      throw new Error(getErrorText(data, `Request failed (HTTP ${response.status}).`));
    }

    const complaintId = data.complaint_id || data.complaintId || data.id || data.ticket_id;
    if (complaintId) {
      document.getElementById("complaintId").value = complaintId;
      showMessage(
        formMessage,
        `Complaint submitted. Your Complaint ID is ${complaintId}. Save this ID to track the status.`,
        "success"
      );
    } else {
      showMessage(
        formMessage,
        "The API returned a successful response, but no Complaint ID field was found. Check the response format in Lambda before using this for live submissions.",
        "info"
      );
    }

    complaintForm.reset();
  } catch (error) {
    console.error("Complaint submission error:", error);
    showMessage(
      formMessage,
      `Could not submit the complaint. ${error.message || "Check API availability and CORS settings."} No success is being assumed.`,
      "error"
    );
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = 'Submit complaint <span>↗</span>';
  }
});

trackForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearMessage(trackMessage);
  trackResult.hidden = true;

  const complaintId = document.getElementById("complaintId").value.trim();
  if (!complaintId) {
    showMessage(trackMessage, "Enter your Complaint ID first.", "error");
    return;
  }

  trackButton.disabled = true;
  trackButton.innerHTML = "Checking…";

  try {
    const response = await fetch(`${API_BASE}/complaints/${encodeURIComponent(complaintId)}`, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    const raw = await response.json().catch(() => ({}));
    const data = parseResponseBody(raw);

    if (!response.ok) {
      throw new Error(getErrorText(data, response.status === 404 ? "No complaint was found for that ID." : `Request failed (HTTP ${response.status}).`));
    }

    const record = data.complaint || data.item || data;
    const id = record.complaint_id || record.complaintId || record.id || complaintId;
    const status = record.status || record.complaint_status || "Status field not returned";
    const category = record.category || "Not provided by API";
    const description = record.description || "Not provided by API";

    trackResult.replaceChildren();
    const heading = document.createElement("h4");
    heading.textContent = "Complaint details";
    trackResult.appendChild(heading);

    const rows = [
      ["Complaint ID", id],
      ["Status", status],
      ["Category", category],
      ["Description", description]
    ];

    rows.forEach(([label, value]) => {
      const row = document.createElement("div");
      row.className = "result-line";
      const left = document.createElement("span");
      left.textContent = label;
      const right = document.createElement("span");
      right.textContent = String(value);
      if (label === "Status") {
        const badge = document.createElement("span");
        badge.className = "status-badge";
        badge.textContent = String(value);
        right.replaceChildren(badge);
      }
      row.append(left, right);
      trackResult.appendChild(row);
    });

    trackResult.hidden = false;
    showMessage(trackMessage, "Status retrieved from the API response.", "success");
  } catch (error) {
    console.error("Complaint tracking error:", error);
    showMessage(
      trackMessage,
      `Could not retrieve this complaint. ${error.message || "Check API availability and CORS settings."}`,
      "error"
    );
  } finally {
    trackButton.disabled = false;
    trackButton.innerHTML = 'Check status <span>→</span>';
  }
});

// Mobile navigation
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

menuToggle.addEventListener("click", () => {
  const isOpen = mainNav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

mainNav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    mainNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  });
});

// Staff/HOD authentication is intentionally not simulated in browser JavaScript.
// Configure Amazon Cognito + API Gateway JWT authorizer and role-based backend checks
// before enabling complaint-list or status-update controls.
