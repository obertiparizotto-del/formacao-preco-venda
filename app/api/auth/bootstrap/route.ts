import { supabaseRequest } from "../../../supabase-server";
export async function POST(request:Request){
  const {email,password}=await request.json() as {email?:string;password?:string};
  const allowed=(process.env.BOOTSTRAP_ADMIN_EMAIL||"").toLowerCase();
  if(!email||email.toLowerCase()!==allowed||!password||password.length<8)return Response.json({error:"Dados inválidos para o primeiro acesso."},{status:400});
  const admins=await supabaseRequest("/rest/v1/platform_admins?select=user_id&limit=1"),rows=admins.ok?await admins.json() as unknown[]:[];
  if(rows.length)return Response.json({error:"O administrador inicial já foi criado."},{status:409});
  const response=await supabaseRequest("/auth/v1/signup",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,password})});
  if(!response.ok)return Response.json({error:"Não foi possível criar o acesso.",detail:await response.text()},{status:400});
  return Response.json({created:true,message:"Confira seu e-mail para confirmar o cadastro e depois entre no sistema."});
}
