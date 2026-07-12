let filter = "all";
let allMatches = [];

async function load() {
  try {
    // Load manually added matches
    let savedMatches = [];

    try {
      savedMatches = await getMatches();
    } catch (error) {
      console.error("Saved matches error:", error);
    }

    // Load matches from the new API
    const response = await fetch(
      "/api/live-scores?t=" + Date.now()
    );

    const data = await response.json();

    console.log("Football API response:", data);

    if (!response.ok) {
      throw new Error(
        data.error || "Football API failed"
      );
    }

    const apiMatches = Array.isArray(data.matches)
      ? data.matches
      : [];

    allMatches = [
      ...apiMatches,
      ...savedMatches
    ];

  } catch (error) {
    console.error("Failed to load API matches:", error);

    // Keep manually added matches visible
    try {
      allMatches = await getMatches();
    } catch {
      allMatches = [];
    }
  }

  render();
}

function render() {
  const container = document.getElementById("matches");

  if (!container) return;

  const filtered = allMatches.filter(match =>
    filter === "all" ||
    match.status === filter
  );

  if (filtered.length === 0) {
    container.innerHTML = `
      <p class="muted">
        No matches available.
      </p>
    `;
    return;
  }

  const groups = {};

  filtered.forEach(match => {
    const country =
      match.country || "International";

    const league =
      match.league || "Other Matches";

    const key = `${country}__${league}`;

    if (!groups[key]) {
      groups[key] = {
        country,
        countryFlag: match.countryFlag || "",
        league,
        leagueLogo: match.leagueLogo || "",
        matches: []
      };
    }

    groups[key].matches.push(match);
  });

  container.innerHTML = Object.values(groups)
    .map(group => `
      <section class="league">

        <div class="league-title">

          ${
            group.countryFlag
              ? `<img
                   src="${group.countryFlag}"
                   class="country-flag"
                   alt=""
                 >`
              : ""
          }

          <div class="league-info">
            <span class="country-name">
              ${group.country}
            </span>

            <strong>
              ${group.league}
            </strong>
          </div>

          ${
            group.leagueLogo
              ? `<img
                   src="${group.leagueLogo}"
                   class="league-logo"
                   alt=""
                 >`
              : ""
          }

        </div>

        ${group.matches.map(m => `
          <div
            class="match"
            data-id="${m.id || ""}"
            data-source="${m.source || ""}"
          >

            <div class="status ${m.status || ""}">
              ${
                m.status === "live"
                  ? `● ${m.time || "LIVE"}`
                  : m.time || ""
              }
            </div>

            <div class="team">
              ${
                m.homeLogo
                  ? `<img
                       src="${m.homeLogo}"
                       class="team-logo"
                       alt=""
                     >`
                  : ""
              }

              <span>${m.home || ""}</span>
            </div>

            <div class="score">
              ${m.hs ?? "-"} - ${m.as ?? "-"}
            </div>

            <div class="team">
              ${
                m.awayLogo
                  ? `<img
                       src="${m.awayLogo}"
                       class="team-logo"
                       alt=""
                     >`
                  : ""
              }

              <span>${m.away || ""}</span>
            </div>

          </div>
        `).join("")}

      </section>
    `).join("");

  document
    .querySelectorAll(".match")
    .forEach(element => {

      element.onclick = () => {
        const id = element.dataset.id;
        const source = element.dataset.source;

        openMatch(id, source);
      };

    });
}

function openMatch(id, source) {
  // Correct source name for your NEW API
  if (source === "apifootball" && id) {
    window.location.href =
      `match.html?id=${encodeURIComponent(id)}`;
  }
}

document
  .querySelectorAll(".tabs button")
  .forEach(button => {

    button.onclick = () => {

      document
        .querySelectorAll(".tabs button")
        .forEach(item =>
          item.classList.remove("active")
        );

      button.classList.add("active");

      filter =
        button.dataset.filter || "all";

      render();
    };

  });

load();

setInterval(load, 30000);
