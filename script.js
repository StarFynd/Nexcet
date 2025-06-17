const apiKey = "f4fe89cdeecdb9d8c1c9f51f1c65c1e7"; // Replace with your Mediastack API key
const newsContainer = document.getElementById("news-container");
const categorySelect = document.getElementById("category-select");

async function loadNews(category = "artificial-intelligence") {
  newsContainer.innerHTML = "Loading news…";

  try {
    const response = await fetch(`https://api.mediastack.com/v1/news?access_key=${apiKey}&categories=technology&keywords=${category}&limit=10`);
    const data = await response.json();

    if (!data || !data.data || data.data.length === 0) {
      newsContainer.innerHTML = "<p>No news found for this category.</p>";
      return;
    }

    newsContainer.innerHTML = data.data.map(article => `
      <div class="news-card">
        <h3>${article.title}</h3>
        <a href="${article.url}" target="_blank">Read more</a>
      </div>
    `).join("");

  } catch (error) {
    console.error("Error loading news:", error);
    newsContainer.innerHTML = "<p>Failed to load news.</p>";
  }
}

// Load default on start
loadNews();

// When category changes
categorySelect.addEventListener("change", () => {
  const selected = categorySelect.value;
  loadNews(selected);
});