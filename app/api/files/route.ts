import { supabaseConfigured, supabaseRequest } from "../../supabase-server";
import { canAccessCompany, currentUser } from "../../supabase-auth-server";

function clean(value:string){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/-+/g,"-")}

export async function POST(request:Request){
  if(!supabaseConfigured())return Response.json({error:"Armazenamento não configurado"},{status:503});
  const form=await request.formData(),file=form.get("file"),companyId=String(form.get("companyId")||"santo-brilho"),category=clean(String(form.get("category")||"geral"));
  const user=await currentUser();if(!user||!await canAccessCompany(user,companyId))return Response.json({error:"Acesso não autorizado"},{status:401});
  if(!(file instanceof File))return Response.json({error:"Arquivo obrigatório"},{status:400});
  if(file.size>50*1024*1024)return Response.json({error:"O arquivo excede 50 MB"},{status:413});
  const path=`${clean(companyId)}/${category}/${Date.now()}-${clean(file.name)}`;
  const upload=await supabaseRequest(`/storage/v1/object/company-files/${path}`,{method:"POST",headers:{"content-type":file.type||"application/octet-stream","x-upsert":"false"},body:await file.arrayBuffer()});
  if(!upload.ok)return Response.json({error:"Falha ao armazenar o arquivo",detail:await upload.text()},{status:upload.status});
  const metadata=await supabaseRequest("/rest/v1/documents",{method:"POST",headers:{"content-type":"application/json","prefer":"return=representation"},body:JSON.stringify({company_id:companyId,category,file_name:file.name,storage_path:path,mime_type:file.type||null,size_bytes:file.size})});
  if(!metadata.ok)return Response.json({error:"Arquivo salvo sem metadados",detail:await metadata.text()},{status:500});
  const [document]=await metadata.json();
  return Response.json({saved:true,document});
}

export async function GET(request:Request){
  if(!supabaseConfigured())return Response.json({documents:[]});
  const companyId=new URL(request.url).searchParams.get("companyId")||"santo-brilho";
  const user=await currentUser();if(!user||!await canAccessCompany(user,companyId))return Response.json({error:"Acesso não autorizado"},{status:401});
  const response=await supabaseRequest(`/rest/v1/documents?company_id=eq.${encodeURIComponent(companyId)}&select=id,category,file_name,mime_type,size_bytes,created_at&order=created_at.desc`);
  return Response.json({documents:response.ok?await response.json():[]});
}
