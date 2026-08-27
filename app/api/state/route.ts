import { eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { savedStates } from "../../../db/schema";
import { stateScope, supabaseConfigured, supabaseRequest } from "../../supabase-server";

async function readSupabase(companyId:string,stateKey:string){
  const query=`company_id=eq.${encodeURIComponent(companyId)}&state_key=eq.${encodeURIComponent(stateKey)}&select=payload,updated_at&limit=1`;
  const response=await supabaseRequest(`/rest/v1/app_states?${query}`);
  if(!response.ok)throw new Error(`Supabase ${response.status}`);
  const [row]=await response.json() as {payload:unknown;updated_at:string}[];
  return row||null;
}

async function writeSupabase(companyId:string,stateKey:string,value:unknown,source="site"){
  const response=await supabaseRequest("/rest/v1/app_states?on_conflict=company_id,state_key",{method:"POST",headers:{"content-type":"application/json","prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify({company_id:companyId,state_key:stateKey,payload:value,source,updated_at:new Date().toISOString()})});
  if(!response.ok)throw new Error(`Supabase ${response.status}: ${await response.text()}`);
}

async function syncCompanies(value:unknown){
  if(!Array.isArray(value))return;
  const rows=value.filter(item=>item&&typeof item==="object").map(item=>{const row=item as Record<string,unknown>;return{id:String(row.id||""),code:String(row.code||""),name:String(row.name||""),cnpj:String(row.cnpj||""),active:row.active!==false,updated_at:new Date().toISOString()}}).filter(row=>row.id&&row.code&&row.name);
  if(!rows.length)return;
  const response=await supabaseRequest("/rest/v1/companies?on_conflict=id",{method:"POST",headers:{"content-type":"application/json","prefer":"resolution=merge-duplicates,return=minimal"},body:JSON.stringify(rows)});
  if(!response.ok)throw new Error(`Empresas ${response.status}`);
}

export async function GET(request:Request){
  const key=new URL(request.url).searchParams.get("key")?.trim();
  if(!key)return Response.json({error:"Chave obrigatória"},{status:400});
  const company=request.headers.get("x-company-id"),scope=stateScope(key,company);
  if(supabaseConfigured())try{
    const remote=await readSupabase(scope.companyId,scope.stateKey);
    if(remote)return Response.json({value:remote.payload,updatedAt:remote.updated_at,storage:"supabase"});
  }catch(error){console.error("Supabase read failed",error)}
  const [row]=await getDb().select().from(savedStates).where(eq(savedStates.stateKey,scope.legacyKey)).limit(1);
  const value=row?JSON.parse(row.payload):null;
  if(row&&supabaseConfigured())try{await writeSupabase(scope.companyId,scope.stateKey,value,"sites-d1-migration")}catch(error){console.error("Supabase migration failed",error)}
  return Response.json({value,updatedAt:row?.updatedAt??null,storage:row?"sites-d1-fallback":"empty"});
}

export async function PUT(request:Request){
  const body=await request.json() as {key?:string;value?:unknown};
  const key=body.key?.trim();
  if(!key)return Response.json({error:"Chave obrigatória"},{status:400});
  const scope=stateScope(key,request.headers.get("x-company-id"));
  if(supabaseConfigured())try{
    await writeSupabase(scope.companyId,scope.stateKey,body.value);
    if(scope.companyId==="system"&&scope.stateKey==="system-companies-v1")await syncCompanies(body.value);
    return Response.json({saved:true,updatedAt:new Date().toISOString(),storage:"supabase"});
  }catch(error){console.error("Supabase write failed",error)}
  const payload=JSON.stringify(body.value??null);
  const db=getDb();
  const [existing]=await db.select({id:savedStates.id}).from(savedStates).where(eq(savedStates.stateKey,scope.legacyKey)).limit(1);
  if(existing)await db.update(savedStates).set({payload,updatedAt:new Date().toISOString()}).where(eq(savedStates.id,existing.id));
  else await db.insert(savedStates).values({stateKey:scope.legacyKey,payload,updatedAt:new Date().toISOString()});
  return Response.json({saved:true,updatedAt:new Date().toISOString(),storage:"sites-d1-fallback"});
}
