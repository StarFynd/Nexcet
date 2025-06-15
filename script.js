// === script.js  (CORS-friendly version) ===
const apiKey = "f4fe89cdeecdb9d8c1c9f51f1c65c1e7";   //  ← keep your Mediastack key here

// Original Mediastack endpoint (HTTP is fine because the proxy will fetch it server-side)
const baseUrl = `http://api.mediastack.com/v1/news?access_key=${apiKey}&categories=technology&languages=en&limit=10`;

// Free CORS proxy: AllOrigins (returns raw response with the right headers)
const proxyUrl = "https://api.allorigins.win/raw?url=";    // docs: allorigins.win

async function loadNews() {
  const container = document.getElementById("news-container");
  container.textContent = "Loading news…";

  try {
    // Fetch through the proxy
    const res = await fetch(proxyUrl + encodeURIComponent(baseUrl));
    if (!res.ok) throw new Error("Network response was not ok");

    const data = await res.json();   // Mediastack JSON is unchanged

    container.innerHTML = "";        // clear the loading text

    // Mediastack wraps articles in data.data
    data.data.forEach(article => {
      const card = document.createElement("div");
      card.className = "news-card";
      card.innerHTML = `
        <h3>${article.title}</h3>
        <p>${article.description || "No description available."}</p>
        <a href="${article.url}" target="_blank">Read more</a>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error fetching news:", err);
    container.textContent = "Failed to load news.";
  }
}

loadNews();