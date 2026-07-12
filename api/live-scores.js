export default async function handler(req,res){
 if(req.method!=="GET") return res.status(405).json({error:"Method not allowed"});
 const key=process.env.API_FOOTBALL_KEY;if(!key)return res.status(500).json({error:"API_FOOTBALL_KEY is not configured"});
 const r=await fetch("https://v3.football.api-sports.io/fixtures?live=all",{headers:{"x-apisports-key":key}});
 const data=await r.json();if(!r.ok)return res.status(r.status).json(data);
 const matches=(data.response||[]).map(x=>({id:x.fixture.id,league:x.league.name,home:x.teams.home.name,away:x.teams.away.name,hs:x.goals.home??0,as:x.goals.away??0,status:"live",time:(x.fixture.status.elapsed??"")+"'",source:"api-football"}));
 res.setHeader("Cache-Control","s-maxage=10, stale-while-revalidate=20");return res.status(200).json({matches});
}
