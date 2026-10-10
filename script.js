const $ = id => document.getElementById(id);

const today = new Date();
const dateOffset = days => {
  const d = new Date(today);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};
const formatDate = date => new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
  day: "2-digit", month: "short", year: "numeric"
});
const money = value => "₹" + Number(value).toLocaleString("en-IN");

const initialProjects = [
  {id:1,name:"Main Road Resurfacing",road:"Market Road",type:"Road",status:"Ongoing",budget:850000,contractor:"GreenBuild Infra",start:dateOffset(-4),end:dateOffset(12),progress:45,lat:10.963, lng:79.385},
  {id:2,name:"Underground Water Pipeline",road:"Market Road",type:"Water",status:"Planned",budget:620000,contractor:"AquaWorks Ltd",start:dateOffset(5),end:dateOffset(18),progress:0,lat:10.969,lng:79.395},
  {id:3,name:"Stormwater Drain Upgrade",road:"Market Road",type:"Drainage",status:"Planned",budget:440000,contractor:"CityFlow Projects",start:dateOffset(9),end:dateOffset(22),progress:0,lat:10.958,lng:79.375},
  {id:4,name:"Streetlight Modernization",road:"Temple Street",type:"Electricity",status:"Ongoing",budget:275000,contractor:"BrightPath Electricals",start:dateOffset(-7),end:dateOffset(5),progress:65,lat:10.972,lng:79.382},
  {id:5,name:"Community Park Renewal",road:"Lake Road",type:"Public Space",status:"Completed",budget:390000,contractor:"GreenBuild Infra",start:dateOffset(-35),end:dateOffset(-3),progress:100,lat:10.952,lng:79.402},
  {id:6,name:"Pothole Repair Drive",road:"Station Road",type:"Road",status:"Ongoing",budget:180000,contractor:"RoadCare Services",start:dateOffset(-2),end:dateOffset(4),progress:30,lat:10.980,lng:79.390}
];

function loadSaved(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

let projects = loadSaved("civicsync_projects", initialProjects);
let reports = loadSaved("civicsync_reports", [
  {id:"CS-1001",title:"Damaged footpath",category:"Road damage",location:"Station Road",date:dateOffset(-2),description:"Footpath requires repair.",status:"Under Review"},
  {id:"CS-1002",title:"Streetlight outage",category:"Streetlight problem",location:"Temple Street",date:dateOffset(-1),description:"Streetlight needs inspection.",status:"Submitted"}
]);

function saveData() {
  try {
    localStorage.setItem("civicsync_projects", JSON.stringify(projects));
    localStorage.setItem("civicsync_reports", JSON.stringify(reports));
  } catch (error) {
    console.warn("Browser storage is unavailable.");
  }
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function openModal(id) {
  $(id).classList.remove("hidden");
}
function closeModal(id) {
  $(id).classList.add("hidden");
}

document.querySelectorAll("[data-close]").forEach(button => {
  button.addEventListener("click", () => closeModal(button.dataset.close));
});
document.querySelectorAll(".modal").forEach(modal => {
  modal.addEventListener("click", event => {
    if (event.target === modal) closeModal(modal.id);
  });
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape") document.querySelectorAll(".modal").forEach(m => closeModal(m.id));
});

["sidebarReport", "heroReport", "topReport", "newComplaintBtn"].forEach(id => {
  $(id).addEventListener("click", () => openModal("complaintModal"));
});
$("addProjectBtn").addEventListener("click", () => openModal("projectModal"));

$("menuToggle").addEventListener("click", () => $("sidebar").classList.toggle("open"));
document.querySelectorAll(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach(item => item.classList.remove("active"));
    link.classList.add("active");
    $("sidebar").classList.remove("open");
  });
});

