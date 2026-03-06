import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

/*
  Themes: default | neutral | dark | forest | base
  Flowchart options:
    padding (15)         - padding between label and shape
    nodeSpacing (50)     - spacing between nodes on same level
    rankSpacing (50)     - spacing between nodes on different levels
    diagramPadding (20)  - padding around entire diagram
    curve (rounded)      - basis | linear | rounded | cardinal
    wrappingWidth (200)  - width for text wrapping
    defaultRenderer      - dagre-wrapper | dagre-d3 | elk
*/
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  flowchart: { padding: 15, rankSpacing: 80, nodeSpacing: 60, subGraphTitleMargin: { top: 10, bottom: 10 }, wrappingWidth: 300, useMaxWidth: false },
  themeVariables: { fontSize: '20px' },
});

const projectSelect = document.getElementById('project-select');
const diagramSelect = document.getElementById('diagram-select');
const container = document.getElementById('diagram-container');

let allDiagrams = [];

function getProjects() {
  return [...new Set(allDiagrams.map(d => d.project))];
}

function getDiagramsForProject(project) {
  return allDiagrams.filter(d => d.project === project);
}

function populateProjects() {
  const projects = getProjects();
  projectSelect.innerHTML = projects
    .map(p => `<option value="${p}">${p}</option>`)
    .join('');
}

function populateDiagrams(project) {
  const diagrams = getDiagramsForProject(project);
  diagramSelect.innerHTML = diagrams
    .map(d => `<option value="${d.name}">${d.name}</option>`)
    .join('');
}

async function renderDiagram(project, name, preserveTransform = false) {
  const res = await fetch(`/api/mermaid/diagram/${project}/${name}`);
  if (!res.ok) {
    container.innerHTML = '<p class="empty">Diagram not found</p>';
    return;
  }
  const code = await res.text();
  // Render SVG off-screen first to avoid flicker
  const { svg } = await mermaid.render('diagram-svg', code);
  let el = container.querySelector('.mermaid');
  if (!el) {
    container.innerHTML = '<div class="mermaid"></div>';
    el = container.querySelector('.mermaid');
  }
  // Swap SVG content in place, preserving the container element and its transform
  el.innerHTML = svg;
  if (!preserveTransform) {
    scale = 1;
    panX = 0;
    panY = 0;
  }
  el.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

projectSelect.addEventListener('change', () => {
  const project = projectSelect.value;
  populateDiagrams(project);
  renderDiagram(project, diagramSelect.value);
});

diagramSelect.addEventListener('change', () => {
  renderDiagram(projectSelect.value, diagramSelect.value);
});

// Pan
let isPanning = false;
let panX = 0, panY = 0;
let startX = 0, startY = 0;

function applyTransform() {
  const el = container.querySelector('.mermaid');
  if (el) el.style.transform = `translate(${panX}px, ${panY}px) scale(${scale})`;
}

container.addEventListener('mousedown', (e) => {
  if (locked) return;
  isPanning = true;
  startX = e.clientX - panX;
  startY = e.clientY - panY;
  container.style.cursor = 'grabbing';
});

window.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  panX = e.clientX - startX;
  panY = e.clientY - startY;
  applyTransform();
});

window.addEventListener('mouseup', () => {
  isPanning = false;
  if (!locked) container.style.cursor = 'grab';
});

container.style.cursor = 'grab';

// Zoom
let scale = 1;
const ZOOM_STEP = 0.2;
const MIN_SCALE = 0.2;
const MAX_SCALE = 5;

function applyZoom() {
  applyTransform();
}

function zoomAroundCenter(newScale) {
  const rect = container.getBoundingClientRect();
  const cx = rect.width / 2;
  const cy = rect.height / 2;
  const prevScale = scale;
  scale = newScale;
  const ratio = scale / prevScale;
  panX = cx - ratio * (cx - panX);
  panY = cy - ratio * (cy - panY);
  applyZoom();
}

document.addEventListener('keydown', (e) => {
  if (!e.metaKey && !e.ctrlKey) return;
  if (e.key === '=' || e.key === '+') {
    e.preventDefault();
    zoomAroundCenter(Math.min(MAX_SCALE, scale + ZOOM_STEP));
  } else if (e.key === '-') {
    e.preventDefault();
    zoomAroundCenter(Math.max(MIN_SCALE, scale - ZOOM_STEP));
  } else if (e.key === '0') {
    e.preventDefault();
    scale = 1;
    panX = 0;
    panY = 0;
    applyZoom();
  }
});

container.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = container.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const prevScale = scale;
  const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
  scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale + delta));
  const ratio = scale / prevScale;
  panX = mouseX - ratio * (mouseX - panX);
  panY = mouseY - ratio * (mouseY - panY);
  applyZoom();
}, { passive: false });

// Toolbar buttons
let locked = false;
document.getElementById('zoom-in').addEventListener('click', () => {
  zoomAroundCenter(Math.min(MAX_SCALE, scale + ZOOM_STEP));
});
document.getElementById('zoom-out').addEventListener('click', () => {
  zoomAroundCenter(Math.max(MIN_SCALE, scale - ZOOM_STEP));
});
document.getElementById('zoom-fit').addEventListener('click', () => {
  scale = 1;
  panX = 0;
  panY = 0;
  applyZoom();
});
const lockBtn = document.getElementById('zoom-lock');
const unlockedSvg = '<svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/></svg>';
const lockedSvg = '<svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.5" fill="none"/><path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" fill="none"/><circle cx="7" cy="9.5" r="1" fill="currentColor"/></svg>';
lockBtn.addEventListener('click', () => {
  locked = !locked;
  lockBtn.innerHTML = locked ? lockedSvg : unlockedSvg;
  container.style.cursor = locked ? 'default' : 'grab';
});

// Live reload
const sse = new EventSource('/api/reload');
sse.onmessage = () => {
  renderDiagram(projectSelect.value, diagramSelect.value, true);
};

// Init
const res = await fetch('/api/mermaid/diagrams');
allDiagrams = await res.json();

if (allDiagrams.length === 0) {
  container.innerHTML = '<p class="empty">No .mmd files found in diagrams/mermaid/</p>';
} else {
  populateProjects();
  populateDiagrams(projectSelect.value);
  renderDiagram(projectSelect.value, diagramSelect.value);
}
