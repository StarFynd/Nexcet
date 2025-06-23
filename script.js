/* ===== 1.  YOUR API KEYS ===== */
const msKey = "f4fe89cdeecdb9d8c1c9f51f1c65c1e7";   // ← put real key
const gKey  = "0dc86fce5370555738557352308711d8";        // ← put real key

/* ===== 2.  CONSTANTS ===== */
const proxy          = "https://api.allorigins.win/raw?url=";
const PAGE_SIZE      = 10;
const CACHE_MIN      = 30;          // minutes
const EN_THRESHOLD   = 0.6;         // 60 % English chars

/* ===== 3.  ROUTE → KEYWORD MAP ===== */
const KEYWORDS = {
  home: "technology",
  "artificial-intelligence": "artificial-intelligence",
  cybersecurity: "cybersecurity",
  games: "gaming",
  software: "software",
  hardware: "hardware",
  startups: "startup",
  leaders: "tech leaders",
  inventions: "invention"
};

/* ===== 4.  DOM REFS ===== */
const view   = document.getElementById("view");
const burger = document.getElementById("burger");
const drawer = document.getElementById("drawer");

/* ===== 5.  GLOBAL STATE ===== */
let route   = "home";
let page    = 1;
let loading = false;
let end     = false;
const pages = {};              // { route: {pageN: [...]} }

/* =====================================================
   HELPERS
   ===================================================== */
const esc = s =>
  s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

function isEnglish(t) {
  const en = (t.match(/[a-zA-Z]/g) || []).length;
  return en / t.length > EN_THRESHOLD;
}

/* =====================================================
   DRAWER
   ===================================================== */
burger.addEventListener("click", () => drawer.classList.toggle("open"));
drawer.addEventListener("click", e => {
  if (e.target.tagName === "A") drawer.classList.remove("open");
});

/* =====================================================
   ROUTER
   ===================================================== */
window.addEventListener("hashchange", onRoute);
function onRoute() {
  if (location.hash.startsWith("#article/")) {
    const url = decodeURIComponent(location.hash.split("/")[1]);
    return showArticle(url);
  }
  route = location.hash.slice(1) || "home";
  page  = 1; end = false; loading = false;
  view.innerHTML = `<div id="feed"></div><div id="spinner">Loading…</div>`;
  loadPage();
}
onRoute();

/* =====================================================
   INFINITE SCROLL
   ===================================================== */
window.addEventListener("scroll", () => {
  if (loading || end || location.hash.startsWith("#article/")) return;
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    page += 1;
    loadPage();
  }
});

/* =====================================================
   MAIN LOAD
   ===================================================== */
async function loadPage() {
  loading = true;
  document.getElementById("spinner").classList.remove("hidden");

  const kw   = KEYWORDS[route] || "technology";
  const cKey = `nex_${route}_${page}`;
  const now  = Date.now();

  const cached = localStorage.getItem(cKey);
  const ts     = localStorage.getItem(`${cKey}_ts`);
  if (cached && ts && now - ts < CACHE_MIN * 60 * 1000) {
    render(JSON.parse(cached));
    return finish();
  }

  let items = await fetchMS(kw, page);
  if (!items.length) items = await fetchGNews(kw, page);

  if (items.length) {
    localStorage.setItem(cKey, JSON.stringify(items));
    localStorage.setItem(`${cKey}_ts`, now.toString());
    render(items);
    if (items.length < PAGE_SIZE) end = true;
  } else {
    if (page === 1)
      document.getElementById("feed").innerHTML = "<p>No articles found.</p>";
    end = true;
  }
  finish();
}

function finish() {
  document.getElementById("spinner").classList.add("hidden");
  loading = false;
}

/* =====================================================
   PROVIDERS
   ===================================================== */
async function fetchMS(kw, p) {
  const off = (p - 1) * PAGE_SIZE;
  const url = `http://api.mediastack.com/v1/news?access_key=${msKey}&keywords=${encodeURIComponent(kw)}&limit=${PAGE_SIZE}&offset=${off}`;
  try {
    const r = await fetch(proxy + encodeURIComponent(url));
    const j = await r.json();
    return j.data || [];
  } catch { return []; }
}

async function fetchGNews(kw, p) {
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(kw)}&token=${gKey}&lang=en&max=${PAGE_SIZE}&page=${p}`;
  try {
    const r = await fetch(proxy + encodeURIComponent(url));
    const j = await r.json();
    return (j.articles || []).map(a => ({
      title: a.title,
      description: a.description,
      image: a.image,
      url: a.url
    }));
  } catch { return []; }
}

/* =====================================================
   RENDER LIST
   ===================================================== */
function render(list) {
  const feed = document.getElementById("feed");
  list
    .filter(a => isEnglish(`${a.title} ${a.description || ""}`))
    .forEach(a => {
      const host = new URL(a.url).hostname.replace(/^www\\./, "");
      feed.insertAdjacentHTML(
        "beforeend",
        `<div class="news-card" data-url="${a.url}">
           ${a.image ? `<img src="${a.image}" loading="lazy">` : ""}
           <h3>${esc(a.title)}</h3>
           <p class="article-meta">${host}</p>
         </div>`
      );
    });
}

/* =====================================================
   CLICK → ARTICLE
   ===================================================== */
view.addEventListener("click", e => {
  const card = e.target.closest(".news-card");
  if (!card) return;
  location.hash = `article/${encodeURIComponent(card.dataset.url)}`;
});

/* =====================================================
   ARTICLE VIEW
   ===================================================== */
function showArticle(url) {
  const article = findArticle(url);
  if (!article) {
    history.back();
    return;
  }
  const host = new URL(article.url).hostname.replace(/^www\\./, "");
  view.innerHTML = `
    <button id="back">← Back</button>
    <article class="article-full">
      ${article.image ? `<img src="${article.image}">` : ""}
      <h2>${esc(article.title)}</h2>
      <p class="article-meta">${host}</p>
      <p>${esc(article.description || "No description available.")}</p>
      <a href="${article.url}" target="_blank">Read original ↗</a>
    </article>`;
  document.getElementById("back").onclick = () => history.back();
}

function findArticle(url) {
  if (!pages[route]) return null;
  for (const pg in pages[route]) {
    const art = pages[route][pg].find(a => a.url === url);
    if (art) return art;
  }
  return null;
}