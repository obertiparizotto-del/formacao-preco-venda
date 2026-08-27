"use client";

import { useMemo, useRef, useState } from "react";
import {
  Check,
  Download,
  FileSpreadsheet,
  Pencil,
  Save,
  Search,
} from "lucide-react";
import { saveDurableValue, useDurableState } from "./use-durable-state";
import { decimal as number, money as brl } from "./display-format";

type CommercialProduct = {
  codigo: string;
  nome: string;
  tipo: string;
  custo: number;
  precoCalculado: number;
  precoPraticado: number;
  pis?: number;
  cofins?: number;
  irCs?: number;
  icms?: number;
  frete?: number;
  comissao?: number;
  verbas?: number;
  ggf?: number;
  despesas?: number;
  lucroMeta?: number;
  inadimplencia?: number;
  monophase?: boolean;
  st?: boolean;
  simplesIcms?: boolean;
};
type Props = { products: CommercialProduct[] };
const commercialStates = [
  ["AC", "Acre"],
  ["AL", "Alagoas"],
  ["AP", "Amapá"],
  ["AM", "Amazonas"],
  ["BA", "Bahia"],
  ["CE", "Ceará"],
  ["DF", "Distrito Federal"],
  ["ES", "Espírito Santo"],
  ["GO", "Goiás"],
  ["MA", "Maranhão"],
  ["MT", "Mato Grosso"],
  ["MS", "Mato Grosso do Sul"],
  ["MG", "Minas Gerais"],
  ["PA", "Pará"],
  ["PB", "Paraíba"],
  ["PR", "Paraná"],
  ["PE", "Pernambuco"],
  ["PI", "Piauí"],
  ["RJ", "Rio de Janeiro"],
  ["RN", "Rio Grande do Norte"],
  ["RS", "Rio Grande do Sul"],
  ["RO", "Rondônia"],
  ["RR", "Roraima"],
  ["SC", "Santa Catarina"],
  ["SP", "São Paulo"],
  ["SE", "Sergipe"],
  ["TO", "Tocantins"],
] as const;

const reference: Record<string, { calculated: number; practiced: number }> = {
  "871": { calculated: 4.38, practiced: 4.43 },
  "871-1": { calculated: 6.73, practiced: 2.88 },
  "870": { calculated: 10.82, practiced: 9.6 },
  "891": { calculated: 8.82, practiced: 7.37 },
  "968": { calculated: 22.08, practiced: 18.03 },
  "875": { calculated: 6.07, practiced: 4.12 },
  "875-1": { calculated: 7.23, practiced: 3.67 },
  "874": { calculated: 11.54, practiced: 9.85 },
  "890": { calculated: 8.41, practiced: 7.31 },
};

