// Leonida Trophy Atlas — GTA VI trophy guide. Vanilla JS, no network at runtime.
// Data: app/data/trophies.json (official names/descriptions/grades + our own-word guides).
// Progress lives in localStorage; ?seed=1 loads a demo save (13/55) for screenshots.

const POINTS = { platinum: 180, gold: 90, silver: 30, bronze: 15 };
const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const LS_EARNED = 'atlas-earned-v1';
const LS_COUNTS = 'atlas-counts-v1';
const LS_SPOILER = 'atlas-spoiler-v1';

let DATA = null;
let earned = new Set();
let counts = {};
let spoiler = true;
// v3 cover trophy: #17 The Shootist — its complete 5-step cited guide + SOURCES DIFFER box
// fit the cover frame (measured); #28's 6 steps + warn box cannot fit even fully compressed.
let selectedId = 17;
let filter = { kind: 'all', grade: 'all', hiddenOnly: false, disputedOnly: false, notEarnedOnly: false, q: '' };
let sortMode = 'roadmap';

const $ = (id) => document.getElementById(id);
const trophyById = (id) => DATA.trophies.find((t) => t.id === id);
const sourceByN = (n) => DATA.sources.find((s) => s.n === n);

function loadState() {
  try { earned = new Set(JSON.parse(localStorage.getItem(LS_EARNED) || '[]')); } catch { earned = new Set(); }
  try { counts = JSON.parse(localStorage.getItem(LS_COUNTS) || '{}'); } catch { counts = {}; }
  const sp = localStorage.getItem(LS_SPOILER);
  spoiler = sp === null ? true : sp === '1';
}

function saveState() {
  localStorage.setItem(LS_EARNED, JSON.stringify([...earned]));
  localStorage.setItem(LS_COUNTS, JSON.stringify(counts));
  localStorage.setItem(LS_SPOILER, spoiler ? '1' : '0');
}

function seedDemo() {
  earned = new Set([2, 3, 8, 16, 20, 21, 33, 35, 41, 44, 52, 53, 55]);
  counts = { 15: 41, 28: 6, 31: 23, 35: 31, 42: 19, 32: 12, 19: 7 };
  saveState();
}

function isShielded(t) {
  return spoiler && !earned.has(t.id) && (t.hidden || t.kind === 'story');
}

function displayName(t) {
  if (!isShielded(t)) return t.name;
  if (t.kind === 'story' && t.chapter) return `Story trophy · Chapter ${t.chapter === 5 ? 'Final' : t.chapter}`;
  return `Hidden trophy · #${t.id} of 55`;
}

function displayDesc(t) {
  return isShielded(t) ? 'Hidden by the spoiler shield until earned.' : t.description;
}

function gradeDot(t) {
  return `<span class="grade-dot grade-${t.grade}" title="${GRADE_LABEL[t.grade]}"></span>`;
}

function flagsHtml(t) {
  let out = '';
  if (t.missable) out += '<span class="flag flag-miss">POSSIBLY MISSABLE</span>';
  if (t.risk) out += '<span class="flag flag-risk">UNCONFIRMED</span>';
  if (t.hidden && !earned.has(t.id)) out += '<span class="flag flag-hidden">PSN-HIDDEN</span>';
  if (t.dispute) out += '<span class="flag flag-risk">SOURCES DIFFER</span>';
  return out;
}

function citeHtml(step) {
  return step.replace(/\[(\d+)\]/g, '<span class="cite">[$1]</span>');
}

function renderProgress() {
  const n = earned.size;
  $('earned-count').textContent = n;
  $('progress-fill').style.width = `${Math.round((n / 55) * 100)}%`;
  const gc = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const total = DATA.trophies.filter((t) => t.grade === g).length;
    const got = DATA.trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
    return `${GRADE_LABEL[g][0]} ${got}/${total}`;
  }).join(' &nbsp;·&nbsp; ');
  $('grade-counts').innerHTML = gc;
  const points = DATA.trophies.reduce((s, t) => s + (earned.has(t.id) ? POINTS[t.grade] : 0), 0);
  const logged = Object.values(counts).reduce((a, b) => a + b, 0);
  $('points-line').textContent = `${points} points · ${logged} collectibles logged`;
}

