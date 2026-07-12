export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const id = req.query.id;
  const key = process.env.FOOTBALL_API_KEY;

  if (!id) {
    return res.status(400).json({
      error: "Match ID is required"
    });
  }

  if (!key) {
    return res.status(500).json({
      error: "FOOTBALL_API_KEY is not configured"
    });
  }

  try {
    const url =
      `https://apiv3.apifootball.com/` +
      `?action=get_events` +
      `&match_id=${encodeURIComponent(id)}` +
      `&APIkey=${encodeURIComponent(key)}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Football API request failed"
      });
    }

    if (!Array.isArray(data) || !data[0]) {
      return res.status(404).json({
        error: "Match not found",
        apiResponse: data
      });
    }

    const x = data[0];

    // ---------- STATUS ----------

    const rawStatus = String(
      x.match_status || ""
    ).toLowerCase();

    let status = "upcoming";

    if (
      rawStatus.includes("finished") ||
      rawStatus === "ft"
    ) {
      status = "finished";
    } else if (
      rawStatus &&
      rawStatus !== "not started" &&
      rawStatus !== "ns"
    ) {
      status = "live";
    }

    // ---------- EVENTS ----------

    const events = [];

    // Goals
    if (Array.isArray(x.goalscorer)) {
      x.goalscorer.forEach(event => {
        const isHome =
          event.home_scorer ||
          event.home_scorer_id;

        const player =
          event.home_scorer ||
          event.away_scorer ||
          "";

        const assist =
          event.home_assist ||
          event.away_assist ||
          "";

        events.push({
          time: event.time
            ? `${event.time}'`
            : "",

          team: isHome
            ? x.match_hometeam_name
            : x.match_awayteam_name,

          teamLogo: isHome
            ? x.team_home_badge || ""
            : x.team_away_badge || "",

          player,
          assist,

          type: "Goal",
          detail: "Goal",
          comments: event.score || "",
          icon: "⚽"
        });
      });
    }

    // Cards
    if (Array.isArray(x.cards)) {
      x.cards.forEach(event => {
        const isHome =
          event.home_fault ||
          event.home_player_id;

        const player =
          event.home_fault ||
          event.away_fault ||
          "";

        const cardType =
          event.card || "Card";

        events.push({
          time: event.time
            ? `${event.time}'`
            : "",

          team: isHome
            ? x.match_hometeam_name
            : x.match_awayteam_name,

          teamLogo: isHome
            ? x.team_home_badge || ""
            : x.team_away_badge || "",

          player,
          assist: "",
          type: "Card",
          detail: cardType,
          comments: "",
          icon: String(cardType)
            .toLowerCase()
            .includes("red")
              ? "🟥"
              : "🟨"
        });
      });
    }

    // Sort events by minute
    events.sort((a, b) => {
      return (
        parseInt(a.time) || 0
      ) - (
        parseInt(b.time) || 0
      );
    });

    // ---------- STATISTICS ----------

    const statistics = Array.isArray(x.statistics)
      ? x.statistics.map(stat => ({
          type:
            stat.type ||
            stat.statistic_name ||
            "Statistic",

          home:
            stat.home ??
            stat.home_value ??
            "-",

          away:
            stat.away ??
            stat.away_value ??
            "-"
        }))
      : [];

    // ---------- MATCH ----------

    const match = {
      id: x.match_id,

      league:
        x.league_name ||
        "Unknown League",

      country:
        x.country_name ||
        "",

      leagueLogo:
        x.league_logo ||
        "",

      home:
        x.match_hometeam_name ||
        "Home",

      away:
        x.match_awayteam_name ||
        "Away",

      homeLogo:
        x.team_home_badge ||
        "",

      awayLogo:
        x.team_away_badge ||
        "",

      hs:
        x.match_hometeam_score !== ""
          ? Number(x.match_hometeam_score)
          : 0,

      as:
        x.match_awayteam_score !== ""
          ? Number(x.match_awayteam_score)
          : 0,

      status,

      statusText:
        x.match_status ||
        (status === "upcoming"
          ? "Not Started"
          : status),

      time:
        status === "finished"
          ? "FT"
          : status === "live"
          ? x.match_status || "LIVE"
          : x.match_time || "",

      venue:
        x.match_stadium ||
        "Not available",

      events,
      statistics,

      source: "apifootball"
    };

    res.setHeader(
      "Cache-Control",
      "s-maxage=10, stale-while-revalidate=20"
    );

    return res.status(200).json({
      match
    });

  } catch (error) {
    console.error(
      "Match details error:",
      error
    );

    return res.status(500).json({
      error: "Failed to load match details",
      message: error.message
    });
  }
      }
