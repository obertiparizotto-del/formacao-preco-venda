"use client";

import { useMemo, useState } from "react";
import products1 from "./data/products-1.json";
import products2 from "./data/products-2.json";
import products3 from "./data/products-3.json";
import products4 from "./data/products-4.json";
import products5 from "./data/products-5.json";
import products6 from "./data/products-6.json";
import products7 from "./data/products-7.json";
import products8 from "./data/products-8.json";
import "./dashboard-insights.css";
import "./dashboard-structure.css";
import "./dashboard-cost-alerts.css";
import "./dashboard-cost-scroll.css";
import "./dashboard-profit-scroll.css";
import "./dashboard-priority-filter.css";
import "./dashboard-readable.css";
import { saveDurableValue, useDurableState } from "./use-durable-state";
import { DISPLAY_DECIMALS_KEY, fractionPercent as pct, money as brl, percent, normalizeDisplayDigits, setDisplayDigits } from "./display-format";

type Product={codigo:string|number;nome:string;tipo:string;custo:number;precoCalculado:number;precoPraticado:number;lucro:number;margem:number};
const allProducts=[...products1,...products2,...products3,...products4,...products5,...products6,...products7,...products8] as Product[];

function Donut({values,colors}:{values:number[];colors:string[]}){
  const total=Math.max(values.reduce((sum,value)=>sum+value,0),1);let offset=0;
  return <svg className="insight-donut" viewBox="0 0 120 120" role="img" aria-label="Composição do portfólio"><circle cx="60" cy="60" r="42" fill="none" stroke="#edf2f5" strokeWidth="18"/>{values.map((value,index)=>{const length=value/total*263.89;const current=offset;offset+=length;return <circle key={index} cx="60" cy="60" r="42" fill="none" stroke={colors[index]} strokeWidth="18" strokeDasharray={`${length} ${263.89-length}`} strokeDashoffset={-current} transform="rotate(-90 60 60)"/>})}<text x="60" y="57" textAnchor="middle">{total}</text><text x="60" y="72" textAnchor="middle">produtos</text></svg>;
}