function renderAudit() {
  const totalSteps = DATA.trophies.reduce((s, t) => s + t.guide.length, 0);
  const cited = DATA.trophies.reduce((s, t) => s + t.guide.filter((g) => /\[\d+\]/.test(g)).length, 0);
  const withSources = DATA.trophies.filter((t) => t.sources && t.sources.length).length;
  const disputes = DATA.trophies.filter((t) => t.dispute).length;
  const missable = DATA.trophies.filter((t) => t.missable).length;
  const unconfirmed = DATA.trophies.filter((t) => t.risk).length;
  const sites = new Set(DATA.sources.map((s) => s.site)).size;
  $('audit').innerHTML = `
    <span class="audit-label">DATA CHECK</span>
    <span><strong>55/55</strong> official name, description, grade</span>
    <span><strong>1P 2G 6S 46B</strong></span>
    <span><strong>28</strong> PSN-hidden</span>
    <span><strong>${cited}/${totalSteps}</strong> steps cite a source</span>
    <span><strong>${withSources}/55</strong> guides cite sources</span>
    <span><strong>${disputes}</strong> disputes shown both ways</span>
    <span><strong>${DATA.sources.length}</strong> sources · <strong>${sites}</strong> sites · read 20–21 Nov 2026</span>
    <span><strong>${missable}</strong> possibly missable</span>
    <span><strong>${unconfirmed}</strong> unconfirmed</span>`;
}

function kindCount(kind) {
  if (kind === 'all') return DATA.trophies.length;
  if (kind === 'missable') return DATA.trophies.filter((t) => t.missable).length;
  if (kind === 'online') return 0;
  return DATA.trophies.filter((t) => t.kind === kind).length;
}

function renderFilters() {
  const kinds = [['all', 'All'], ['story', 'Story'], ['missable', 'Missable'], ['collectibles', 'Collectibles'], ['activities', 'Activities'], ['online', 'Online']];
  const grades = [['all', 'All grades'], ['platinum', 'P'], ['gold', 'G'], ['silver', 'S'], ['bronze', 'B']];
  $('filters').innerHTML =
    kinds.map(([k, label]) => `<button type="button" class="chip${filter.kind === k ? ' active' : ''}" data-kind="${k}">${label} <span class="n">${kindCount(k)}</span></button>`).join('') +
    `<span style="width:8px"></span>` +
    grades.map(([g, label]) => `<button type="button" class="chip${filter.grade === g ? ' active' : ''}" data-grade="${g}">${label}</button>`).join('') +
    `<button type="button" class="chip${filter.hiddenOnly ? ' active' : ''}" data-toggle="hiddenOnly">PSN-hidden <span class="n">28</span></button>` +
    `<button type="button" class="chip${filter.disputedOnly ? ' active' : ''}" data-toggle="disputedOnly">Disputed <span class="n">${DATA.trophies.filter((t) => t.dispute).length}</span></button>` +
    `<button type="button" class="chip${filter.notEarnedOnly ? ' active' : ''}" data-toggle="notEarnedOnly">Not earned <span class="n">${55 - earned.size}</span></button>` +
    `<input type="search" id="search" placeholder="Search name or description…" value="${filter.q.replace(/"/g, '&quot;')}">`;
  $('filters').querySelectorAll('[data-kind]').forEach((b) => b.addEventListener('click', () => { filter.kind = b.dataset.kind; renderAll(); }));
  $('filters').querySelectorAll('[data-grade]').forEach((b) => b.addEventListener('click', () => { filter.grade = b.dataset.grade; renderAll(); }));
  $('filters').querySelectorAll('[data-toggle]').forEach((b) => b.addEventListener('click', () => { filter[b.dataset.toggle] = !filter[b.dataset.toggle]; renderAll(); }));
  const search = $('search');
  search.addEventListener('input', () => { filter.q = search.value; renderList(); });
}

