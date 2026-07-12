const c=window.ULTRASCORE_CONFIG;
const sb=supabase.createClient(c.SUPABASE_URL,c.SUPABASE_ANON_KEY);
loginForm.onsubmit=async(e)=>{e.preventDefault();msg.textContent="Signing in…";const {error}=await sb.auth.signInWithPassword({email:email.value,password:password.value});if(error){msg.textContent=error.message;return}location.href="admin.html"};
