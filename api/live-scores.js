export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const key = process.env.API_FOOTBALL_KEY;

  if (!key) {
    return res.status(500).json({
      error: "API_FOOTBALL_KEY is not configured"
    });
  }

  const headers = {
    "x-apisports-key": key
  };

  try {
    const today = new Date().toISOString().split("T")[0];

    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?date=${today}&timezone=UTC`,
      {
        headers
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "API-Football request failed",
        apiResponse: data
      });
    }

    const fixtures = data.response || [];

    const liveStatuses = [
      "1H",
      "HT",
      "2H",
      "ET",
      "BT",
      "P",
      "INT",
      "SUSP"
    ];

    const finishedStatuses = [
      "FT",
      "AET",
      "PEN"
    ];

    const matches = fixtures.map(x => {
      const short = x.fixture.status.short;

      let status = "upcoming";

      if (liveStatuses.includes(short)) {
        status = "live";
      } else if (finishedStatuses.includes(short)) {
        status = "finished";
      }

      let displayTime = "";

      if (status === "live") {
        displayTime =
          x.fixture.status.elapsed != null
            ? `${x.fixture.status.elapsed}'`
            : "LIVE";
      } else if (status === "finished") {
        displayTime = "FT";
      } else {
        displayTime = new Date(
          x.fixture.date
        ).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "UTC"
        });
      }

      return {
        id: x.fixture.id,

        league: x.league.name,
        leagueLogo: x.league.logo || "",

        country:
          x.league.country ||
          "International",

        countryFlag:
          x.league.flag || "",

        home: x.teams.home.name,
        homeLogo:
          x.teams.home.logo || "",

        away: x.teams.away.name,
        awayLogo:
          x.teams.away.logo || "",

        hs: x.goals.home ?? 0,
        as: x.goals.away ?? 0,

        status,
        time: displayTime,

        fixtureStatus: short,
        kickoff: x.fixture.date,

        source: "api-football"
      };
    });

    const order = {
      live: 0,
      upcoming: 1,
      finished: 2
    };

    matches.sort((a, b) => {
      if (
        order[a.status] !==
        order[b.status]
      ) {
        return (
          order[a.status] -
          order[b.status]
        );
      }

      return (
        new Date(a.kickoff) -
        new Date(b.kickoff)
      );
    });

    res.setHeader(
      "Cache-Control",
      "no-store"
    );

    return res.status(200).json({
      dateRequested: today,

      apiErrors:
        data.errors || {},

      apiResults:
        data.results ?? null,

      apiParameters:
        data.parameters || {},

      responseCount:
        fixtures.length,

      matches
    });

  } catch (error) {
    console.error(
      "Live scores error:",
      error
    );

    return res.status(500).json({
      error:
        "Failed to load football matches",

      message:
        error.message
    });
  }
}