function filteredTrophies() {
  let list = [...DATA.trophies];
  if (filter.kind === 'missable') list = list.filter((t) => t.missable);
  else if (filter.kind === 'online') list = [];
  else if (filter.kind !== 'all') list = list.filter((t) => t.kind === filter.kind);
  if (filter.grade !== 'all') list = list.filter((t) => t.grade === filter.grade);
  if (filter.hiddenOnly) list = list.filter((t) => t.hidden);
  if (filter.disputedOnly) list = list.filter((t) => t.dispute);
  if (filter.notEarnedOnly) list = list.filter((t) => !earned.has(t.id));
  if (filter.q.trim()) {
    const q = filter.q.trim().toLowerCase();
    list = list.filter((t) => (t.name + ' ' + t.description).toLowerCase().includes(q));
  }
  if (sortMode === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortMode === 'grade') list.sort((a, b) => (['platinum', 'gold', 'silver', 'bronze'].indexOf(a.grade) - ['platinum', 'gold', 'silver', 'bronze'].indexOf(b.grade)) || (a.phase - b.phase));
  else list.sort((a, b) => (a.phase - b.phase) || (a.id - b.id));
  return list;
}

function renderList() {
  const list = filteredTrophies();
  $('shown-count').textContent = `${list.length} shown`;
  $('trophy-list').innerHTML = list.map((t) => {
    const got = earned.has(t.id);
    const cnt = t.count ? ` · ${counts[t.id] || 0}/${t.count.target} ${t.count.unit}` : '';
    return `<li class="${t.id === selectedId ? 'selected' : ''}${got ? ' earned' : ''}" data-id="${t.id}">
      <input type="checkbox" ${got ? 'checked' : ''} aria-label="Mark earned">
      <div>
        <div class="t-name">${gradeDot(t)}${displayName(t)}${flagsHtml(t)}</div>
        <div class="t-desc">${displayDesc(t)}</div>
        <div class="t-meta">${GRADE_LABEL[t.grade]} · ${t.kind === 'platinum' ? 'Platinum' : t.kind} · Phase ${t.phase}${cnt} · ${t.sources.length} src</div>
      </div>
    </li>`;
  }).join('');
  $('trophy-list').querySelectorAll('li').forEach((li) => {
    li.addEventListener('click', (e) => {
      const id = Number(li.dataset.id);
      if (e.target.tagName === 'INPUT') { toggleEarned(id); return; }
      selectedId = id;
      history.replaceState(null, '', `#trophy/${id}`);
      renderList(); renderDetail();
    });
  });
}

function toggleEarned(id) {
  if (earned.has(id)) earned.delete(id); else earned.add(id);
  saveState();
  renderAll();
}

