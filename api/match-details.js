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
    const headers = {
      "x-apisports-key": key
    };

    const [fixtureResponse, statsResponse] = await Promise.all([
      fetch(
        `https://v3.football.api-sports.io/fixtures?id=${encodeURIComponent(id)}`,
        { headers }
      ),
      fetch(
        `https://v3.football.api-sports.io/fixtures/statistics?fixture=${encodeURIComponent(id)}`,
        { headers }
      )
    ]);

    const fixtureData = await fixtureResponse.json();
    const statsData = await statsResponse.json();

    if (!fixtureResponse.ok) {
      return res.status(fixtureResponse.status).json(fixtureData);
    }

    const x = fixtureData.response?.[0];

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

    const events = (x.events || []).map(event => {
      let icon = "•";

      if (event.type === "Goal") {
        icon = "⚽";
      } else if (event.type === "Card") {
        icon =
          event.detail === "Red Card" ? "🟥" : "🟨";
      } else if (event.type === "subst") {
        icon = "🔄";
      } else if (event.type === "Var") {
        icon = "📺";
      }

      return {
        time:
          event.time?.elapsed != null
            ? `${event.time.elapsed}${
                event.time.extra
                  ? `+${event.time.extra}`
                  : ""
              }'`
            : "",

        team: event.team?.name || "",
        teamLogo: event.team?.logo || "",
        player: event.player?.name || "",
        assist: event.assist?.name || "",
        type: event.type || "",
        detail: event.detail || "",
        comments: event.comments || "",
        icon
      };
    });

    const rawStats = statsResponse.ok
      ? statsData.response || []
      : [];

    const getStat = (teamData, type) => {
      const stat = teamData?.statistics?.find(
        item => item.type === type
      );

      return stat?.value ?? "-";
    };

    const homeStats = rawStats.find(
      team => team.team?.id === x.teams.home.id
    );

    const awayStats = rawStats.find(
      team => team.team?.id === x.teams.away.id
    );

    const statTypes = [
      "Ball Possession",
      "Total Shots",
      "Shots on Goal",
      "Shots off Goal",
      "Blocked Shots",
      "Corner Kicks",
      "Fouls",
      "Yellow Cards",
      "Red Cards",
      "Goalkeeper Saves",
      "Total passes",
      "Passes accurate"
    ];

    const statistics = statTypes.map(type => ({
      type,
      home: getStat(homeStats, type),
      away: getStat(awayStats, type)
    }));

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
        statusMap[x.fixture.status.short] ||
        "upcoming",

      statusText:
        x.fixture.status.long ||
        x.fixture.status.short,

      time:
        x.fixture.status.elapsed != null
          ? `${x.fixture.status.elapsed}'`
          : "",

      venue:
        x.fixture.venue?.name ||
        "Not available",

      events,
      statistics
    };

    res.setHeader(
      "Cache-Control",
      "s-maxage=10, stale-while-revalidate=20"
    );

    return res.status(200).json({ match });

  } catch (error) {
    console.error("Match details error:", error);

    return res.status(500).json({
      error: "Failed to load match details"
    });
  }
}
