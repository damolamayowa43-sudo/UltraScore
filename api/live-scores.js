export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.API_FOOTBALL_KEY;

  if (!key) {
    return res.status(500).json({
      error: "API_FOOTBALL_KEY is not configured"
    });
  }

  // Today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split("T")[0];

  const r = await fetch(
    `https://v3.football.api-sports.io/fixtures?date=${today}`,
    {
      headers: {
        "x-apisports-key": key
      }
    }
  );

  const data = await r.json();

  if (!r.ok) {
    return res.status(r.status).json(data);
  }

  const liveStatuses = ["1H", "HT", "2H", "ET", "BT", "P", "INT"];
  const finishedStatuses = ["FT", "AET", "PEN"];

  const matches = (data.response || []).map(x => {
    const short = x.fixture.status.short;

    let status = "upcoming";

    if (liveStatuses.includes(short)) {
      status = "live";
    } else if (finishedStatuses.includes(short)) {
      status = "finished";
    }

    let displayTime;

    if (status === "live") {
      displayTime = x.fixture.status.elapsed
        ? `${x.fixture.status.elapsed}'`
        : "LIVE";
    } else if (status === "finished") {
      displayTime = "FT";
    } else {
      displayTime = new Date(
        x.fixture.date
      ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });
    }

    return {
      id: x.fixture.id,

      league: x.league.name,
      leagueLogo: x.league.logo,
      country: x.league.country,
      countryFlag: x.league.flag,

      home: x.teams.home.name,
      homeLogo: x.teams.home.logo,

      away: x.teams.away.name,
      awayLogo: x.teams.away.logo,

      hs: x.goals.home ?? 0,
      as: x.goals.away ?? 0,

      status,
      time: displayTime,

      fixtureStatus: short,
      kickoff: x.fixture.date,
      source: "api-football"
    };
  });

  // Live first, then upcoming, then finished
  const order = {
    live: 0,
    upcoming: 1,
    finished: 2
  };

  matches.sort((a, b) => {
    if (order[a.status] !== order[b.status]) {
      return order[a.status] - order[b.status];
    }

    return new Date(a.kickoff) - new Date(b.kickoff);
  });

  res.setHeader(
    "Cache-Control",
    "s-maxage=30, stale-while-revalidate=60"
  );

  return res.status(200).json({ matches });
}
