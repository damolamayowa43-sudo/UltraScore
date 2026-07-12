import OpenAI from "openai";
export default async function handler(req,res){
 if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
 if(!process.env.OPENAI_API_KEY)return res.status(500).json({error:"OPENAI_API_KEY is not configured"});
 const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY});
 const prompt=String(req.body?.message||"").slice(0,1000);
 const response=await openai.responses.create({
   model:process.env.OPENAI_MODEL||"gpt-4.1-mini",
   instructions:"You are the Ultrascore admin command parser. Convert the user's request into JSON only. Allowed actions: add_match, update_match, delete_match, none. Return {action, home, away, league, home_score, away_score, status, time, explanation}. Never invent a match name. Use null for missing fields.",
   input:prompt
 });
 let text=response.output_text.trim().replace(/^```json\s*|\s*```$/g,"");
 try{return res.status(200).json(JSON.parse(text))}catch{return res.status(200).json({action:"none",explanation:text})}
}
