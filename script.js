/* ====== CONFIG ====== */
const mediastackKey = "f4fe89cdeecdb9d8c1c9f51f1c65c1e7";
const gnewsKey      = "0dc86fce5370555738557352308711d8";
const proxy         = "https://api.allorigins.win/raw?url=";

/* ====== RUNTIME STATE ====== */
const PAGE_SIZE       = 10;
const CACHE_MINUTES   = 30;
const englishRatioMin = 0.6;

let route     = "home";
let page      = 1;
let loading   = false;
let endOfFeed = false;

/* ====== DOM REFS ====== */
const spinner       = document.getElementById("spinner");
const newsContainer = document.getElementById("news-container");
const navMenu       = document.getElementById("nav-menu");
const burger        = document.getElementById("menu-toggle");

/* ====== ROUTE KEYWORDS ====== */
const ROUTES = {
  home:               "technology",
  "artificial-intelligence": "artificial-intelligence",
  cybersecurity:       "cybersecurity",
  games:               "gaming",
  software:            "software",
  hardware:            "hardware",
  startups:            "startup",
  leaders:             "tech leaders",
  inventions:          "invention"
};

/* ====== INIT ====== */
window.addEventListener("hashchange", onRouteChange);
window.addEventListener("scroll", onScroll);
burger.addEventListener("click", () => navMenu.classList.toggle("hidden"));
navMenu.addEventListener("click", e => {
  if (e.target.tagName === "A") navMenu.classList.add("hidden");
});
onRouteChange();

/* ====== ROUTING ====== */
function onRouteChange() {
  route      = location.hash.replace("#", "") || "home";
  page       = 1;
  endOfFeed  = false;
  newsContainer.innerHTML = "";
  loadPage();
}

/* ====== INFINITE SCROLL ====== */
function onScroll() {
  if (loading || endOfFeed) return;
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 150) {
    page += 1;
    loadPage();
  }
}

/* ====== MAIN FETCH FLOW ====== */
async function loadPage() {
  loading = true;
  spinner.classList.remove("hidden");

  const keyword = ROUTES[route] || "technology";
  const cacheKey = `nex_${route}_${page}`;
  const now = Date.now();

  const cached = localStorage.getItem(cacheKey);
  const cachedTs = localStorage.getItem(`${cacheKey}_ts`);
  if (cached && cachedTs && now - cachedTs < CACHE_MINUTES * 60 * 1000) {
    render(JSON.parse(cached));
    finishLoad();
    return;
  }

  let articles = await fetchMediastack(keyword, page);
  if (!articles.length) articles = await fetchGNews(keyword, page);

  if (articles.length) {
    localStorage.setItem(cacheKey, JSON.stringify(articles));
    localStorage.setItem(`${cacheKey}_ts`, now.toString());
    render(articles);
    if (articles.length < PAGE_SIZE) endOfFeed = true;
  } else {
    if (page === 1) newsContainer.innerHTML = "<p>No articles found.</p>";
    endOfFeed = true;
  }
  finishLoad();
}

function finishLoad() {
  spinner.classList.add("hidden");
  loading = false;
}

/* ====== PROVIDERS ====== */
async function fetchMediastack(keyword, p) {
  const offset = (p - 1) * PAGE_SIZE;
  const url = `http://api.mediastack.com/v1/news?access_key=${mediastackKey}&keywords=${encodeURIComponent(keyword)}&limit=${PAGE_SIZE}&offset=${offset}`;
  try {
    const res = await fetch(proxy + encodeURIComponent(url));
    const j = await res.json();
    return j.data || [];
  } catch { return []; }
}

async function fetchGNews(keyword, p) {
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(keyword)}&token=${gnewsKey}&lang=en&max=${PAGE_SIZE}&page=${p}`;
  try {
    const res = await fetch(proxy + encodeURIComponent(url));
    const j = await res.json();
    return (j.articles || []).map(a => ({
      title: a.title,
      description: a.description,
      image: a.image,
      url: a.url
    }));
  } catch { return []; }
}

/* ====== RENDER ====== */
function render(list) {
  const english = list.filter(a => {
    const txt = `${a.title} ${a.description || ""}`;
    const en  = (txt.match(/[a-zA-Z]/g) || []).length;
    return en / txt.length > englishRatioMin;
  });

  newsContainer.insertAdjacentHTML(
    "beforeend",
    english.map(cardTemplate).join("")
  );
}

function cardTemplate(a) {
  const img = a.image && a.image.trim();
  const host = new URL(a.url).hostname.replace(/^www\\./, "");
  return `
    <div class="news-card"
         data-title="${escapeHtml(a.title)}"
         data-desc="${escapeHtml(a.description || "")}"
         data-img="${img || ""}"
         data-link="${a.url}">
      ${img ? `<img class="news-thumb" src="${img}" alt="">` : ""}
      <div class="news-content">
        <h3>${a.title}</h3>
        <p class="src-time">${host}</p>
        <a href="#" class="read-more">Read more</a>
      </div>
    </div>`;
}

/* ====== MODAL ====== */
const modal      = document.getElementById("modal");
const mClose     = document.getElementById("modal-close");
const mTitle     = document.getElementById("modal-title");
const mDesc      = document.getElementById("modal-desc");
const mImg       = document.getElementById("modal-image");
const mLink      = document.getElementById("modal-link");

newsContainer.addEventListener("click", e => {
  const card = e.target.closest(".news-card");
  if (!card) return;
  e.preventDefault();

  mTitle.textContent = card.dataset.title;
  mDesc.textContent  = card.dataset.desc || "No description.";
  mLink.href         = card.dataset.link;

  if (card.dataset.img) {
    mImg.src = card.dataset.img;
    mImg.style.display = "block";
  } else {
    mImg.style.display = "none";
  }
  modal.classList.remove("hidden");
});

mClose.onclick = () => modal.classList.add("hidden");
modal.addEventListener("click", e => { if (e.target === modal) modal.classList.add("hidden"); });

/* ====== HELPERS ====== */
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
}