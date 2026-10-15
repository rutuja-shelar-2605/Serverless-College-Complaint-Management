
const API_BASE = "https://kiqrjrhubl.execute-api.ap-south-1.amazonaws.com";

const tableBody = document.getElementById("complaintsTable");
const notice = document.getElementById("notice");
const refreshButton = document.getElementById("refreshButton");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const categoryFilter = document.getElementById("categoryFilter");
const resultCount = document.getElementById("resultCount");

let complaints = [];

function showNotice(message, isError = false) {
  notice.textContent = message;
  notice.hidden = false;
  notice.style.background = isError ? "#fff0f0" : "#f0f5ff";
  notice.style.color = isError ? "#a12626" : "#3470f5";
}

function getRecords(data) {
  if (typeof data.body === "string") {
    data = JSON.parse(data.body);
  } else if (data.body && typeof data.body === "object") {
    data = data.body;
  }

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.complaints)) return data.complaints;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.Items)) return data.Items;

  throw new Error("API response is not a complaints list. Check the Lambda response.");
}

function updateCounts(records) {
  document.getElementById("totalCount").textContent = records.length;
  document.getElementById("pendingCount").textContent =
    records.filter(c => c.status === "Pending").length;
  document.getElementById("progressCount").textContent =
    records.filter(c => c.status === "In Progress").length;
  document.getElementById("resolvedCount").textContent =
    records.filter(c => c.status === "Resolved").length;
}

function renderTable() {
  const search = searchInput.value.toLowerCase().trim();
  const status = statusFilter.value;
  const category = categoryFilter.value;

  const filtered = complaints.filter(c => {
    const text = [
      c.complaint_id, c.category, c.description, c.status
    ].join(" ").toLowerCase();

    return text.includes(search) &&
      (!status || c.status === status) &&
      (!category || c.category === category);
  });

  tableBody.replaceChildren();

  if (filtered.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "empty-state";
    cell.textContent = "No complaints found.";
    row.appendChild(cell);
    tableBody.appendChild(row);
  }

  filtered.forEach(c => {
    const row = document.createElement("tr");

    function cell(value, className = "") {
      const td = document.createElement("td");
      td.textContent = value || "—";
      if (className) td.className = className;
      return td;
    }

    row.appendChild(cell(c.complaint_id, "complaint-id"));
    row.appendChild(cell(c.category));
    row.appendChild(cell(c.description, "description-cell"));
    row.appendChild(cell(
      c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"
    ));

    const statusCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "status-badge " +
      (c.status === "Resolved" ? "resolved" :
       c.status === "In Progress" ? "in-progress" : "pending");
    badge.textContent = c.status || "Pending";
    statusCell.appendChild(badge);
    row.appendChild(statusCell);

    const actionCell = document.createElement("td");
    const select = document.createElement("select");
    select.className = "status-select";
    select.setAttribute("aria-label", "Update complaint status");

    ["Pending", "In Progress", "Resolved"].forEach(s => {
      const option = document.createElement("option");
      option.value = s;
      option.textContent = s;
      option.selected = s === c.status;
      select.appendChild(option);
    });

    
select.addEventListener("change", async () => {
  const oldStatus = c.status || "Pending";
  const newStatus = select.value;

  select.disabled = true;
  showNotice(`Updating complaint ${c.complaint_id}...`);

  try {
    const response = await fetch(
      `${API_BASE}/complaints/${encodeURIComponent(c.complaint_id)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    c.status = newStatus;
    updateCounts(complaints);
    renderTable();

    showNotice(
      `Complaint ${c.complaint_id} updated to ${newStatus}.`
    );
  } catch (error) {
    console.error("Status update error:", error);
    c.status = oldStatus;
    renderTable();

    showNotice(
      `Status update failed: ${error.message}`,
      true
    );
  } finally {
    select.disabled = false;
  }
});


    actionCell.appendChild(select);
    row.appendChild(actionCell);
    tableBody.appendChild(row);
  });

  resultCount.textContent =
    `Showing ${filtered.length} of ${complaints.length} complaints`;
}

async function loadComplaints() {
  refreshButton.disabled = true;
  refreshButton.textContent = "Loading...";

  try {
    const response = await fetch(`${API_BASE}/complaints`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}`);
    }

    complaints = getRecords(data);
    updateCounts(complaints);

    const categories = [...new Set(
      complaints.map(c => c.category).filter(Boolean)
    )];

    categoryFilter.replaceChildren(new Option("All categories", ""));
    categories.forEach(c => categoryFilter.add(new Option(c, c)));

    renderTable();
    notice.hidden = true;
  } catch (error) {
    console.error("Dashboard load error:", error);
    showNotice(
      `Could not load complaints: ${error.message}. Check the API response and browser console.`,
      true
    );
    tableBody.replaceChildren();
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.className = "empty-state";
    cell.textContent = "Unable to load complaints. See the error above.";
    row.appendChild(cell);
    tableBody.appendChild(row);
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = "↻ Refresh Data";
  }
}

refreshButton.addEventListener("click", loadComplaints);
searchInput.addEventListener("input", renderTable);
statusFilter.addEventListener("change", renderTable);
categoryFilter.addEventListener("change", renderTable);

loadComplaints();
