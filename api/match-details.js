export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const id = req.query.id;
  const key = process.env.API_FOOTBALL_KEY;

  if (!id) {
    return res.status(400).json({ error: "Match ID is required" });
  }

  if (!key) {
    return res.status(500).json({
      error: "API_FOOTBALL_KEY is not configured"
    });
  }

  try {
    const response = await fetch(
      `https://v3.football.api-sports.io/fixtures?id=${encodeURIComponent(id)}`,
      {
        headers: {
          "x-apisports-key": key
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const x = data.response?.[0];

    if (!x) {
      return res.status(404).json({ error: "Match not found" });
    }

    const statusMap = {
      NS: "upcoming",
      TBD: "upcoming",
      "1H": "live",
      HT: "live",
      "2H": "live",
      ET: "live",
      BT: "live",
      P: "live",
      SUSP: "live",
      INT: "live",
      FT: "finished",
      AET: "finished",
      PEN: "finished"
    };

    const match = {
      id: x.fixture.id,

      league: x.league.name,
      country: x.league.country,
      leagueLogo: x.league.logo,

      home: x.teams.home.name,
      away: x.teams.away.name,

      homeLogo: x.teams.home.logo,
      awayLogo: x.teams.away.logo,

      hs: x.goals.home ?? 0,
      as: x.goals.away ?? 0,

      status:
        statusMap[x.fixture.status.short] || "upcoming",

      statusText:
        x.fixture.status.long || x.fixture.status.short,

      time:
        x.fixture.status.elapsed != null
          ? `${x.fixture.status.elapsed}'`
          : "",

      venue:
        x.fixture.venue?.name || "Not available"
    };

    res.setHeader(
      "Cache-Control",
      "s-maxage=10, stale-while-revalidate=20"
    );

    return res.status(200).json({ match });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Failed to load match details"
    });
  }
}