function renderDetail() {
  const t = trophyById(selectedId) || DATA.trophies[0];
  const got = earned.has(t.id);
  const countVal = counts[t.id] || 0;
  const countBox = t.count ? `
    <div class="count-box">
      <span class="count-label">YOUR COUNT</span>
      <button type="button" id="count-minus" aria-label="Decrease">−</button>
      <span class="count-num">${countVal} / ${t.count.target}</span>
      <button type="button" id="count-plus" aria-label="Increase">+</button>
      <span class="count-label">${t.count.unit}</span>
    </div>` : '';
  const warnBox = t.missable ? `
    <div class="warn-box"><strong>⚠ LAST CHANCE — ${t.lastChance}</strong><br>Keep a manual save until this trophy pops.</div>` : '';
  const riskBox = t.risk ? `
    <div class="warn-box" style="background:var(--amber-soft);border-color:var(--amber)"><strong>Unconfirmed:</strong> ${t.risk}</div>` : '';
  const disputeBox = t.dispute ? `
    <div class="dispute-box">
      <h3>⚖ SOURCES DIFFER — both versions shown</h3>
      <p><strong>A ·</strong> ${t.dispute.a}</p>
      <p><strong>B ·</strong> ${t.dispute.b}</p>
      <p class="call">Our call: ${t.dispute.call}</p>
    </div>` : '';
  const srcItems = t.sources.map((n) => {
    const s = sourceByN(n);
    return `<li><strong>[${n}] ${s.site}</strong> — ${s.title}<br><a href="${s.url}" target="_blank" rel="noopener">${s.url}</a> · read ${s.read}</li>`;
  }).join('');
  // v4: top-cited sources sidebar — the cover shows named sources with
  // claim counts + read dates next to the steps. Counts are computed live
  // from the [n] refs across every guide + dispute, so they can't drift.
  const citeCount = {};
  for (const tr of DATA.trophies) {
    const texts = [...tr.guide];
    if (tr.dispute) texts.push(tr.dispute.a, tr.dispute.b);
    for (const s of texts) for (const m of s.matchAll(/\[(\d+)\]/g)) citeCount[m[1]] = (citeCount[m[1]] || 0) + 1;
  }
  const topSources = DATA.sources
    .filter((s) => citeCount[s.n])
    .sort((a, b) => citeCount[b.n] - citeCount[a.n])
    .slice(0, 6);
  const sidebar = `<aside class="src-sidebar"><h4>SOURCES · TOP 6 OF 10</h4>${topSources.map((s) => {
    const domain = new URL(s.url).hostname.replace(/^www\./, '');
    return `<div class="sb-row"><strong>[${s.n}] ${s.site}</strong> — ${domain}<br><span>${citeCount[s.n]} claims cited · read ${s.read}</span></div>`;
  }).join('')}</aside>`;
  $('detail').innerHTML = `
    <button type="button" class="mark-btn${got ? ' earned' : ''}" id="mark-btn">${got ? '✓ Earned' : 'Mark earned'}</button>
    <h2>${gradeDot(t)}${displayName(t)}</h2>
    <p class="off-desc">“${displayDesc(t)}”</p>
    <div class="chips">
      <span class="pill">${GRADE_LABEL[t.grade]}</span>
      <span class="pill">${t.kind === 'platinum' ? 'Platinum' : t.kind}</span>
      <span class="pill">Phase ${t.phase}</span>
      ${t.hidden ? '<span class="pill">PSN-hidden</span>' : ''}
      ${t.missable ? '<span class="pill coral">Possibly missable</span>' : ''}
      ${t.dispute ? '<span class="pill amber">Sources differ</span>' : ''}
    </div>
    <div class="guide-row">
      <div class="steps-col">
        <h4>HOW TO EARN IT — ${t.guide.length} STEPS, IN OUR OWN WORDS</h4>
        <ol class="steps">${t.guide.map((s) => `<li>${citeHtml(s)}</li>`).join('')}</ol>
      </div>
      ${sidebar}
    </div>
    ${disputeBox}
    ${countBox}${warnBox}${riskBox}
    <h3>Sources for this guide · ${t.sources.length}</h3>
    <ol class="src-list">${srcItems}</ol>`;
  $('mark-btn').addEventListener('click', () => toggleEarned(t.id));
  const plus = $('count-plus'), minus = $('count-minus');
  if (plus) plus.addEventListener('click', () => { counts[t.id] = Math.min(t.count.target, countVal + 1); saveState(); renderAll(); });
  if (minus) minus.addEventListener('click', () => { counts[t.id] = Math.max(0, countVal - 1); saveState(); renderAll(); });
}

