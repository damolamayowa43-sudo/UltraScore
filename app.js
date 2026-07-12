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
                  alt="${group.country}">
                `
              : ""
          }

          <div class="league-info">
            <span class="country-name">
              ${group.country}
            </span>

            <strong>${group.league}</strong>
          </div>

          ${
            group.leagueLogo
              ? `<img
                  src="${group.leagueLogo}"
                  class="league-logo"
                  alt="${group.league}">
                `
              : ""
          }

        </div>

        ${group.matches.map(m => `
          <div
            class="match"
            onclick="openMatch('${m.id}', '${m.source || ""}')"
            role="button"
            tabindex="0"
          >

            <div class="status ${m.status}">
              ${
                m.status === "live"
                  ? "● " + m.time
                  : m.time
              }
            </div>

            <div class="team">

              ${
                m.homeLogo
                  ? `<img
                      src="${m.homeLogo}"
                      class="team-logo"
                      alt="${m.home}">
                    `
                  : ""
              }

              <span>${m.home}</span>

            </div>

            <div class="score">
              ${m.hs} - ${m.as}
            </div>

            <div class="team">

              ${
                m.awayLogo
                  ? `<img
                      src="${m.awayLogo}"
                      class="team-logo"
                      alt="${m.away}">
                    `
                  : ""
              }

              <span>${m.away}</span>

            </div>

          </div>
        `).join("")}

      </section>
    `).join("") ||
    `<p class="muted">No matches available.</p>`;
}

function openMatch(id, source) {
  /* Only API-Football matches have API detail pages */
  if (source