export default function DashboardInsights({products=allProducts}:{products?:Product[]}){
  const [branch,setBranch]=useState("Todos"),[priorityFilter,setPriorityFilter]=useState("Todos");
  const [displayDecimals,setDisplayDecimals]=useDurableState<number>(DISPLAY_DECIMALS_KEY,2);
  setDisplayDigits(displayDecimals);
  const changeDecimals=async(value:number)=>{const next=normalizeDisplayDigits(value);setDisplayDecimals(next);setDisplayDigits(next);await saveDurableValue(DISPLAY_DECIMALS_KEY,next)};
  const valid=useMemo(()=>products.filter(product=>product.precoCalculado>0&&product.precoPraticado>0&&(branch==="Todos"||(branch==="Fabricados"?product.tipo==="IND":product.tipo!=="IND"))),[branch,products]);
  const fabricated=valid.filter(product=>product.tipo==="IND"),resale=valid.filter(product=>product.tipo!=="IND");
  const losses=valid.filter(product=>product.lucro<0),below=valid.filter(product=>product.precoPraticado<product.precoCalculado);
  const averageMargin=valid.reduce((sum,product)=>sum+product.margem,0)/Math.max(valid.length,1);
  const averageGap=valid.reduce((sum,product)=>sum+(product.precoPraticado-product.precoCalculado),0)/Math.max(valid.length,1);
  const totalProfit=valid.reduce((sum,product)=>sum+product.lucro,0);
  const bands=[valid.filter(product=>product.margem<0).length,valid.filter(product=>product.margem>=0&&product.margem<.1).length,valid.filter(product=>product.margem>=.1&&product.margem<.2).length,valid.filter(product=>product.margem>=.2).length];
  const maxBand=Math.max(...bands,1);
  const profitable=[...valid].sort((a,b)=>b.lucro-a.lucro).slice(0,20);
  const risk=[...below].sort((a,b)=>(a.precoPraticado-a.precoCalculado)-(b.precoPraticado-b.precoCalculado));
  const priorityProducts=risk.filter(product=>priorityFilter==="Todos"||(priorityFilter==="Prejuízo"?product.lucro<0:product.lucro>=0));
  const comparison=[...valid].sort((a,b)=>b.precoCalculado-a.precoCalculado);
  const costly=[...valid].sort((a,b)=>b.custo-a.custo);
  const maxPrice=Math.max(...comparison.flatMap(product=>[product.precoCalculado,product.precoPraticado]),1);
  return <div className="insights-page">
    <section className="insight-toolbar"><div><small>VISÃO EXECUTIVA</small><h2>Gráficos e análises da formação de preços</h2><p>Indicadores calculados com os produtos e preços cadastrados no sistema.</p></div><label>Casas decimais<select value={displayDecimals} onChange={event=>changeDecimals(Number(event.target.value))}><option value={0}>0 casas</option><option value={1}>1 casa</option><option value={2}>2 casas</option><option value={3}>3 casas</option><option value={4}>4 casas</option><option value={5}>5 casas</option><option value={6}>6 casas</option></select></label><label>Ramo<select value={branch} onChange={event=>setBranch(event.target.value)}><option>Todos</option><option>Fabricados</option><option>Revenda</option></select></label></section>
    <section className="insight-metrics"><article><small>MARGEM MÉDIA</small><b className={averageMargin<0?"bad":"good"}>{pct(averageMargin)}</b><span>{valid.length} produtos analisados</span></article><article><small>LUCRO UNITÁRIO SOMADO</small><b>{brl(totalProfit)}</b><span>Somatório do lucro por unidade</span></article><article><small>ABAIXO DO PREÇO CALCULADO</small><b className="warn">{below.length}</b><span>{pct(below.length/Math.max(valid.length,1))} do portfólio</span></article><article><small>PREÇO MÉDIO: DIFERENÇA</small><b className={averageGap<0?"bad":"good"}>{brl(averageGap)}</b><span>Praticado menos calculado</span></article></section>
    <section className="insight-grid top">
      <article className="insight-card"><header><div><small>PORTFÓLIO</small><h2>Composição por ramo</h2></div><span>{valid.length} itens</span></header><div className="portfolio"><Donut values={[fabricated.length,resale.length]} colors={["#176f9f","#29a7bd"]}/><div><p><i style={{background:"#176f9f"}}/>Fabricados <b>{fabricated.length}</b></p><p><i style={{background:"#29a7bd"}}/>Revenda <b>{resale.length}</b></p><p><i style={{background:"#d94841"}}/>Com prejuízo <b>{losses.length}</b></p></div></div></article>
      <article className="insight-card"><header><div><small>RENTABILIDADE</small><h2>Distribuição das margens</h2></div><span>Faixas</span></header><div className="margin-bars">{bands.map((value,index)=><div key={index}><b>{value}</b><i><span className={index===0?"loss":""} style={{height:`${Math.max(5,value/maxBand*100)}%`}}/></i><small>{["Negativa","0–10%","10–20%","Acima de 20%"][index]}</small></div>)}</div></article>
    </section>
    <section className="structure-section"><div className="structure-heading"><div><small>COMPOSIÇÃO DO PREÇO MÉDIO</small><h2>Estrutura calculada por ramo</h2></div><span>R$ · valores médios</span></div><div className="structure-grid">
      <article className="structure-card empty"><small>SERVIÇOS</small><h3>Serviços prestados</h3><div><b>Sem dados calculáveis</b><span>Cadastre custos e fichas técnicas para formar esta composição.</span></div></article>
      <article className="structure-card"><small>REVENDA</small><h3>Mercadorias para revenda</h3><div className="structure-chart resale"><b>{percent(100)}</b><span>preço calculado</span></div><ul><li><i/>Custo direto <b>{percent(40.6)}</b></li><li><i/>Tributos <b>{percent(15.4)}</b></li><li><i/>Frete e comissão <b>{percent(11.1)}</b></li><li><i/>Lucro e verbas <b>{percent(12.8)}</b></li><li><i/>Despesas/GGF <b>{percent(20)}</b></li></ul></article>
      <article className="structure-card"><small>INDÚSTRIA</small><h3>Produtos fabricados</h3><div className="structure-chart industry"><b>{percent(100)}</b><span>preço calculado</span></div><ul><li><i/>Custo direto <b>{percent(24)}</b></li><li><i/>Tributos <b>{percent(17.7)}</b></li><li><i/>Frete e comissão <b>{percent(10.8)}</b></li><li><i/>Lucro e verbas <b>{percent(11.4)}</b></li><li><i/>Despesas/GGF <b>{percent(36.2)}</b></li></ul></article>
      <article className="structure-card"><small>CONSOLIDADO</small><h3>Todos os ramos</h3><div className="structure-chart consolidated"><b>{percent(100)}</b><span>preço calculado</span></div><ul><li><i/>Custo direto <b>{percent(36.1)}</b></li><li><i/>Tributos <b>{percent(16.1)}</b></li><li><i/>Frete e comissão <b>{percent(11)}</b></li><li><i/>Lucro e verbas <b>{percent(12.6)}</b></li><li><i/>Despesas/GGF <b>{percent(24.3)}</b></li></ul></article>
    </div></section>
    <section className="insight-grid compare">
      <article className="insight-card price-bars"><header><div><small>COMPARATIVO</small><h2>Preço calculado x praticado</h2></div><div className="legend"><i/>Calculado <i/>Praticado</div></header>{comparison.map(product=><div className="price-row" key={product.codigo}><label><b>{product.codigo}</b><span>{product.nome}</span></label><div><i style={{width:`${product.precoCalculado/maxPrice*100}%`}}/><i style={{width:`${product.precoPraticado/maxPrice*100}%`}}/></div><strong>{brl(product.precoPraticado-product.precoCalculado)}</strong></div>)}</article>
      <article className="insight-card"><header><div><small>OPORTUNIDADES</small><h2>Maior lucro unitário</h2></div><span>Top 20</span></header><div className="profit-list">{profitable.map((product,index)=><div key={product.codigo}><b>#{index+1}</b><p><strong>{product.codigo} · {product.nome}</strong><span>Margem {pct(product.margem)}</span></p><em>{brl(product.lucro)}</em></div>)}</div></article>
    </section>
    <section className="insight-card cost-alerts"><header><div><small>ALERTAS DE CUSTO</small><h2>Maiores custos cadastrados no período</h2></div><span>Histórico protegido</span></header>{costly.map(product=><div key={product.codigo}><p><b>{product.codigo}</b><span>{product.nome}</span></p><strong>{brl(product.custo)}</strong><em>Sem variação registrada</em></div>)}</section>
    <section className="insight-card risk-card"><header><div><small>ANÁLISE E AÇÃO</small><h2>Prioridades para revisão de preço</h2></div><label className="priority-select">Exibir<select value={priorityFilter} onChange={event=>setPriorityFilter(event.target.value)}><option>Todos</option><option value="Prejuízo">Com prejuízo</option><option value="Abaixo">Abaixo do calculado, sem prejuízo</option></select><b>{priorityProducts.length} produtos</b></label></header><div className="analysis-callouts"><p><b>{losses.length} produtos com prejuízo</b><span>Precisam de correção imediata ou revisão do custo.</span></p><p><b>{below.length-losses.length} produtos abaixo do calculado</b><span>Revisar tabela comercial, desconto, frete e verbas.</span></p><p><b>{valid.length-below.length} produtos protegidos</b><span>Preço praticado igual ou superior ao calculado.</span></p></div><div className="risk-table"><table><thead><tr><th>Produto</th><th>Calculado</th><th>Praticado</th><th>Diferença</th><th>Margem</th><th>Análise</th></tr></thead><tbody>{priorityProducts.map(product=><tr key={product.codigo}><td><b>{product.codigo}</b><span>{product.nome}</span></td><td>{brl(product.precoCalculado)}</td><td>{brl(product.precoPraticado)}</td><td className="bad">{brl(product.precoPraticado-product.precoCalculado)}</td><td>{pct(product.margem)}</td><td><span className="risk-pill">Revisar preço</span></td></tr>)}</tbody></table></div></section>
  </div>;
}