function detectConflicts() {
  const conflicts = [];
  for (let i = 0; i < projects.length; i++) {
    for (let j = i + 1; j < projects.length; j++) {
      const a = projects[i], b = projects[j];
      const sameRoad = a.road.trim().toLowerCase() === b.road.trim().toLowerCase();
      const overlap = a.start <= b.end && b.start <= a.end;
      if (sameRoad && overlap && a.status !== "Completed" && b.status !== "Completed") {
        conflicts.push({a,b});
      }
    }
  }
  return conflicts;
}

function renderStats() {
  $("totalProjects").textContent = projects.length;
  $("ongoingProjects").textContent = projects.filter(p => p.status === "Ongoing").length;
  $("completedProjects").textContent = projects.filter(p => p.status === "Completed").length;
  const conflicts = detectConflicts();
  $("totalConflicts").textContent = conflicts.length;
  $("alertBadge").textContent = conflicts.length;
  $("conflictCount").textContent = `${conflicts.length} alert${conflicts.length === 1 ? "" : "s"}`;
}

function renderProjects() {
  const query = $("searchInput").value.trim().toLowerCase();
  const status = $("statusFilter").value;
  const type = $("typeFilter").value;
  const filtered = projects.filter(p =>
    [p.name,p.road,p.contractor,p.type].some(v => v.toLowerCase().includes(query)) &&
    (status === "all" || p.status === status) &&
    (type === "all" || p.type === type)
  );

  $("projectGrid").innerHTML = filtered.map(p => `
    <article class="project-card">
      <div class="project-card-top">
        <span class="type-pill">${escapeHTML(p.type)}</span>
        <span class="status-pill status-${p.status}">${escapeHTML(p.status)}</span>
      </div>
      <h3>${escapeHTML(p.name)}</h3>
      <div class="project-location">⌖ ${escapeHTML(p.road)}</div>
      <div class="project-meta">
        <div>PROJECT BUDGET<strong>${money(p.budget)}</strong></div>
        <div>CONTRACTOR<strong>${escapeHTML(p.contractor)}</strong></div>
      </div>
      <div class="progress-row"><span>Project progress</span><strong>${p.progress}%</strong></div>
      <div class="progress-track"><div class="progress-fill" style="width:${p.progress}%"></div></div>
      <div class="project-meta">
        <div>START<strong>${formatDate(p.start)}</strong></div>
        <div>EXPECTED END<strong>${formatDate(p.end)}</strong></div>
      </div>
    </article>
  `).join("");
  $("emptyState").classList.toggle("hidden", filtered.length !== 0);
}

function renderConflicts() {
  const conflicts = detectConflicts();
  if (!conflicts.length) {
    $("conflictList").innerHTML = `<div class="conflict-item"><div class="conflict-symbol">✓</div><div><strong>No scheduling conflicts detected</strong><p>No overlapping active or planned projects were found on the same road.</p></div></div>`;
    return;
  }
  $("conflictList").innerHTML = conflicts.map(({a,b}) => `
    <div class="conflict-item">
      <div class="conflict-symbol">⚠</div>
      <div><strong>${escapeHTML(a.road)} — Potential scheduling conflict</strong>
      <p><b>${escapeHTML(a.name)}</b> (${formatDate(a.start)} – ${formatDate(a.end)}) overlaps with <b>${escapeHTML(b.name)}</b> (${formatDate(b.start)} – ${formatDate(b.end)}).<br>
      Both projects are listed on the same road. Authority review is recommended.</p></div>
    </div>
  `).join("");
}

function renderActivity() {
  const icons = {Road:"🛣️",Water:"💧",Drainage:"🌊",Electricity:"💡","Public Space":"🌳"};
  $("activityList").innerHTML = [...projects].slice(-4).reverse().map(p => `
    <div class="activity-item">
      <div class="activity-symbol" style="background:#eef1ff">${icons[p.type] || "🏗️"}</div>
      <div><strong>${escapeHTML(p.name)}</strong><p>${escapeHTML(p.road)} · ${escapeHTML(p.status)}</p><small>Budget ${money(p.budget)} · ${p.progress}% complete</small></div>
    </div>
  `).join("");
}

