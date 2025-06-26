const gKey = "0dc86fce5370555738557352308711d8";
const proxy = "https://api.allorigins.win/raw?url=";
const PAGE = 10;

const KEY = {
  home: "technology",
  "artificial-intelligence": "artificial-intelligence",
  cybersecurity: "cybersecurity",
  games: '"video games" OR gaming',
  software: "software development",
  hardware: "hardware",
  startups: "startup OR funding",
  leaders: "tech leaders",
  inventions: "invention OR discovery"
};

const TITLES = {
  home: { icon: "home", label: "Home", cls: "home" },
  "artificial-intelligence": { icon: "bot", label: "AI", cls: "ai" },
  cybersecurity: { icon: "shield", label: "Cybersecurity", cls: "cyber" },
  games: { icon: "gamepad-2", label: "Games", cls: "games" },
  software: { icon: "code", label: "Software", cls: "software" },
  hardware: { icon: "cpu", label: "Hardware", cls: "hardware" },
  startups: { icon: "rocket", label: "Startups", cls: "startups" },
  leaders: { icon: "user", label: "Tech Leaders", cls: "leaders" },
  inventions: { icon: "lightbulb", label: "Inventions", cls: "inventions" }
};

const view = document.getElementById("view");
const drawer = document.getElementById("drawer");
const burger = document.getElementById("burger");

let route = "home";
let page = 1;
let loading = false;
let end = false;
let seenUrls = new Set();

// Handle menu toggle
burger.onclick = () => drawer.classList.toggle("open");
drawer.onclick = e => {
  if (e.target.tagName === "A") drawer.classList.remove("open");
};

// Main router
window.addEventListener("hashchange", router);
window.addEventListener("load", router);

function router() {
  if (location.hash.startsWith("#article/")) {
    const url = decodeURIComponent(location.hash.split("/")[1]);
    return showArticle(url);
  }

  route = location.hash.slice(1) || "home";
  page = 1;
  end = false;
  loading = false;
  seenUrls.clear();

  const { icon, label, cls } = TITLES[route] || {};
  view.innerHTML = `
    <h2 class="section-title ${cls}"><i data-lucide="${icon}"></i> ${label}</h2>
    <div id="feed"></div>
    <div id="spinner">Loading...</div>
  `;
  lucide.createIcons();
  loadPage();
}

// Scroll to load more
window.onscroll = () => {
  if (loading || end || location.hash.startsWith("#article/")) return;
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
    page++;
    loadPage();
  }
};

// Load and render articles
async function loadPage() {
  loading = true;
  const spinner = document.getElementById("spinner");
  spinner?.classList.remove("hidden");

  const query = KEY[route] || "technology";
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&token=${gKey}&lang=en&max=${PAGE}&page=${page}`;
  
  try {
    const res = await fetch(proxy + encodeURIComponent(url));
    const data = await res.json();
    const articles = (data.articles || [])
      .filter(a => a.image && a.title && a.url && a.description)
      .filter(a => {
        if (seenUrls.has(a.url)) return false;
        seenUrls.add(a.url);
        return true;
      });
    render(articles);
    if (articles.length < PAGE) end = true;
  } catch (e) {
    console.error("Failed to load articles", e);
  }

  spinner?.classList.add("hidden");
  loading = false;
}

// Render article cards
function render(list) {
  const feed = document.getElementById("feed");
  if (!feed) return;

  list.forEach(a => {
    const host = new URL(a.url).hostname.replace(/^www\./, '');
    const timeAgo = formatTime(a.publishedAt);

    const card = document.createElement("div");
    card.className = "news-card";
    card.dataset.url = a.url;
    card.dataset.title = a.title;
    card.dataset.image = a.image;
    card.dataset.meta = `${host} · ${timeAgo}`;
    card.dataset.description = a.description;

    card.innerHTML = `
      <h3>${a.title}</h3>
      <img src="${a.image}" loading="lazy" />
      <p class="article-meta">${host} · ${timeAgo}</p>
    `;

    feed.appendChild(card);
  });
}

// Article view
view.onclick = e => {
  const card = e.target.closest(".news-card");
  if (card) {
    const encoded = encodeURIComponent(card.dataset.url);
    location.hash = `article/${encoded}`;
  }
};

function showArticle(encodedUrl) {
  const url = decodeURIComponent(encodedUrl);
  const card = [...document.querySelectorAll(".news-card")].find(c => c.dataset.url === url);
  if (!card) return history.back();

  const { title, image, meta, description } = card.dataset;

  view.innerHTML = `
    <button id="back">← Back</button>
    <article class="article-full">
      ${image ? `<img src="${image}" alt="">` : ""}
      <h2>${title}</h2>
      <p class="article-meta">${meta}</p>
      <p>${description}</p>
      <a class="read-button" href="${url}" target="_blank">Read Full Article ↗</a>
    </article>
  `;

  document.getElementById("back").onclick = () => history.back();
}

// Time formatting
function formatTime(dateString) {
  const time = new Date(dateString).getTime();
  const diff = Math.floor((Date.now() - time) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}