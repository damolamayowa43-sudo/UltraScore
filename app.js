let filter = "all";
let allMatches = [];

async function load() {
  try {
    allMatches = await getMatches();

    const response = await fetch("/api/live-scores");

    if (response.ok) {
      const data = await response.json();
      const apiMatches = data.matches || [];

      const apiIds = new Set(apiMatches.map(match => match.id));

      allMatches = [
        ...apiMatches,
        ...allMatches.filter(match => !apiIds.has(match.id))
      ];
    }
  } catch (error) {
    console.error("Failed to load matches:", error);
  }

  render();
}

function render() {
  const filteredMatches = allMatches.filter(
    match => filter === "all" || match.status === filter
  );

  const groups = {};

  filteredMatches.forEach(match => {
    const groupKey =
      `${match.country || "International"}__${match.league}`;

    if (!groups[groupKey]) {
      groups[groupKey] = {
        country: match.country || "International",
        countryFlag: match.countryFlag || "",
        league: match.league,
        leagueLogo: match.leagueLogo || "",
        matches: []
      };
    }

    groups[groupKey].matches.push(match);
  });

  matches.innerHTML =
    Object.values(groups).map(group => `
      <section class="league">

        <div class="league-title">

          ${
            group.countryFlag
              ? `<img
                   src="${group.countryFlag}"
                   class="country-flag"
                   alt="${group.country}"
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
                   alt="${group.league}"
                 >`
              : ""
          }

        </div>

        ${group.matches.map(match => `
          <div class="match">

            <div class="status ${match.status}">
              ${
                match.status === "live"
                  ? "● " + match.time
                  : match.time
              }
            </div>

            <div class="team">
              ${
                match.homeLogo
                  ? `<img
                       src="${match.homeLogo}"
                       class="team-logo"
                       alt="${match.home}"
                     >`
                  : ""
              }

              <span>${match.home}</span>
            </div>

            <div class="score">
              ${match.hs} - ${match.as}
            </div>

            <div class="team">
              ${
                match.awayLogo
                  ? `<img
                       src="${match.awayLogo}"
                       class="team-logo"
                       alt="${match.away}"
                     >`
                  : ""
              }

              <span>${match.away}</span>
            </div>

          </div>
        `).join("")}

      </section>
    `).join("") ||
    `<p class="muted">No matches available.</p>`;
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

      filter = button.dataset.filter;

      render();
    };
  });

load();

/* Refresh scores every 30 seconds */
setInterval(load, 30000);
