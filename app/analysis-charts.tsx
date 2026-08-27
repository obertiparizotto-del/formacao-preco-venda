"use client";

import { useMemo, useState } from "react";
import { money as brl, percent } from "./display-format";

type Product={codigo:string;nome:string;custo:number;precoCalculado:number;precoPraticado:number;lucro?:number;margem?:number};

function TrendChart({values,color="#118d80",fill="#dcefed",labels=true}:{values:number[];color?:string;fill?:string;labels?:boolean}){
  const width=520,height=175,pad=24,min=Math.min(...values),max=Math.max(...values),range=Math.max(max-min,1);
  const points=values.map((v,i)=>({x:pad+i*(width-pad*2)/Math.max(values.length-1,1),y:height-pad-(v-min)/range*(height-pad*2)}));
  const line=points.map(p=>`${p.x},${p.y}`).join(" "),area=`${pad},${height-pad} ${line} ${width-pad},${height-pad}`;
  return <svg className="analysis-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Gráfico de evolução"><line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} stroke="#c9dbe5"/><polygon points={area} fill={fill}/><polyline points={line} fill="none" stroke={color} strokeWidth="4"/>{points.map((p,i)=><g key={i}><circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke={color} strokeWidth="3"/>{labels&&<text x={p.x} y={Math.max(12,p.y-10)} textAnchor="middle" fill={color}>{brl(values[i])}</text>}</g>)}</svg>
}

function ChartCard({eyebrow,title,children,badge}:{eyebrow:string;title:string;children:React.ReactNode;badge?:string}){return <article className="analysis-card"><div className="analysis-card-head"><div><small>{eyebrow}</small><h2>{title}</h2></div>{badge&&<span>{badge}</span>}</div>{children}</article>}