export default function CommercialTable({ products }: Props) {
  const [state, setState] = useState("RS — Rio Grande do Sul");
  const [taxSettings] = useDurableState<{ rates?: Record<string, number> }>(
      "tax-settings",
      {},
    ),
    [stateFreights] = useDurableState<Record<string, number>>(
      "state-freights-v1",
      {},
    );
  const initial = useMemo(
    () =>
      products.slice(0, 250).map((p, index) => {
        const uf = state.slice(0, 2),
          fraction = (value: number | undefined, fallback = 0) => {
            const rate = value ?? fallback;
            return Math.abs(rate) > 1 ? rate / 100 : rate;
          },
          icms =
            p.st || p.simplesIcms === false
              ? 0
              : (taxSettings.rates?.[uf] ?? 12) / 100,
          freight = (stateFreights[uf] ?? 8) / 100,
          total =
            fraction(p.pis, 0.0065) +
            fraction(p.cofins, 0.03) +
            fraction(p.irCs, 0.0228) +
            icms +
            freight +
            fraction(p.comissao, 0.01) +
            fraction(p.verbas, 0) +
            fraction(p.ggf, 0) +
            fraction(p.despesas, 0) +
            fraction(p.lucroMeta, 0.06) +
            fraction(p.inadimplencia, 0),
          calculated = 1 - total > 0 ? p.custo / (1 - total) : 0;
        return {
          ...p,
          id: `${p.codigo}-${index}`,
          calculated,
          practiced: reference[p.codigo]?.practiced ?? p.precoPraticado,
          date: "2026-08-24",
          history: 1,
        };
      }),
    [products, state, taxSettings, stateFreights],
  );
  const [query, setQuery] = useState("");
  const [branch, setBranch] = useState("Todos");
  const [situation, setSituation] = useState("Todos");
  const [prices, setPrices] = useDurableState<Record<string, number>>(
    `commercial-prices-${state.slice(0, 2)}`,
    {},
  );
  const [dates, setDates] = useDurableState<Record<string, string>>(
    `commercial-dates-${state.slice(0, 2)}`,
    {},
  );
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const rows = useMemo(
    () =>
      initial.filter((row) => {
        const practiced = prices[row.id] ?? row.practiced,
          diff = practiced - row.calculated;
        const matches = `${row.codigo} ${row.nome}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const kind =
          branch === "Todos" ||
          (branch === "Fabricados" ? row.tipo === "IND" : row.tipo !== "IND");
        const status =
          situation === "Todos" ||
          (situation === "Acima" ? diff >= 0 : diff < 0);
        return matches && kind && status;
      }),
    [initial, prices, query, branch, situation],
  );
  const parseBrazilianMoney = (value: string) => {
    const clean = value.trim().replace(/\s/g, "").replace(/^R\$/i, "");
    const normalized = clean.includes(",")
      ? clean.replace(/\./g, "").replace(",", ".")
      : clean;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : null;
  };
  const startEditing = (id: string, value: number) => {
    setPriceDrafts((current) => ({ ...current, [id]: number(value) }));
    setEditing((current) => ({ ...current, [id]: true }));
  };
  const save = async (id: string) => {
    const parsed = parseBrazilianMoney(
      priceDrafts[id] ?? number(prices[id] ?? 0),
    );
    if (parsed === null) return;
    const nextPrices = { ...prices, [id]: parsed };
    setPrices(nextPrices);
    const uf = state.slice(0, 2);
    const ok =
      (await saveDurableValue(`commercial-prices-${uf}`, nextPrices)) &&
      (await saveDurableValue(`commercial-dates-${uf}`, dates));
    setEditing((current) => ({ ...current, [id]: false }));
    setSaved((current) => ({ ...current, [id]: ok }));
    setTimeout(
      () => setSaved((current) => ({ ...current, [id]: false })),
      1400,
    );
  };
  const download = () => {
    const content =
      "codigo;produto;preco_praticado;data_vigencia;estado\n871;DESENGORDURANTE SQUEEZE 500ML;4,43;24/08/2026;RS";
    const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-tabela-comercial.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <section className="commercial-card">
      <div className="commercial-import">
        <div>
          <small>TABELA DE PREÇOS EM VIGOR</small>
          <h2>Tabela de preços em vigor</h2>
          <p>
            Informe diretamente ou importe o preço praticado com sua data de
            vigência. Cada alteração preserva o histórico.
          </p>
        </div>
        <button onClick={download}>
          <Download size={15} /> Baixar planilha modelo
        </button>
        <button
          className="commercial-primary"
          onClick={() => fileRef.current?.click()}
        >
          <FileSpreadsheet size={15} /> Importar Excel
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden />
      </div>
      <div className="commercial-state">
        <label>
          Estado da tabela
          <select value={state} onChange={(e) => setState(e.target.value)}>
            {commercialStates.map(([uf, name]) => (
              <option key={uf} value={`${uf} — ${name}`}>
                {uf} — {name}
              </option>
            ))}
          </select>
        </label>
        <span>Comparação para {state}</span>
      </div>
      <div className="commercial-toolbar">
        <div>
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código ou produto..."
          />
        </div>
        <select value={branch} onChange={(e) => setBranch(e.target.value)}>
          <option>Todos</option>
          <option>Fabricados</option>
          <option>Revenda</option>
        </select>
        <select
          value={situation}
          onChange={(e) => setSituation(e.target.value)}
        >
          <option>Todos</option>
          <option>Acima</option>
          <option>Abaixo</option>
        </select>
        <b>{rows.length} encontrados</b>
      </div>
      <div className="commercial-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>
              <th>Preço calculado</th>
              <th>Preço praticado</th>
              <th>Data de vigência</th>
              <th>Diferença R$</th>
              <th>Diferença %</th>
              <th>Histórico</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const practiced = prices[row.id] ?? row.practiced,
                diff = practiced - row.calculated,
                percent = row.calculated ? (diff / row.calculated) * 100 : 0,
                isEditing = Boolean(editing[row.id]);
              return (
                <tr key={row.id}>
                  <td>
                    <b>{row.codigo}</b>
                  </td>
                  <td>
                    <strong>{row.nome}</strong>
                    <small>
                      {row.tipo === "IND" ? "Fabricado" : "Revenda"}
                    </small>
                  </td>
                  <td>
                    <b>{brl(row.calculated)}</b>
                  </td>
                  <td>
                    <div
                      className={`commercial-money ${isEditing ? "is-editing" : ""}`}
                    >
                      <span>R$</span>
                      <input
                        aria-label={`Preço praticado de ${row.nome}`}
                        inputMode="decimal"
                        disabled={!isEditing}
                        value={
                          isEditing
                            ? (priceDrafts[row.id] ?? number(practiced))
                            : number(practiced)
                        }
                        onChange={(e) =>
                          setPriceDrafts((current) => ({
                            ...current,
                            [row.id]: e.target.value.replace(/[^0-9.,]/g, ""),
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void save(row.id);
                        }}
                      />
                    </div>
                  </td>
                  <td>
                    <input
                      className="commercial-date"
                      type="date"
                      disabled={!isEditing}
                      value={dates[row.id] ?? row.date}
                      onChange={(e) =>
                        setDates((current) => ({
                          ...current,
                          [row.id]: e.target.value,
                        }))
                      }
                    />
                  </td>
                  <td
                    className={
                      diff < 0 ? "commercial-negative" : "commercial-positive"
                    }
                  >
                    {diff >= 0 ? "+" : ""}
                    {brl(diff)}
                  </td>
                  <td
                    className={
                      diff < 0 ? "commercial-negative" : "commercial-positive"
                    }
                  >
                    {percent >= 0 ? "+" : ""}
                    {number(percent)}%
                  </td>
                  <td>
                    <button className="history-pill">
                      {row.history} registro
                    </button>
                  </td>
                  <td>
                    <div className="commercial-actions">
                      <button
                        className="commercial-edit"
                        disabled={isEditing}
                        onClick={() => startEditing(row.id, practiced)}
                        aria-label={`Alterar preço de ${row.nome}`}
                      >
                        <Pencil size={14} /> Alterar
                      </button>
                      <button
                        className="commercial-save"
                        disabled={!isEditing}
                        onClick={() => save(row.id)}
                        aria-label={`Salvar preço de ${row.nome}`}
                      >
                        {saved[row.id] ? (
                          <Check size={15} />
                        ) : (
                          <Save size={14} />
                        )}{" "}
                        {saved[row.id] ? "Salvo" : "Salvar"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
