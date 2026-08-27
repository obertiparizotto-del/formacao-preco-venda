"use client";

import { useEffect, useState } from "react";
import { saveDurableValue, useDurableState } from "./use-durable-state";
import { decimal, money, percent } from "./display-format";
import { isPrimaryCompany } from "./tenant";

type RateRecord={id:string;date:string;industry:number;commerce:number;services:number;ggf:number;admin:number};

function parseMoneyInput(raw:string){
  const cleaned=raw.replace(/[^\d,.-]/g,"");
  if(!cleaned||cleaned==="-")return 0;
  const comma=cleaned.lastIndexOf(","),dot=cleaned.lastIndexOf(".");
  let normalized=cleaned;
  if(comma>=0&&dot>=0){
    const decimal=comma>dot?",":".";
    normalized=cleaned.split(decimal==","?".":",").join("").replace(decimal,".");
  }else if(comma>=0){
    normalized=cleaned.replace(/\./g,"").replace(",",".");
  }else if((cleaned.match(/\./g)||[]).length>1){
    const parts=cleaned.split("."),decimalPart=parts.pop()||"";
    normalized=decimalPart.length<=2?`${parts.join("")}.${decimalPart}`:[...parts,decimalPart].join("");
  }
  const parsed=Number(normalized);
  return Number.isFinite(parsed)?parsed:0;
}

function MoneyInput({value,onChange,label}:{value:number;onChange:(value:number)=>void;label:string}){
  const [draft,setDraft]=useState(decimal(value));
  const [focused,setFocused]=useState(false);
  useEffect(()=>{if(!focused)setDraft(decimal(value))},[value,focused]);
  return <div className="ggf-money"><span>R$</span><input
    aria-label={label}
    inputMode="decimal"
    autoComplete="off"
    value={draft}
    onFocus={event=>{const input=event.currentTarget;setFocused(true);setDraft(value?String(value).replace(".",","):"");requestAnimationFrame(()=>input.select())}}
    onChange={event=>{const next=event.target.value;setDraft(next);onChange(parseMoneyInput(next))}}
    onBlur={()=>{setFocused(false);setDraft(decimal(value))}}
  /></div>;
}

function Trend({title,color,fill,records,value}:{title:string;color:string;fill:string;records:RateRecord[];value:(record:RateRecord)=>number}){
  const ordered=[...records].sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id)),values=ordered.map(value),rawMinimum=values.length?Math.min(...values):0,maximum=values.length?Math.max(...values):1,spread=Math.max(maximum-rawMinimum,maximum*.08,1),minimum=Math.max(0,rawMinimum-spread*.22),range=Math.max(maximum-minimum,1),x=(index:number)=>30+(ordered.length<=1?0:index*500/(ordered.length-1)),y=(amount:number)=>125-(amount-minimum)/range*82;
  const points=values.map((amount,index)=>`${x(index)} ${y(amount)}`).join(" L"),area=`M${points} L${x(values.length-1)} 140 L30 140 Z`,latest=values.at(-1)||0,previous=values.at(-2)??latest,difference=latest-previous,variation=previous?difference/previous*100:0,formatDate=(date:string)=>date.split("-").reverse().join("/");
  return <article className="ggf-trend monthly"><div><small>Valor mensal registrado</small><h2>{title}</h2><em>{records.length} registros</em></div><svg viewBox="0 0 560 165" aria-label={title}><path d={area} fill={fill}/><path d={`M${points}`} fill="none" stroke={color} strokeWidth="4" strokeLinejoin="round"/>{values.map((amount,index)=><g key={`${ordered[index].id}-${index}`}><circle cx={x(index)} cy={y(amount)} r="6" fill="#fff" stroke={color} strokeWidth="4"/><text x={x(index)} y={y(amount)-13} textAnchor="middle" fill={color}>{money(amount)}</text></g>)}</svg><footer><span>{formatDate(ordered[0]?.date||"")}</span><b style={{color}}>{money(latest)}</b><strong className={difference>=0?"up":"down"}><span>{difference>=0?"↑":"↓"} {money(Math.abs(difference))}</span><small>{percent(Math.abs(variation))} desde o lançamento anterior</small></strong><span>{formatDate(ordered.at(-1)?.date||"")}</span></footer></article>;
}

