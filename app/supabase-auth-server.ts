import { cookies } from "next/headers";
import { supabaseRequest } from "./supabase-server";

const ACCESS_COOKIE="parsecon-access-token",REFRESH_COOKIE="parsecon-refresh-token";
export type SupabaseUser={id:string;email?:string};

export async function setAuthCookies(accessToken:string,refreshToken:string,expiresIn=3600){
  const jar=await cookies(),base={httpOnly:true,secure:true,sameSite:"lax" as const,path:"/"};
  jar.set(ACCESS_COOKIE,accessToken,{...base,maxAge:Math.max(60,expiresIn-30)});
  jar.set(REFRESH_COOKIE,refreshToken,{...base,maxAge:60*60*24*30});
}

export async function clearAuthCookies(){const jar=await cookies();jar.delete(ACCESS_COOKIE);jar.delete(REFRESH_COOKIE)}

async function userFromToken(token:string){
  const response=await supabaseRequest("/auth/v1/user",{headers:{authorization:`Bearer ${token}`}});
  return response.ok?await response.json() as SupabaseUser:null;
}

export async function currentUser(){
  const jar=await cookies(),access=jar.get(ACCESS_COOKIE)?.value;
  if(access){const user=await userFromToken(access);if(user)return user}
  const refresh=jar.get(REFRESH_COOKIE)?.value;if(!refresh)return null;
  const response=await supabaseRequest("/auth/v1/token?grant_type=refresh_token",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({refresh_token:refresh})});
  if(!response.ok){await clearAuthCookies();return null}
  const session=await response.json() as {access_token:string;refresh_token:string;expires_in:number;user:SupabaseUser};
  await setAuthCookies(session.access_token,session.refresh_token,session.expires_in);
  return session.user;
}

export async function ensureUserAccess(user:SupabaseUser){
  const email=(user.email||"").toLowerCase(),bootstrap=(process.env.BOOTSTRAP_ADMIN_EMAIL||"").toLowerCase();
  const admins=await supabaseRequest("/rest/v1/platform_admins?select=user_id&limit=1"),existing=admins.ok?await admins.json() as {user_id:string}[]:[];
  if(!existing.length&&email===bootstrap){
    await supabaseRequest("/rest/v1/platform_admins?on_conflict=user_id",{method:"POST",headers:{"content-type":"application/json","prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({user_id:user.id})});
    await supabaseRequest("/rest/v1/company_members?on_conflict=company_id,user_id",{method:"POST",headers:{"content-type":"application/json","prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({company_id:"santo-brilho",user_id:user.id,role:"admin",active:true})});
    return true;
  }
  const check=await supabaseRequest(`/rest/v1/company_members?user_id=eq.${encodeURIComponent(user.id)}&active=eq.true&select=user_id&limit=1`);
  const memberships=check.ok?await check.json() as unknown[]:[];
  const admin=await supabaseRequest(`/rest/v1/platform_admins?user_id=eq.${encodeURIComponent(user.id)}&select=user_id&limit=1`),adminRows=admin.ok?await admin.json() as unknown[]:[];
  return memberships.length>0||adminRows.length>0;
}

export async function canAccessCompany(user:SupabaseUser,companyId:string){
  const admin=await supabaseRequest(`/rest/v1/platform_admins?user_id=eq.${encodeURIComponent(user.id)}&select=user_id&limit=1`),adminRows=admin.ok?await admin.json() as unknown[]:[];
  if(adminRows.length)return true;
  if(companyId==="system")return false;
  const membership=await supabaseRequest(`/rest/v1/company_members?company_id=eq.${encodeURIComponent(companyId)}&user_id=eq.${encodeURIComponent(user.id)}&active=eq.true&select=user_id&limit=1`),rows=membership.ok?await membership.json() as unknown[]:[];
  return rows.length>0;
}
