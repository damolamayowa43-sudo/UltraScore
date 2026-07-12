const cfg=window.ULTRASCORE_CONFIG||{};
const configured=cfg.SUPABASE_URL && !cfg.SUPABASE_URL.startsWith("YOUR_");
const sb=configured?supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY):null;
async function getMatches(){
 if(!sb) return JSON.parse(localStorage.getItem("ultrascore_matches")||"[]");
 const {data,error}=await sb.from("matches").select("*").order("kickoff",{ascending:true});
 if(error) throw error; return data.map(x=>({id:x.id,league:x.league,home:x.home_team,away:x.away_team,hs:x.home_score,as:x.away_score,status:x.status,time:x.display_time,source:x.source}));
}
async function upsertMatch(m){
 if(!sb){let a=await getMatches();let i=a.findIndex(x=>x.id===m.id);i<0?a.unshift(m):a[i]=m;localStorage.setItem("ultrascore_matches",JSON.stringify(a));return}
 const row={id:m.id,league:m.league,home_team:m.home,away_team:m.away,home_score:m.hs,away_score:m.as,status:m.status,display_time:m.time,source:m.source||"manual"};
 const {error}=await sb.from("matches").upsert(row);if(error)throw error;
}
async function deleteMatch(id){if(!sb){localStorage.setItem("ultrascore_matches",JSON.stringify((await getMatches()).filter(x=>x.id!==id)));return}const {error}=await sb.from("matches").delete().eq("id",id);if(error)throw error}