function renderReports() {
  $("reportTotal").textContent = reports.length;
  $("reportPending").textContent = reports.filter(r => r.status !== "Resolved").length;
  $("reportResolved").textContent = reports.filter(r => r.status === "Resolved").length;

  $("complaintTable").innerHTML = reports.length ? [...reports].reverse().map(r => `
    <tr>
      <td>${escapeHTML(r.id)}</td>
      <td><strong>${escapeHTML(r.title)}</strong><br><small>${escapeHTML(r.category)}</small></td>
      <td>${escapeHTML(r.location)}</td>
      <td>${formatDate(r.date)}</td>
      <td><span class="status-pill ${r.status === "Resolved" ? "status-Completed" : "status-Ongoing"}">${escapeHTML(r.status)}</span></td>
    </tr>
  `).join("") : `<tr><td colspan="5">No citizen reports yet. Submit the first report.</td></tr>`;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[ch]));
}

function renderAll() {
  saveData();
  renderStats();
  renderProjects();
  renderConflicts();
  renderActivity();
  renderReports();
  renderMapMarkers();
}

$("searchInput").addEventListener("input", renderProjects);
$("statusFilter").addEventListener("change", renderProjects);
$("typeFilter").addEventListener("change", renderProjects);

$("projectForm").addEventListener("submit", event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const start = form.get("start"), end = form.get("end");
  const progress = Number(form.get("progress"));
  const budget = Number(form.get("budget"));

  if (end < start) {
    showToast("End date must be on or after the start date.");
    return;
  }
  if (!Number.isFinite(budget) || budget < 0 || progress < 0 || progress > 100) {
    showToast("Please check the budget and progress values.");
    return;
  }

  const status = form.get("status");
  projects.push({
    id:Date.now(),
    name:form.get("name").trim(),
    road:form.get("road").trim(),
    type:form.get("type"),
    status,
    budget,
    contractor:form.get("contractor").trim(),
    start,end,
    progress:status === "Completed" ? 100 : progress,
    lat:10.963 + (Math.random() - .5) * .025,
    lng:79.385 + (Math.random() - .5) * .025
  });

  event.currentTarget.reset();
  closeModal("projectModal");
  renderAll();
  showToast("Project added successfully!");
});

$("complaintForm").addEventListener("submit", event => {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  reports.push({
    id:"CS-" + (1000 + Date.now().toString().slice(-5)),
    title:form.get("title").trim(),
    category:form.get("category"),
    location:form.get("location").trim(),
    description:form.get("description").trim(),
    date:dateOffset(0),
    status:"Submitted"
  });
  event.currentTarget.reset();
  closeModal("complaintModal");
  renderReports();
  saveData();
  showToast("Your report was submitted successfully!");
});

let map = null;
let markerLayer = null;

function initMap() {
  if (typeof L === "undefined") {
    $("map").innerHTML = '<div style="padding:35px;color:#65718a">The interactive map needs an internet connection. Your project dashboard will still work.</div>';
    return;
  }
  map = L.map("map").setView([10.963,79.385], 14);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom:19
  }).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  renderMapMarkers();
}

function renderMapMarkers() {
  if (!map || !markerLayer) return;
  markerLayer.clearLayers();
  const colors = {Planned:"#5470ed",Ongoing:"#f2a052",Completed:"#26bd8b"};
  projects.forEach(p => {
    if (!Number.isFinite(Number(p.lat)) || !Number.isFinite(Number(p.lng))) return;
    const marker = L.circleMarker([p.lat,p.lng], {
      radius:9,color:"#fff",weight:2,fillColor:colors[p.status] || "#5470ed",fillOpacity:1
    });
    marker.bindPopup(`<strong>${escapeHTML(p.name)}</strong><br>${escapeHTML(p.road)}<br>Status: ${escapeHTML(p.status)}<br>Budget: ${money(p.budget)}<br>Progress: ${p.progress}%`);
    marker.addTo(markerLayer);
  });
}

renderAll();
initMap();