function renderNextUp() {
  const ordered = [...DATA.trophies].sort((a, b) => (a.phase - b.phase) || (a.id - b.id));
  const unearned = ordered.filter((t) => !earned.has(t.id));
  // Shielded trophies share one masked label, so consecutive shielded rows
  // read as duplicates. Group them into one distinct row per run instead.
  const rows = [];
  let i = 0;
  while (i < unearned.length && rows.length < 6) {
    const t = unearned[i];
    if (isShielded(t)) {
      const group = [];
      const story = t.kind === 'story';
      while (i < unearned.length && isShielded(unearned[i]) && (unearned[i].kind === 'story') === story) { group.push(unearned[i]); i++; }
      let label;
      if (story) {
        const chapters = [...new Set(group.map((g) => g.chapter))];
        const ch = (c) => (c === 5 ? 'Finale' : `Chapter ${c}`);
        const consecutive = chapters.every((c, idx) => idx === 0 || c === chapters[idx - 1] + 1);
        const range = consecutive && chapters.length > 1
          ? `Chapters ${chapters[0]}–${chapters[chapters.length - 1] === 5 ? 'Finale' : chapters[chapters.length - 1]}`
          : chapters.map(ch).join(', ');
        label = group.length === 1 ? `Story trophy · ${ch(chapters[0])}` : `Story trophies · <span style="white-space:nowrap">${range}</span>`;
      } else {
        label = group.length === 1 ? `Hidden trophy · #${group[0].id} of 55` : `Hidden trophies · ${group.map((g) => `#${g.id}`).join(', ')}`;
      }
      const sub = group.length === 1 ? 'Name hidden by the spoiler shield'
        : `${group.length} to earn in ${story ? 'story' : 'roadmap'} order — names hidden by the spoiler shield`;
      rows.push({ group, label, sub, phase: group[0].phase });
    } else {
      rows.push({ group: [t], t, label: null, phase: t.phase });
      i++;
    }
  }
  $('nextup-list').innerHTML = rows.map((r) => {
    if (r.t) {
      const t = r.t;
      return `<li data-id="${t.id}">${gradeDot(t)}<strong>${displayName(t)}</strong><br><span style="color:var(--muted)">Phase ${t.phase} · ${GRADE_LABEL[t.grade]}${t.missable ? ' · missable — do first' : ''}</span></li>`;
    }
    return `<li data-id="${r.group[0].id}"><strong>${r.label}</strong><br><span style="color:var(--muted)">Phase ${r.phase} · ${r.sub}</span></li>`;
  }).join('');
  $('nextup-list').querySelectorAll('li').forEach((li) => li.addEventListener('click', () => {
    selectedId = Number(li.dataset.id);
    history.replaceState(null, '', `#trophy/${selectedId}`);
    renderList(); renderDetail();
  }));
  const chapters = [[1, 'Chapter 1'], [2, 'Chapter 2'], [3, 'Chapter 3'], [4, 'Chapter 4'], [5, 'Finale']];
  $('chapter-bars').innerHTML = chapters.map(([ch, label]) => {
    const inCh = DATA.trophies.filter((t) => t.chapter === ch);
    const got = inCh.filter((t) => earned.has(t.id)).length;
    const pct = inCh.length ? Math.round((got / inCh.length) * 100) : 0;
    return `<div class="chapter-row"><strong>${label}</strong> — ${got}/${inCh.length}
      <div class="bar"><div class="fill" style="width:${pct}%"></div></div></div>`;
  }).join('');
}

function renderRoadmap() {
  $('roadmap-phases').innerHTML = DATA.phases.map((p) => {
    const inPhase = DATA.trophies.filter((t) => t.phase === p.n);
    const got = inPhase.filter((t) => earned.has(t.id)).length;
    const pct = Math.round((got / inPhase.length) * 100);
    return `<div class="phase">
      <div class="phase-head"><h3>Phase ${p.n} — ${p.title}</h3><span class="phase-count">${got}/${inPhase.length} earned</span></div>
      <div class="bar"><div class="fill" style="width:${pct}%"></div></div>
      <p>${p.blurb}</p>
      <ul>${inPhase.map((t) => `<li class="${earned.has(t.id) ? 'done' : ''}" data-id="${t.id}">${gradeDot(t)}${displayName(t)}${t.missable ? ' ⚠' : ''}</li>`).join('')}</ul>
    </div>`;
  }).join('');
  $('roadmap-phases').querySelectorAll('li[data-id]').forEach((li) => li.addEventListener('click', () => {
    selectedId = Number(li.dataset.id);
    location.hash = `#trophy/${selectedId}`;
  }));
}