export default function ExpenseHistory(){
  const initialRecords:RateRecord[]=isPrimaryCompany()?[
    {id:"2026-08-26-a",date:"2026-08-26",industry:516000,commerce:684000,services:0,ggf:79508.23,admin:215000},
    {id:"2026-08-26-b",date:"2026-08-26",industry:516000,commerce:684000,services:0,ggf:69508.23,admin:200004.21},
    {id:"2026-08-01",date:"2026-08-01",industry:430000,commerce:570000,services:0,ggf:69508.23,admin:200004.21},
    {id:"2026-07-01",date:"2026-07-01",industry:430000,commerce:570000,services:0,ggf:48959.53,admin:211005.15}
  ]:[];
  const [records,setRecords]=useDurableState<RateRecord[]>("ggf-history-v2",initialRecords),[activeId,setActiveId]=useDurableState<string>("ggf-active-record-v2","2026-08-01");
  const active=records.find(item=>item.id===activeId)||records[0]||{id:"new-company",date:new Date().toISOString().slice(0,10),industry:0,commerce:0,services:0,ggf:0,admin:0};
  const [industry,setIndustry]=useState(active.industry),[commerce,setCommerce]=useState(active.commerce),[services,setServices]=useState(active.services),[ggf,setGgf]=useState(active.ggf),[admin,setAdmin]=useState(active.admin),[date,setDate]=useState("2026-08-26"),[saved,setSaved]=useState(false),[history,setHistory]=useState(true);
  useEffect(()=>{setIndustry(active.industry);setCommerce(active.commerce);setServices(active.services);setGgf(active.ggf);setAdmin(active.admin);setDate(active.date)},[active.id,active.industry,active.commerce,active.services,active.ggf,active.admin,active.date]);
  const total=industry+commerce+services,ggfBase=industry+services,ggfRate=ggfBase?ggf/ggfBase*100:0,adminRate=total?admin/total*100:0;
  const applyRecord=async(record:RateRecord)=>{const recordTotal=record.industry+record.commerce+record.services,recordGgfBase=record.industry+record.services,recordGgfRate=recordGgfBase?record.ggf/recordGgfBase*100:0,recordAdminRate=recordTotal?record.admin/recordTotal*100:0;setIndustry(record.industry);setCommerce(record.commerce);setServices(record.services);setGgf(record.ggf);setAdmin(record.admin);setDate(record.date);setActiveId(record.id);await Promise.all([saveDurableValue("ggf-active-record-v2",record.id),saveDurableValue("active-ggf-parameters-v1",{ggf:recordGgfRate,admin:recordAdminRate,date:record.date,rateRecordId:record.id,appliedAt:new Date().toISOString()})])};
  const save=async()=>{const record:RateRecord={id:`${date}-${Date.now()}`,date,industry,commerce,services,ggf,admin},next=[record,...records];setRecords(next);await saveDurableValue("ggf-history-v2",next);await applyRecord(record);setSaved(true);setHistory(true);setTimeout(()=>setSaved(false),1400)};
  const remove=async(id:string)=>{const next=records.filter(item=>item.id!==id);if(!next.length)return;if(id===activeId)await applyRecord(next[0]);setRecords(next);await saveDurableValue("ggf-history-v2",next)};
  const moneyInput=(value:number,setter:(value:number)=>void,label:string)=><MoneyInput value={value} onChange={setter} label={label}/>;
  const formatDate=(value:string)=>value.split("-").reverse().join("/");
  const chartRecords=records;
  return <div className="ggf-page">
    <section className="ggf-period"><div><small>DATA DE VIGÊNCIA</small><h2>Preservar evolução dos rateios</h2><p>Cada salvamento cria um novo registro, mantendo os valores anteriores.</p></div><label>Data de início<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label><button data-native-action="true" className="ggf-check" onClick={()=>applyRecord({id:`preview-${date}`,date,industry,commerce,services,ggf,admin})}>✓ Usar nos valores calculados</button><button data-native-action="true" className={history?"ggf-history-active":""} onClick={()=>setHistory(!history)}>{history?"Ocultar histórico":`Ver histórico (${records.length})`}</button><button data-native-action="true" className="ggf-primary" onClick={save}>{saved?"Parâmetros salvos":"Salvar parâmetros"}</button></section>
    {history&&<><section className="ggf-history-charts"><Trend title="Evolução do GGF" color="#159983" fill="#dcefeb" records={chartRecords} value={record=>record.ggf}/><Trend title="Evolução das despesas administrativas" color="#7061b6" fill="#ece9f8" records={chartRecords} value={record=>record.admin}/></section><section className="ggf-history-table"><div><small>HISTÓRICO DOS RATEIOS</small><h2>Parâmetros por data</h2><p className="ggf-history-help">Marque uma linha para definir os parâmetros utilizados nos cálculos atuais.</p></div><div className="ggf-history-scroll"><table><thead><tr><th>Data</th><th>Faturamento indústria</th><th>Faturamento comércio</th><th>Receita serviços</th><th>GGF</th><th>GGF %</th><th>Despesas adm.</th><th>Despesas %</th><th>Aplicação</th><th>Excluir</th></tr></thead><tbody>{records.map(record=>{const recordTotal=record.industry+record.commerce+record.services,recordGgfBase=record.industry+record.services,recordGgfRate=recordGgfBase?record.ggf/recordGgfBase*100:0,recordAdminRate=recordTotal?record.admin/recordTotal*100:0,inUse=record.id===activeId;return <tr key={record.id} className={inUse?"ggf-row-active":""}><td><b>{formatDate(record.date)}</b></td><td>{money(record.industry)}</td><td>{money(record.commerce)}</td><td>{money(record.services)}</td><td>{money(record.ggf)}</td><td><b>{percent(recordGgfRate)}</b></td><td>{money(record.admin)}</td><td><b>{percent(recordAdminRate)}</b></td><td><label className={`ggf-radio ${inUse?"checked":""}`}><input type="radio" name="ggf-active-parameter" checked={inUse} onChange={()=>applyRecord(record)}/><span aria-hidden="true"/><b>{inUse?"Em uso":"Usar no cálculo"}</b></label></td><td><button data-native-action="true" className="ggf-delete" onClick={()=>remove(record.id)}>Excluir</button></td></tr>})}</tbody></table></div></section></>}
    <section className="ggf-note"><b>↗</b><p><strong>Rateio por ramo vinculado ao simulador</strong><span>Os cálculos estão usando o registro de {formatDate(active.date)}. O GGF é dividido pela receita conjunta da indústria e dos serviços; as despesas administrativas, pela receita total.</span></p></section>
    <section className="ggf-revenues"><article><small>INDÚSTRIA</small><label>Faturamento mensal da indústria{moneyInput(industry,setIndustry,"Faturamento mensal da indústria")}</label><p>Compõe com os serviços a base do percentual de GGF.</p></article><article><small>COMÉRCIO</small><label>Faturamento mensal do comércio{moneyInput(commerce,setCommerce,"Faturamento mensal do comércio")}</label><p>Mercadorias de revenda não recebem GGF.</p></article><article><small>SERVIÇOS</small><label>Receita mensal de serviços{moneyInput(services,setServices,"Receita mensal de serviços")}</label><p>Compõe a base do GGF e das despesas administrativas.</p></article><article className="ggf-total"><small>FATURAMENTO TOTAL</small><b>{money(total)}</b><p>Indústria + comércio + serviços. Base das despesas administrativas.</p></article></section>
    <section className="ggf-indicators"><article><small>PERCENTUAL DE GGF OPERACIONAL</small><b>{percent(ggfRate)}</b><span>GGF ÷ (indústria + serviços)</span></article><article><small>DESPESAS ADMINISTRATIVAS</small><b>{percent(adminRate)}</b><span>Despesas ÷ faturamento total</span></article><article><small>REVENDA</small><b>0,00% GGF</b><span>Sem rateio de gastos de fabricação</span></article></section>
    <section className="ggf-rates"><article><div className="ggf-rate-title"><span><small>GASTOS GERAIS DE FABRICAÇÃO</small><h2>Rateio da indústria e serviços</h2></span><em>Fabricação e serviços</em></div><label>Valor total de GGF no mês{moneyInput(ggf,setGgf,"Valor total de GGF no mês")}</label><div className="ggf-formula"><span>{money(ggf)} ÷ {money(ggfBase)}</span><b>{percent(ggfRate)}</b></div><div className="ggf-application"><span>Aplicação no markup</span><b>Indústria e serviços</b></div></article><article><div className="ggf-rate-title"><span><small>ADMINISTRAÇÃO</small><h2>Rateio sobre faturamento total</h2></span><em>Todos os produtos</em></div><label>Despesas administrativas mensais{moneyInput(admin,setAdmin,"Despesas administrativas mensais")}</label><div className="ggf-formula"><span>{money(admin)} ÷ {money(total)}</span><b>{percent(adminRate)}</b></div><div className="ggf-application"><span>Aplicação no markup</span><b>Indústria, comércio e serviços</b></div></article></section>
  </div>;
}
