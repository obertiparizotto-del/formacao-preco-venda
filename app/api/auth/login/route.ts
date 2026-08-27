import { ensureUserAccess, setAuthCookies } from "../../../supabase-auth-server";
import { supabaseRequest } from "../../../supabase-server";
export async function POST(request:Request){
  const {email,password}=await request.json() as {email?:string;password?:string};
  if(!email||!password)return Response.json({error:"Informe e-mail e senha."},{status:400});
  const response=await supabaseRequest("/auth/v1/token?grant_type=password",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({email,password})});
  if(!response.ok)return Response.json({error:"E-mail ou senha inválidos."},{status:401});
  const session=await response.json() as {access_token:string;refresh_token:string;expires_in:number;user:{id:string;email?:string}};
  if(!await ensureUserAccess(session.user))return Response.json({error:"Usuário sem empresa autorizada."},{status:403});
  await setAuthCookies(session.access_token,session.refresh_token,session.expires_in);
  return Response.json({authenticated:true,user:{email:session.user.email}});
}
