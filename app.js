let filter = "all";
let allMatches = [];

async function load() {
  let savedMatches = [];
  let apiMatches = [];

  // Load manually added matches from Supabase
  try {
    savedMatches = await getMatches();

    if (!Array.isArray(savedMatches)) {
      savedMatches = [];
    }
  } catch (error) {
    console.error("Failed to load saved matches:", error);
  }

  // Load matches from APIFootball
  try {
    const response = await fetch(
      `/api/live-scores?t=${Date.now()}`
    );

    const data = await response.json();

    console.log("Live scores API response:", data);

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to load API matches"
      );
    }

    if (Array.isArray(data.matches)) {
      apiMatches = data.matches;
    }
  } catch (error) {
    console.error("Football API error:", error);
  }

  // Prevent duplicate matches
  const apiIds = new Set(
    apiMatches.map(match => String(match.id))
  );

  allMatches = [
    ...apiMatches,
    ...savedMatches.filter(
      match => !apiIds.has(String(match.id))
    )
  ];

  render();
}

function render() {
  const container =
    document.getElementById("matches");

  if (!container) {
    console.error(
      'Element with id="matches" was not found.'
    );
    return;
  }

  // Filter matches
  const filteredMatches =
    allMatches.filter(match => {
      return (
        filter === "all" ||
        match.status === filter
      );
    });

  if (filteredMatches.length === 0) {
    container.innerHTML = `
      <p class="muted">
        No matches available.
      </p>
    `;
    return;
  }

  // Group by country and league
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
        country,
        countryFlag:
          match.countryFlag || "",
        league,
        leagueLogo:
          match.leagueLogo || "",
        matches: []
      };
    }

    groups[groupKey].matches.push(match);
  });

  // Display matches
  container.innerHTML =
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
                    alt="${group.country}"
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
                    alt="${group.league}"
                  >
                `
                : ""
            }

          </div>

          ${group.matches
            .map(match => `
              <div
                class="match"
                data-id="${match.id || ""}"
                data-source="${match.source || ""}"
                role="button"
                tabindex="0"
              >

                <div
                  class="status ${match.status || ""}"
                >
                  ${
                    match.status === "live"
                      ? `● ${match.time || "LIVE"}`
                      : match.time || ""
                  }
                </div>

                <div class="team">

                  ${
                    match.homeLogo
                      ? `
                        <img
                          src="${match.homeLogo}"
                          class="team-logo"
                          alt="${match.home || ""}"
                        >
                      `
                      : ""
                  }

                  <span>
                    ${match.home || "Home"}
                  </span>

                </div>

                <div class="score">
                  ${
                    match.status === "upcoming"
                      ? "- - -"
                      : `${match.hs ?? 0} - ${match.as ?? 0}`
                  }
                </div>

                <div class="team">

                  ${
                    match.awayLogo
                      ? `
                        <img
                          src="${match.awayLogo}"
                          class="team-logo"
                          alt="${match.away || ""}"
                        >
                      `
                      : ""
                  }

                  <span>
                    ${match.away || "Away"}
                  </span>

                </div>

              </div>
            `)
            .join("")}

        </section>
      `)
      .join("");

  // Make API matches clickable
  document
    .querySelectorAll(".match")
    .forEach(element => {

      const open = () => {
        const id =
          element.dataset.id;

        const source =
          element.dataset.source;

        openMatch(id, source);
      };

      element.addEventListener(
        "click",
        open
      );

      element.addEventListener(
        "keydown",
        event => {
          if (
            event.key === "Enter" ||
            event.key === " "
          ) {
            open();
          }
        }
      );
    });
}

function openMatch(id, source) {
  // New APIFootball matches
  if (
    source === "apifootball" &&
    id
  ) {
    window.location.href =
      `match.html?id=${encodeURIComponent(id)}`;

    return;
  }

  // Manually added matches
  console.log(
    "No detail page available for this match."
  );
}

// Filter buttons
document
  .querySelectorAll(".tabs button")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(".tabs button")
          .forEach(item => {
            item.classList.remove(
              "active"
            );
          });

        button.classList.add(
          "active"
        );

        filter =
          button.dataset.filter ||
          "all";

        render();
      }
    );
  });

// Load matches immediately
load();

// Refresh every 30 seconds
setInterval(load, 30000);
