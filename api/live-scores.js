export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.FOOTBALL_DATA_KEY;

  if (!key) {
    return res.status(500).json({
      error: "FOOTBALL_DATA_KEY is not configured"
    });
  }

  try {
    const response = await fetch(
      "https://api.football-data.org/v4/matches",
      {
        headers: {
          "X-Auth-Token": key
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Football Data API request failed",
        details: data
      });
    }

    const matches = (data.matches || []).map(x => {
      let status = "upcoming";
      let time = "";

      if (
        x.status === "IN_PLAY" ||
        x.status === "PAUSED"
      ) {
        status = "live";
        time = "LIVE";
      } else if (x.status === "FINISHED") {
        status = "finished";
        time = "FT";
      } else {
        status = "upcoming";

        time = new Date(x.utcDate)
          .toLocaleTimeString("en-GB", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC"
          });
      }

      return {
        id: x.id,

        league:
          x.competition?.name ||
          "Football",

        leagueLogo:
          x.competition?.emblem ||
          "",

        country:
          x.area?.name ||
          "International",

        countryFlag:
          x.area?.flag ||
          "",

        home:
          x.homeTeam?.name ||
          "Home Team",

        homeLogo:
          x.homeTeam?.crest ||
          "",

        away:
          x.awayTeam?.name ||
          "Away Team",

        awayLogo:
          x.awayTeam?.crest ||
          "",

        hs:
          x.score?.fullTime?.home ??
          x.score?.halfTime?.home ??
          0,

        as:
          x.score?.fullTime?.away ??
          x.score?.halfTime?.away ??
          0,

        status,
        time,

        fixtureStatus: x.status,
        kickoff: x.utcDate,

        source: "football-data"
      };
    });

    const