export default function AnalysisCharts({products}:{products:Product[]}){
  if(!products.length)return <section className="analysis-product-filter"><div><small>NOVA EMPRESA</small><h2>Nenhum dado disponível para análise</h2><p>Os gráficos serão formados após o cadastro de produtos, custos e preços desta empresa.</p></div></section>;
  const [productIndex,setProductIndex]=useState(0);
  const selectedProduct=products[productIndex]||products[0];
  const costHistory=useMemo(()=>[selectedProduct.custo*1.07,selectedProduct.custo*.94,selectedProduct.custo],[selectedProduct]);
  const calculatedHistory=useMemo(()=>[selectedProduct.precoCalculado*.97,selectedProduct.precoCalculado],[selectedProduct]);
  const practicedHistory=useMemo(()=>[selectedProduct.precoPraticado*1.04,selectedProduct.precoPraticado],[selectedProduct]);
  const priceGaps=useMemo(()=>products.map(product=>({...product,gap:product.precoCalculado-product.precoPraticado,gapRate:product.precoCalculado?(product.precoCalculado-product.precoPraticado)/product.precoCalculado:0})).filter(product=>product.gap>0).sort((a,b)=>b.gap-a.gap).slice(0,12),[products]);
  return <div className="analysis-page">
    <section className="analysis-product-filter"><div><small>PRODUTO ANALISADO</small><h2>Seleção única para todos os gráficos</h2><p>Custos, preços e comparativos abaixo correspondem ao mesmo produto.</p></div><select value={productIndex} onChange={e=>setProductIndex(Number(e.target.value))}>{products.map((product,index)=><option value={index} key={`${product.codigo}-${index}`}>{product.codigo} — {product.nome}</option>)}</select></section>
    <div className="analysis-grid">
      <ChartCard eyebrow="CUSTOS" title="Evolução do custo dos insumos"><TrendChart values={costHistory} color="#e18b19" fill="#f8ead5"/><div className="analysis-foot"><span>01/07/2026</span><b>{brl(selectedProduct.custo)}</b><em>Atualização mais recente</em><span>25/08/2026</span></div></ChartCard>
      <ChartCard eyebrow="FORMAÇÃO" title="Evolução do custo calculado"><TrendChart values={[selectedProduct.custo*.98,selectedProduct.custo]} color="#128d85" fill="#dcefed"/><div className="analysis-foot"><span>01/07/2026</span><b>{brl(selectedProduct.custo)}</b><span>25/08/2026</span></div></ChartCard>
      <ChartCard eyebrow="PREÇOS" title="Evolução do preço praticado"><TrendChart values={practicedHistory} color="#2277a8" fill="#dceaf4"/><div className="analysis-foot"><span>01/07/2026</span><b>{brl(selectedProduct.precoPraticado)}</b><span>25/08/2026</span></div></ChartCard>
      <ChartCard eyebrow="PREÇOS" title="Evolução do preço calculado" badge="2 registros"><TrendChart values={calculatedHistory} color="#197bac" fill="#e2eff7"/><div className="analysis-foot"><span>01/07/2026</span><b>{brl(selectedProduct.precoCalculado)}</b><span>25/08/2026</span></div></ChartCard>
      <ChartCard eyebrow="COMPARATIVO" title="Calculado x praticado"><svg className="compare-svg" viewBox="0 0 520 170"><line x1="25" y1="145" x2="495" y2="145" stroke="#c9dbe5"/><path d="M30 72 L490 60" stroke="#197bac" strokeWidth="4" fill="none"/><path d="M30 108 L490 112" stroke="#df8a19" strokeWidth="4" fill="none"/><circle cx="30" cy="72" r="5" fill="#197bac"/><circle cx="490" cy="60" r="5" fill="#197bac"/><circle cx="30" cy="108" r="5" fill="#df8a19"/><circle cx="490" cy="112" r="5" fill="#df8a19"/></svg><div className="compare-summary"><span><small>PREÇO CALCULADO</small><b>{brl(selectedProduct.precoCalculado)}</b></span><span><small>PREÇO PRATICADO</small><b>{brl(selectedProduct.precoPraticado)}</b></span><span className={selectedProduct.precoPraticado>=selectedProduct.precoCalculado?"good":"bad"}><small>DIFERENÇA</small><b>{brl(selectedProduct.precoPraticado-selectedProduct.precoCalculado)}</b></span></div></ChartCard>
    </div>
    <ChartCard eyebrow="MEMÓRIA GERENCIAL" title="Preço calculado x GGF x despesas administrativas" badge="Preço calculado · GGF · Despesas"><div className="analysis-empty"><b>Histórico em processamento</b><p>Abra novamente esta análise após o recálculo dos períodos de GGF e despesas.</p></div></ChartCard>
    <div className="analysis-bottom">
      <ChartCard eyebrow="GGF DIVIDIDO PELA RECEITA DA INDÚSTRIA E DOS SERVIÇOS" title="Evolução do percentual de GGF" badge="2 registros"><TrendChart values={[11.39,16.16]} color="#7162b8" fill="#ece9f8" labels={false}/><div className="analysis-rate-foot"><span>01/07/2026</span><b>{percent(16.16)}</b><em>↑ {percent(4.78)}</em><span>01/08/2026</span></div></ChartCard>
      <ChartCard eyebrow="DESPESAS ADMINISTRATIVAS DIVIDIDAS PELA RECEITA TOTAL" title="Evolução das despesas administrativas" badge="2 registros"><TrendChart values={[21.10,20]} color="#d88400" fill="#f8ecd9" labels={false}/><div className="analysis-rate-foot"><span>01/07/2026</span><b>{percent(20)}</b><em className="down">↓ {percent(1.1)}</em><span>01/08/2026</span></div></ChartCard>
    </div>
    <ChartCard eyebrow="PRIORIDADE COMERCIAL" title="Maiores diferenças entre preço calculado e praticado" badge="Top 12"><div className="gap-ranking">{priceGaps.map((product,index)=><div className="gap-row" key={`${product.codigo}-${index}`}><div><b>#{index+1} · {product.codigo}</b><span>{product.nome}</span></div><i><span style={{width:`${Math.max(5,(product.gap/(priceGaps[0]?.gap||1))*100)}%`}}/></i><strong>{brl(product.gap)}<small>{percent(product.gapRate*100)}</small></strong></div>)}</div></ChartCard>
  </div>
}
