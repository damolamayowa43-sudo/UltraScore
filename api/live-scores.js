export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const key = process.env.FOOTBALL_API_KEY;

  if (!key) {
    return res.status(500).json({
      error: "FOOTBALL_API_KEY is not configured"
    });
  }

  try {
    // TODAY
    const startDate = new Date();

    // 90 DAYS FROM TODAY
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 90);

    const formatDate = (date) =>
      date.toISOString().split("T")[0];

    const from = formatDate(startDate);
    const to = formatDate(endDate);

    const url =
      `https://apiv3.apifootball.com/` +
      `?action=get_events` +
      `&from=${from}` +
      `&to=${to}` +
      `&APIkey=${encodeURIComponent(key)}`;

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Football API request failed"
      });
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      return res.status(200).json({
        matches: [],
        apiResponse: data
      });
    }

    const matches = data.map((x) => {
      const matchStatus = String(
        x.match_status || ""
      ).toLowerCase();

      let status = "upcoming";

      if (
        matchStatus.includes("finished") ||
        matchStatus === "ft"
      ) {
        status = "finished";
      } else if (
        matchStatus &&
        matchStatus !== "not started" &&
        matchStatus !== "ns"
      ) {
        status = "live";
      }

      const matchDate =
        x.match_date || from;

      return {
        id: x.match_id,

        league:
          x.league_name ||
          "Unknown League",

        leagueLogo:
          x.league_logo || "",

        country:
          x.country_name ||
          "International",

        countryFlag:
          x.country_logo || "",

        home:
          x.match_hometeam_name ||
          "Home",

        homeLogo:
          x.team_home_badge || "",

        away:
          x.match_awayteam_name ||
          "Away",

        awayLogo:
          x.team_away_badge || "",

        // Don't show 0-0 for matches
        // that have not started
        hs:
          status === "upcoming"
            ? null
            : Number(
                x.match_hometeam_score || 0
              ),

        as:
          status === "upcoming"
            ? null
            : Number(
                x.match_awayteam_score || 0
              ),

        status,

        time:
          status === "finished"
            ? "FT"
            : status === "live"
            ? x.match_status || "LIVE"
            : x.match_time || "",

        matchDate,

        kickoff:
          `${matchDate}T${
            x.match_time || "00:00"
          }:00`,

        source: "apifootball"
      };
    });

    const order = {
      live: 0,
      upcoming: 1,
      finished: 2
    };

    matches.sort((a, b) => {
      // Live first
      if (
        order[a.status] !==
        order[b.status]
      ) {
        return (
          order[a.status] -
          order[b.status]
        );
     
