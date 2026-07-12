let filter = "all";
let allMatches = [];

async function load() {
  try {
    // Load matches saved in Supabase
    allMatches = await getMatches();

    // Load live matches from API-Football
    const response = await fetch("/api/live-scores");

    if (response.ok) {
      const data = await response.json();
      const apiMatches = data.matches || [];

      const apiIds = new Set(
        apiMatches.map(match => String(match.id))
      );

      allMatches = [
        ...apiMatches,
        ...allMatches.filter(
          match => !apiIds.has(String(match.id))
        )
      ];
    } else {
      console.error(
        "Live scores API error:",
        response.status
      );
    }
  } catch (error) {
    console.error("Failed to load matches:", error);
  }

  render();
}

function render() {
  const matchesContainer =
    document.getElementById("matches");

  if (!matchesContainer) {
    console.error(
      'Element with id="matches" was not found.'
    );
    return;
  }

  const filteredMatches = allMatches.filter(
    match =>
      filter === "all" ||
      match.status === filter
  );

  const groups = {};

  filteredMatches.forEach(match => {
    const country =
      match.country || "International";

    const league =
      match.league || "Other Matches";

    const groupKey =
      `${country}__${league}`;

    if (!groups[groupKey]) {
      groups[groupKey] = {
        country: country,
        countryFlag:
          match.countryFlag || "",
        league: league,
        leagueLogo:
          match.leagueLogo || "",
        matches: []
      };
    }

    groups[groupKey].matches.push(match);
  });

  if (Object.keys(groups).length === 0) {
    matchesContainer.innerHTML =
      `<p class="muted">
        No matches available.
      </p>`;
    return;
  }

  matchesContainer.innerHTML =
    Object.values(groups)
      .map(group => `
        <section class="league">

          <div class="league-title">

            ${
              group.countryFlag
                ? `
                  <img
                    src="${group.countryFlag}"
                    class="country-flag"
                    alt=""
                  >
                `
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
                ? `
                  <img
                    src="${group.leagueLogo}"
                    class="league-logo"
                    alt=""
                  >
                `
                : ""
            }

          </div>

          ${group.matches
            .map(m => `
              <div
                class="match"
                data-id="${m.id}"
                data-source="${m.source || ""}"
              >

                <div
                  class="status ${m.status || ""}"
                >
                  ${
                    m.status === "live"
                      ? `● ${m.time || ""}`
                      : `${m.time || ""}`
                  }
                </div>

                <div class="team">

                  ${
                    m.homeLogo
                      ? `
                        <img
                          src="${m.homeLogo}"
                          class="team-logo"
                          alt=""
                        >
                      `
                      : ""
                  }

                  <span>
                    ${m.home || ""}
                  </span>

                </div>

                <div class="score">
                  ${m.hs ?? "-"}
                  -
                  ${m.as ?? "-"}
                </div>

                <div class="team">

                  ${
                    m.awayLogo
                      ? `
                        <img
                          src="${m.awayLogo}"
                          class="team-logo"
                          alt=""
                        >
                      `
                      : ""
                  }

                  <span>
                    ${m.away || ""}
                  </span>

                </div>

              </div>
            `)
            .join("")}

        </section>
      `)
      .join("");

  document
    .querySelectorAll(".match")
    .forEach(matchElement => {
      matchElement.onclick = () => {
        const id =
          matchElement.dataset.id;

        const source =
          matchElement.dataset.source;

        openMatch(id, source);
      };
    });
}

function openMatch(id, source) {
  // Only open detail page for API-Football matches
  if (
    source === "api-football" &&
    id
  ) {
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

// Load immediately
load();

// Refresh every 30 seconds
setInterval(load, 30000);
