const gKey = "0dc86fce5370555738557352308711d8";
const newsKey = "1b044ba49d7c4f5c9a43e3ef3a1fd27e";
const proxy = "https://api.allorigins.win/raw?url=";
const PAGE = 10;

const KEY = {
  home: "technology",
  "artificial-intelligence": "openai OR gpt OR nvidia",
  cybersecurity: "cybersecurity",
  games: "video games",
  software: "software development",
  hardware: "hardware",
  startups: "startup OR funding",
  leaders: "tech leaders OR elon musk",
  inventions: "innovation OR discovery"
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
let seenUrls, seenTitles;
// Toggle drawer
burger.onclick = () => drawer.classList.toggle("open");
drawer.onclick = e => {
  if (e.target.tagName === "A") drawer.classList.remove("open");
};

// Handle routing
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

  // Reset duplicates every time you switch sections
  seenUrls = new Set();
  seenTitles = new Set();

  const { icon, label, cls } = TITLES[route] || {};
  view.innerHTML = `
    <h2 class="section-title ${cls}"><i data-lucide="${icon}"></i> ${label}</h2>
    <div id="feed"></div>
    <div id="spinner">Loading...</div>
  `;
  lucide.createIcons();
  loadPage();
}

// Scroll handler
window.addEventListener("scroll", () => {
  if (loading || end || location.hash.startsWith("#article/")) return;
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
    page++;
    loadPage();
  }
});

// Load page from both APIs
async function loadPage() {
  loading = true;
  const spinner = document.getElementById("spinner");
  if (spinner) spinner.innerText = "Loading more articles...";

  const query = KEY[route] || "technology";
  const gUrl = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&token=${gKey}&lang=en&max=${PAGE}&page=${page}`;
  const nUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&apiKey=${newsKey}&language=en&pageSize=${PAGE}&page=${page}&sortBy=publishedAt`;

  try {
    const [gData, nData] = await Promise.all([
      fetch(proxy + encodeURIComponent(gUrl)).then(res => res.json()),
      fetch(proxy + encodeURIComponent(nUrl)).then(res => res.json())
    ]);

    let gList = (gData.articles || []).map(a => ({
      title: a.title,
      url: a.url,
      image: a.image,
      description: a.description,
      publishedAt: a.publishedAt,
      source: new URL(a.url).hostname
    }));

    let nList = (nData.articles || []).map(a => ({
      title: a.title,
      url: a.url,
      image: a.urlToImage,
      description: a.description,
      publishedAt: a.publishedAt,
      source: a.source.name
    }));

    const merged = [...gList, ...nList]
      .filter(a => a.image && a.title && a.url && a.description)
      .filter(a => {
        const isDuplicate = seenUrls.has(a.url) || seenTitles.has(a.title);
        if (!isDuplicate) {
          seenUrls.add(a.url);
          seenTitles.add(a.title);
        }
        return !isDuplicate;
      });

    if (merged.length === 0 && page >= 4) {
  end = true;
  spinner.innerText = "✅ No more unique articles.";
  return;
}

    render(merged);
    if (merged.length < PAGE * 2) end = true;
    spinner.innerText = "";
  } catch (e) {
    spinner.innerText = "❌ Failed to load. Try refreshing.";
    console.error(e);
  }

  loading = false;
}

// Render cards
function render(list) {
  const feed = document.getElementById("feed");
  if (!feed) return;

  list.forEach(a => {
    const timeAgo = formatTime(a.publishedAt);
    const card = document.createElement("div");
    card.className = "news-card";
    card.dataset.url = a.url;
    card.dataset.title = a.title;
    card.dataset.image = a.image;
    card.dataset.meta = `${a.source} · ${timeAgo}`;
    card.dataset.description = a.description;

    card.innerHTML = `
      <h3>${a.title}</h3>
      <img src="${a.image}" loading="lazy" />
      <p class="article-meta">${a.source} · ${timeAgo}</p>
    `;

    feed.appendChild(card);
  });
}

// Click to view full article
view.onclick = e => {
  const card = e.target.closest(".news-card");
  if (card) {
    const url = encodeURIComponent(card.dataset.url);
    location.hash = `article/${url}`;
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

// Format time
function formatTime(dateString) {
  const time = new Date(dateString).getTime();
  const diff = Math.floor((Date.now() - time) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  const hours = Math.floor(diff / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}