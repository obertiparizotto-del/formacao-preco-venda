const url=()=>process.env.SUPABASE_URL?.replace(/\/$/,"");
const key=()=>process.env.SUPABASE_PUBLISHABLE_KEY;
const secret=()=>process.env.SUPABASE_APP_SECRET;

export function supabaseConfigured(){return Boolean(url()&&key()&&secret())}

export async function supabaseRequest(path:string,init:RequestInit={}){
  if(!supabaseConfigured())throw new Error("Supabase não configurado");
  const headers=new Headers(init.headers);
  headers.set("apikey",key()!);
  headers.set("authorization",`Bearer ${key()!}`);
  headers.set("x-app-secret",secret()!);
  return fetch(`${url()}${path}`,{...init,headers});
}

export function stateScope(key:string,requestedCompany?:string|null){
  if(key.startsWith("system-"))return{companyId:"system",stateKey:key,legacyKey:key};
  const match=key.match(/^company:([^:]+):(.*)$/);
  if(match)return{companyId:match[1],stateKey:match[2],legacyKey:key};
  const companyId=requestedCompany?.trim()||"santo-brilho";
  return{companyId,stateKey:key,legacyKey:companyId==="santo-brilho"?key:`company:${companyId}:${key}`};
}
