let filter = "all";
let allMatches = [];

async function load() {
  let savedMatches = [];
  let apiMatches = [];

  // LOAD MANUALLY ADDED MATCHES
  try {
    savedMatches = await getMatches();

    if (!Array.isArray(savedMatches)) {
      savedMatches = [];
    }
  } catch (error) {
    console.error(
      "Failed to load saved matches:",
      error
    );
  }

  // LOAD API FOOTBALL MATCHES
  try {
    const response = await fetch(
      `/api/live-scores?t=${Date.now()}`
    );

    const data = await response.json();

    console.log(
      "Football API response:",
      data
    );

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Failed to load API matches"
      );
    }

    if (Array.isArray(data.matches)) {
      apiMatches = data.matches;
    }

  } catch (error) {
    console.error(
      "Football API error:",
      error
    );
  }

  // PREVENT DUPLICATES
  const apiIds = new Set(
    apiMatches.map(match =>
      String(match.id)
    )
  );

  allMatches = [
    ...apiMatches,

    ...savedMatches.filter(match =>
      !apiIds.has(
        String(match.id)
      )
    )
  ];

  render();
}

function render() {
  const container =
    document.getElementById("matches");

  if (!container) {
    console.error(
      'Element with id="matches" not found.'
    );

    return;
  }

  // FILTER MATCHES
  const filteredMatches =
    allMatches.filter(match => {

      if (filter === "all") {
        return true;
      }

      return match.status === filter;
    });

  if (filteredMatches.length === 0) {
    container.innerHTML = `
      <p class="muted">
        No matches available.
      </p>
    `;

    return;
  }

  // GROUP MATCHES
  const groups = {};

  filteredMatches.forEach(match => {
    const country =
      match.country ||
      "International";

    const league =
      match.league ||
      "Other Matches";

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

    groups[groupKey]
      .matches
      .push(match);
  });

  // CREATE HTML
  container.innerHTML =
    Object.values(groups)
      .map(group => {

        return `
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
              .map(match => {

                const isUpcoming =
                  match.status ===
                  "upcoming";

                const score =
                  isUpcoming
                    ? "VS"
                    : `${
                        match.hs ?? 0
                      } - ${
                        match.as ?? 0
                      }`;

                return `
                  <div
                    class="match"
                    data-id="${
                      match.id || ""
                    }"
                    data-source="${
                      match.source || ""
                    }"
                    role="button"
                    tabindex="0"
                  >

                    <div
                      class="status ${
                        match.status || ""
                      }"
                    >

                      ${
                        match.status ===
                        "live"
                          ? `● ${
                              match.time ||
                              "LIVE"
                            }`
                          : match.time || ""
                      }

                    </div>

                    <div class="team">

                      ${
                        match.homeLogo
                          ? `
                            <img
                              src="${
                                match.homeLogo
                              }"
                              class="team-logo"
                              alt=""
                            >
                          `
                          : ""
                      }

                      <span>
                        ${
                          match.home ||
                          "Home"
                        }
                      </span>

                    </div>

                    <div class="score">
                      ${score}
                    </div>

                    <div class="team">

                      ${
                        match.awayLogo
                          ? `
                            <img
                              src="${
                                match.awayLogo
                              }"
                              class="team-logo"
                              alt=""
                            >
                          `
                          : ""
                      }

                      <span>
                        ${
                          match.away ||
                          "Away"
                        }
                      </span>

                    </div>

                  </div>
                `;
              })
              .join("")}

          </section>
        `;
      })
      .join("");

  // MAKE MATCHES CLICKABLE
  document
    .querySelectorAll(".match")
    .forEach(element => {

      function open() {
        const id =
          element.dataset.id;

        const source =
          element.dataset.source;

        openMatch(
          id,
          source
        );
      }

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
            event.preventDefault();

            open();
          }

        }
      );

    });
}

function openMatch(
  id,
  source
) {

  // APIFOOTBALL MATCH
  if (
    source === "apifootball" &&
    id
  ) {

    window.location.href =
      `match.html?id=${
        encodeURIComponent(id)
      }`;

    return;
  }

  // MANUALLY ADDED MATCH
  console.log(
    "No details available for manually added match."
  );
}

// FILTER BUTTONS
document
  .querySelectorAll(
    ".tabs button"
  )
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        document
          .querySelectorAll(
            ".tabs button"
          )
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

// INITIAL LOAD
load();

// REFRESH EVERY 30 SECONDS
setInterval(
  load,
  30000
);
