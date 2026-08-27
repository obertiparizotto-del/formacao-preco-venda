"use client";
import { useMemo, useState } from "react";
import { FileBarChart, FileSpreadsheet, Printer, Search } from "lucide-react";
import { csvNumber, fractionPercent, money as brl } from "./display-format";
type Product = {
    codigo: string;
    nome: string;
    tipo: string;
    precoCalculado: number;
    precoPraticado: number;
    lucro: number;
    margem: number;
};
export default function Reports({ products }: {
    products: Product[];
}) {
    const [report, setReport] = useState("prices"), [query, setQuery] = useState(""), [branch, setBranch] = useState("Todos"), [state, setState] = useState("RS — Rio Grande do Sul");
    const rows = useMemo(() => products.filter(p => (branch === "Todos" || (branch === "Fabricados" ? p.tipo === "IND" : p.tipo !== "IND")) && `${p.codigo} ${p.nome}`.toLowerCase().includes(query.toLowerCase())), [products, query, branch]);
    const exportCsv = () => { const header = "Código;Produto;Ramo;Estado;Preço calculado;Preço praticado;Margem\n"; const body = rows.map(p => `${p.codigo};${p.nome};${p.tipo === "IND" ? "Indústria" : "Revenda"};${state.slice(0, 2)};${csvNumber(p.precoCalculado)};${csvNumber(p.precoPraticado)};${fractionPercent(p.margem)}`).join("\n"); const blob = new Blob([header + body], { type: "text/csv;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "relatorio-precos-calculados.csv"; a.click(); URL.revokeObjectURL(url); };
    return <div className="reports-page">
    <section className="reports-choice"><div><small>RELATÓRIOS DISPONÍVEIS</small><h2>Escolha a análise</h2></div><div className="report-options">
      <button className={report === "prices" ? "active" : ""} onClick={() => setReport("prices")}><FileSpreadsheet /><span><b>Tabela de preços calculados</b><small>Preços por produto, ramo e estado</small></span></button>
      <button className={report === "simulation" ? "active" : ""} onClick={() => setReport("simulation")}><FileBarChart /><span><b>Cenários e simulações</b><small>Comparativo calculado e praticado</small></span></button>
      <button className={report === "profit" ? "active" : ""} onClick={() => setReport("profit")}><FileBarChart /><span><b>Margens e resultados</b><small>Rentabilidade por produto</small></span></button>
      <button className={report === "review" ? "active" : ""} onClick={() => setReport("review")}><FileBarChart /><span><b>Revisão de preços</b><small>Diferença, percentual e prioridade</small></span></button>
    </div></section>
    <section className="reports-card"><div className="reports-title"><div><small>BASE CONSOLIDADA</small><h2>{report === "prices" ? "Tabela de preços calculados" : report === "simulation" ? "Cenários e simulações" : report === "review" ? "Prioridades para revisão de preços" : "Margens e resultados"}</h2></div><button onClick={() => window.print()}><Printer size={15}/> Imprimir</button><button className="reports-primary" onClick={exportCsv}><FileSpreadsheet size={15}/> Exportar Excel</button></div>
      <div className="reports-filters"><label>Estado<select value={state} onChange={e => setState(e.target.value)}><option>RS — Rio Grande do Sul</option><option>SC — Santa Catarina</option><option>PR — Paraná</option><option>SP — São Paulo</option></select></label><label>Ramo<select value={branch} onChange={e => setBranch(e.target.value)}><option>Todos</option><option>Fabricados</option><option>Revenda</option></select></label><div className="reports-search"><Search size={15}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por código ou descrição..."/></div><b>{rows.length} itens</b></div>
      <div className="reports-summary"><span><small>ESTADO</small><b>{state.slice(0, 2)}</b></span><span><small>RAMO</small><b>{branch}</b></span><span><small>REFERÊNCIA</small><b>25/08/2026</b></span></div>
      <div className={`reports-table report-${report}`}><table><thead><tr><th>Código</th><th>Descrição</th><th className="report-detail">Ramo</th><th className="report-detail">UF</th><th className="report-detail">Preço calculado</th><th>Preço praticado</th>{report === "profit" && <th className="report-detail">Margem</th>}{report === "review" && <><th className="report-detail">Diferença</th><th className="report-detail">Prioridade</th></>}</tr></thead><tbody>{rows.map((p, i) => <tr key={`${p.codigo}-${i}`}><td><b>{p.codigo}</b></td><td>{p.nome}</td><td className="report-detail">{p.tipo === "IND" ? "Indústria" : "Revenda"}</td><td className="report-detail">{state.slice(0, 2)}</td><td className="report-detail"><strong>{brl(p.precoCalculado)}</strong></td><td><strong>{brl(p.precoPraticado)}</strong></td>{report === "profit" && <td className={`report-detail ${p.margem < 0 ? "report-negative" : "report-positive"}`}>{fractionPercent(p.margem)}</td>}{report === "review" && <><td className={`report-detail ${p.precoPraticado < p.precoCalculado ? "report-negative" : "report-positive"}`}>{brl(p.precoPraticado - p.precoCalculado)}</td><td className="report-detail"><b>{p.precoPraticado < p.precoCalculado * .8 ? "Alta" : p.precoPraticado < p.precoCalculado ? "Média" : "Normal"}</b></td></>}</tr>)}</tbody></table></div>
    </section>
  </div>;
}