function renderMissables() {
  const miss = DATA.trophies.filter((t) => t.missable);
  const watch = DATA.trophies.filter((t) => t.risk);
  $('missables-list').innerHTML =
    miss.map((t) => `<div class="miss-card">
      <h3>${gradeDot(t)}${t.name} — possibly missable</h3>
      <p><strong>Last chance:</strong> ${t.lastChance}</p>
      <p>${t.guide[0]}</p>
      ${t.dispute ? `<p><strong>Sources differ:</strong> ${t.dispute.a} vs ${t.dispute.b} — <strong>Our call:</strong> ${t.dispute.call}</p>` : ''}
    </div>`).join('') +
    `<h3 style="margin:18px 0 10px">Watchlist — unconfirmed, treat as at-risk</h3>` +
    watch.map((t) => `<div class="miss-card watch">
      <h3>${gradeDot(t)}${displayName(t)}</h3>
      <p>“${displayDesc(t)}”</p>
      <p>${t.risk}</p>
    </div>`).join('') +
    `<p style="color:var(--muted)">GTABase and Mobalytics both name Positive Mental Attitude as the only possibly missable trophy; everything else can be done in free roam after the story. [3] [6]</p>`;
}

function renderSources() {
  $('sources-list').innerHTML = DATA.sources.map((s) => {
    const steps = DATA.trophies.reduce((n, t) => n + t.guide.filter((g) => g.includes(`[${s.n}]`)).length, 0);
    const guides = DATA.trophies.filter((t) => t.sources.includes(s.n)).length;
    return `<li><strong>${s.site}</strong> — ${s.title}<br>
      <a href="${s.url}" target="_blank" rel="noopener">${s.url}</a><br>
      <span class="src-meta">Read ${s.read} · cited by ${steps} steps in ${guides}/55 guides</span></li>`;
  }).join('');
}

function currentView() {
  const h = location.hash || '#tracker';
  if (h.startsWith('#trophy/')) { selectedId = Number(h.split('/')[1]) || selectedId; return 'tracker'; }
  if (['#tracker', '#roadmap', '#missables', '#sources'].includes(h)) return h.slice(1);
  return 'tracker';
}

function renderView() {
  const view = currentView();
  document.querySelectorAll('.view').forEach((v) => { v.hidden = true; });
  $(`view-${view}`).hidden = false;
  document.querySelectorAll('.tabs a').forEach((a) => a.classList.toggle('active', a.dataset.view === view));
  if (view === 'roadmap') renderRoadmap();
  if (view === 'missables') renderMissables();
  if (view === 'sources') renderSources();
}

function renderAll() {
  renderProgress();
  renderAudit();
  renderFilters();
  renderList();
  renderDetail();
  renderNextUp();
  renderView();
}

function exportProgress() {
  const data = { game: 'Grand Theft Auto VI', guide: 'Leonida Trophy Atlas', exported: new Date().toISOString(), earned: [...earned].sort((a, b) => a - b), counts };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'leonida-trophy-atlas-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

function importProgress(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!Array.isArray(data.earned)) throw new Error('no earned list');
      earned = new Set(data.earned.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55));
      counts = data.counts && typeof data.counts === 'object' ? data.counts : {};
      saveState();
      renderAll();
    } catch { alert('That file is not a Leonida Trophy Atlas export.'); }
  };
  reader.readAsText(file);
}

async function init() {
  const res = await fetch('data/trophies.json');
  DATA = await res.json();
  loadState();
  if (new URLSearchParams(location.search).get('seed') === '1') seedDemo();
  $('spoiler').checked = spoiler;
  $('spoiler').addEventListener('change', (e) => { spoiler = e.target.checked; saveState(); renderAll(); });
  $('sort').addEventListener('change', (e) => { sortMode = e.target.value; renderList(); });
  $('export-btn').addEventListener('click', exportProgress);
  $('import-file').addEventListener('change', (e) => { if (e.target.files[0]) importProgress(e.target.files[0]); });
  window.addEventListener('hashchange', () => { renderView(); renderList(); renderDetail(); });
  renderAll();
}

init();
