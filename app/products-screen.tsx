"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import products1 from "./data/products-1.json";
import products2 from "./data/products-2.json";
import products3 from "./data/products-3.json";
import products4 from "./data/products-4.json";
import products5 from "./data/products-5.json";
import products6 from "./data/products-6.json";
import products7 from "./data/products-7.json";
import products8 from "./data/products-8.json";
import { saveDurableValue, useDurableState } from "./use-durable-state";
import { storeCompanyFile } from "./file-storage";
import { getDisplayDigits, money } from "./display-format";
import { initialTechnicalCost, TECHNICAL_COSTS_KEY } from "./technical-costs";
import { isPrimaryCompany } from "./tenant";

const base=isPrimaryCompany()?[...products1,...products2,...products3,...products4,...products5,...products6,...products7,...products8].filter(p=>p.tipo==="IND"):[];
type BaseProduct=(typeof base)[number];
type Override={code:string;description:string;monophase:boolean;st:boolean};
type Rates={commission:number;allowance:number;profit:number};
type Draft=Override&{key:string};

export default function ProductsScreen({onNavigate}:{onNavigate:(value:string)=>void}){
  const [query,setQuery]=useState(""),[tax,setTax]=useState("Todas"),[bulk,setBulk]=useState<Rates>({commission:1,allowance:0,profit:6}),[notice,setNotice]=useState(""),[newOpen,setNewOpen]=useState(false),[draft,setDraft]=useState<Draft|null>(null);
  const [overrides,setOverrides]=useDurableState<Record<string,Override>>("product-master-overrides-v1",{});
  const [rates,setRates]=useDurableState<Record<string,Rates>>("product-commercial-rates-v2",{});
  const [custom,setCustom]=useDurableState<BaseProduct[]>("product-custom-fabricated-v1",[]);
  const [technicalCosts]=useDurableState<Record<string,number>>(TECHNICAL_COSTS_KEY,{});
  const importRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{void saveDurableValue("product-tax-config-v1",{})},[]);
  const registered=useMemo(()=>[...custom,...base].map((p,i)=>{const key=`${p.codigo}-${i}`,override=overrides[KeyFor(p)]||{code:String(p.codigo),description:p.nome,monophase:false,st:false};return{p,key,override}}),[custom,overrides]);
  const taxType=(o:Override)=>o.st?"ICMS ST":o.monophase?"Monofásico":"Normal";
  const rows=useMemo(()=>registered.filter(({override})=>`${override.code} ${override.description}`.toLowerCase().includes(query.toLowerCase())&&(tax==="Todas"||taxType(override)===tax)),[registered,query,tax]);
  const toast=(text:string)=>{setNotice(text);setTimeout(()=>setNotice(""),1800)};
  const rate=(p:BaseProduct)=>rates[KeyFor(p)]||{commission:(p.comissao||.03)*100,allowance:(p.verbas||0)*100,profit:(p.lucroMeta??.08)*100};
  const changeRate=(p:BaseProduct,field:keyof Rates,value:number)=>setRates(current=>({...current,[KeyFor(p)]:{...rate(p),[field]:value}}));
  const saveMaster=async()=>{if(!draft?.code.trim()||!draft.description.trim())return;const next={...overrides,[draft.key]:{code:draft.code.trim(),description:draft.description.trim(),monophase:draft.monophase,st:draft.st}};setOverrides(next);await saveDurableValue("product-master-overrides-v1",next);setDraft(null);toast("Cadastro do produto alterado e salvo")};
  const create=async()=>{if(!draft)return;const product={...base[0],codigo:draft.code,nome:draft.description,tipo:"IND",custo:0,precoCalculado:0,precoPraticado:0,lucro:0,margem:0} as BaseProduct;const next=[product,...custom];setCustom(next);await saveDurableValue("product-custom-fabricated-v1",next);const ov={...overrides,[KeyFor(product)]:{code:draft.code,description:draft.description,monophase:draft.monophase,st:draft.st}};setOverrides(ov);await saveDurableValue("product-master-overrides-v1",ov);setDraft(null);setNewOpen(false);toast("Novo produto incluído e salvo")};
  const applyAll=async()=>{const next={...rates};registered.forEach(({p})=>next[KeyFor(p)]={...bulk});setRates(next);await saveDurableValue("product-commercial-rates-v2",next);toast("Percentuais aplicados a todos os produtos")};
  const download=()=>{const blob=new Blob(["Código;Descrição;Monofásico;ICMS ST\n"+registered.map(({override})=>`${override.code};${override.description};${override.monophase?"SIM":"NÃO"};${override.st?"SIM":"NÃO"}`).join("\n")],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="cadastro-produtos.csv";a.click();URL.revokeObjectURL(url)};
  return <section className="card products-screen">{notice&&<div className="product-notice">{notice}</div>}
    <div className="product-tax-source"><b>Tributos centralizados na aba Impostos</b><span>Esta tela mantém somente comissão, verbas comerciais e lucro. Todos os impostos utilizados na formação do preço seguem o regime e as alíquotas definidos na aba Impostos.</span><button onClick={()=>onNavigate("Painel de tributos")}>Abrir Impostos</button></div>
    <div className="products-import"><div><b>Importação do cadastro de produtos</b><span>Cadastro exclusivo de produtos fabricados. Mercadorias para revenda permanecem na tela de compras para revenda.</span></div><button onClick={download}>Baixar planilha modelo</button><button className="product-primary" onClick={()=>importRef.current?.click()}>Importar Excel</button><input ref={importRef} hidden type="file" accept=".xlsx,.xls,.csv" onChange={async e=>{const file=e.target.files?.[0];if(file){await storeCompanyFile(file,"produtos");toast(`Arquivo ${file.name} armazenado`)}}}/></div>
    <div className="products-bulk"><div><small>PREENCHIMENTO EM MASSA</small><b>Aplicar percentuais a todos os produtos</b><span>Os percentuais podem ser ajustados individualmente e salvos.</span></div>{([['commission','Comissão'],['allowance','Verbas comerciais'],['profit','Lucro']] as [keyof Rates,string][]).map(([field,label])=><label key={field}>{label}<div><input type="number" value={bulk[field]} onChange={e=>setBulk({...bulk,[field]:Number(e.target.value)})}/><span>%</span></div></label>)}<button className="product-primary" onClick={applyAll}>Aplicar aos produtos</button></div>
    {(draft||newOpen)&&draft&&<div className="new-product-panel"><div><small>{newOpen?"NOVO PRODUTO":"ALTERAR PRODUTO"}</small><b>Edite código, descrição e condição tributária</b><span>As alterações ficam disponíveis nos filtros e nas próximas consultas.</span></div><label>Código<input value={draft.code} onChange={e=>setDraft({...draft,code:e.target.value})}/></label><label>Descrição<input value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})}/></label><div className="new-tax-options"><label><input type="checkbox" checked={draft.monophase} onChange={e=>setDraft({...draft,monophase:e.target.checked})}/> PIS/Cofins monofásico</label><label><input type="checkbox" checked={draft.st} onChange={e=>setDraft({...draft,st:e.target.checked})}/> ICMS ST</label></div><div className="new-product-actions"><button onClick={()=>{setDraft(null);setNewOpen(false)}}>Cancelar</button><button className="product-primary" onClick={newOpen?create:saveMaster}>Salvar cadastro</button></div></div>}
    <div className="products-toolbar"><div><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por código ou descrição..."/></div><select><option>Fabricados</option></select><select value={tax} onChange={e=>setTax(e.target.value)}><option>Todas</option><option>Normal</option><option>Monofásico</option><option>ICMS ST</option></select><span>{rows.length} encontrados</span><button className="product-primary" onClick={()=>{setNewOpen(true);setDraft({key:`custom-${Date.now()}`,code:"",description:"",monophase:false,st:false})}}>+ Novo produto</button></div>
    <div className="products-table"><table><thead><tr><th>Código</th><th>Produto</th><th>Tipo</th><th>Condição tributária</th><th>Custo total</th><th>Comissão</th><th>Verbas comerciais</th><th>Lucro</th><th>Ações</th></tr></thead><tbody>{rows.map(({p,key,override})=>{const r=rate(p),sheetCost=technicalCosts[KeyFor(p)]??initialTechnicalCost(p.codigo,p.nome),classification=taxType(override);return <tr key={key}><td><b>{override.code}</b></td><td><strong>{override.description}</strong></td><td><span className="product-kind">Fabricado</span></td><td><small className={classification==="Monofásico"?"tax-highlight monophase":classification==="ICMS ST"?"tax-highlight icms-st":"tax-normal"}>{classification}</small></td><td><b>{money(sheetCost??p.custo)}</b><small className="technical-cost-origin">Ficha + perda</small></td><td><Percent value={r.commission} set={v=>changeRate(p,"commission",v)}/></td><td><Percent value={r.allowance} set={v=>changeRate(p,"allowance",v)}/></td><td><Percent value={r.profit} set={v=>changeRate(p,"profit",v)}/></td><td><div className="product-actions"><button onClick={()=>{setNewOpen(false);setDraft({key:KeyFor(p),...override})}}>Alterar cadastro</button><button onClick={async()=>{await saveDurableValue("product-commercial-rates-v2",rates);toast(`Percentuais do produto ${override.code} salvos`)}}>Salvar percentuais</button><button onClick={()=>onNavigate("Fichas técnicas")}>Ficha técnica</button></div></td></tr>})}</tbody></table></div>
  </section>;
}

function KeyFor(p:BaseProduct){return String(p.codigo)}
function Percent({value,set}:{value:number;set:(value:number)=>void}){const digits=getDisplayDigits();return <div className="percent-edit"><input type="number" step={digits?10**-digits:1} value={Number(value.toFixed(digits))} onChange={e=>set(Number(e.target.value))}/><span>%</span></div>}
