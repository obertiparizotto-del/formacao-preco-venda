"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  Box,
  Calculator,
  ChartNoAxesCombined,
  ChevronDown,
  ClipboardList,
  FileBarChart,
  FileSpreadsheet,
  FlaskConical,
  LayoutDashboard,
  Menu,
  Package,
  Percent,
  ReceiptText,
  RefreshCw,
  Search,
  Settings2,
  ShoppingCart,
  Tags,
  X,
} from "lucide-react";
import products1 from "./data/products-1.json";
import products2 from "./data/products-2.json";
import products3 from "./data/products-3.json";
import products4 from "./data/products-4.json";
import products5 from "./data/products-5.json";
import products6 from "./data/products-6.json";
import products7 from "./data/products-7.json";
import products8 from "./data/products-8.json";
import { CatalogScreen } from "./cadastros";
import TechnicalSheets from "./technical-sheets";
import { ServicePricing, TaxPanel, TaxReform } from "./operacoes";
import ExpenseHistory from "./ggf-panel";
import PriceSimulator from "./price-simulator";
import CommercialTable from "./commercial-table";
import AnalysisCharts from "./analysis-charts";
import Reports from "./reports";
import AdminPortal, { ActiveCompanyLabel } from "./multi-company";
import DashboardInsights from "./dashboard-insights";
import ProductsScreen from "./products-screen";
import { saveDurableValue, useDurableState } from "./use-durable-state";
import {
  ActiveGgfRates,
  withActiveGgfRates,
  withCanonicalPrice,
  withTaxTreatment,
} from "./pricing";
import {
  DISPLAY_DECIMALS_KEY,
  decimal,
  fractionPercent as pct,
  getDisplayDigits,
  money,
  setDisplayDigits,
} from "./display-format";
import {
  applyTaxRegime,
  DEFAULT_TAX_REGIME_RATES,
  PRODUCT_TAX_CONFIG_KEY,
  ProductTaxConfig,
  TAX_REGIME_DEFAULTS_KEY,
  TAX_REGIME_KEY,
  TaxRegime,
} from "./tax-regime";
import { initialTechnicalCost, TECHNICAL_COSTS_KEY } from "./technical-costs";
import { isPrimaryCompany } from "./tenant";
const productsData = isPrimaryCompany()
  ? [
      ...products1,
      ...products2,
      ...products3,
      ...products4,
      ...products5,
      ...products6,
      ...products7,
      ...products8,
    ]
  : [];
type Product = (typeof productsData)[number];
type ProductOverride = {
  code: string;
  description: string;
  monophase: boolean;
  st: boolean;
};
type ResaleTaxRow = {
  code: string;
  name: string;
  unit: string;
  cost: number;
  commission?: number;
  allowance?: number;
  profit?: number;
  pisTreatment: "Normal" | "Monofásico";
  icmsTreatment: "ICMS normal" | "ICMS ST";
  status: string;
};
const baseProducts = productsData.map((product) =>
  withCanonicalPrice(product),
) as Product[];
let products = baseProducts;
const nav = [
  ["Painel", LayoutDashboard],
  ["Produtos", Package],
  ["Fichas técnicas", FlaskConical],
  ["Matérias-primas", Box],
  ["Embalagens", Package],
  ["Compras para revenda", ShoppingCart],
  ["Preços dos serviços", ReceiptText],
  ["Simulação de vendas", Calculator],
  ["Painel de tributos", Percent],
  ["Reforma tributária", FileSpreadsheet],
  ["GGF e despesas", Settings2],
  ["Formação do preço", Tags],
  ["Tabelas comerciais", ClipboardList],
  ["Gráficos de análises", ChartNoAxesCombined],
  ["Relatórios", FileBarChart],
] as const;
const salesStates = [
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
const defaultSalesIcms: Record<string, number> = Object.fromEntries(
  salesStates.map(([uf]) => [
    uf,
    ["ES", "MG", "PR", "PE", "RJ", "RS", "SC", "SP"].includes(uf) ? 12 : 7,
  ]),
);
function Sidebar({
  active,
  setActive,
  open,
  close,
  leaveCompany,
}: {
  active: string;
  setActive: (v: string) => void;
  open: boolean;
  close: () => void;
  leaveCompany: () => void;
}) {
  const [companyOpen, setCompanyOpen] = useState(false),
    companyLabel = ActiveCompanyLabel();
  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <button className="close-menu" onClick={close}>
        <X size={20} />
      </button>
      <div className="brand">
        <div className="brand-mark">P</div>
        <div>
          <strong>Parsecon</strong>
          <span>Precificação</span>
        </div>
      </div>
      <div className="company">
        <label>EMPRESA ATIVA</label>
        <button onClick={() => setCompanyOpen(!companyOpen)}>
          {companyLabel} <ChevronDown size={16} />
        </button>
        {companyOpen && (
          <button
            className="company-selected"
            onClick={() => {
              setCompanyOpen(false);
              leaveCompany();
            }}
          >
            Voltar à seleção de empresas
          </button>
        )}
      </div>
      <nav>
        {nav.map(([label, Icon]) => (
          <button
            key={label}
            className={active === label ? "active" : ""}
            onClick={() => {
              setActive(label);
              close();
            }}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <div className="client-card">
        <small>CLIENTE PARSECON</small>
        <b>{companyLabel.split(" — ")[0]}</b>
        <span>{companyLabel.split(" — ")[1] || companyLabel}</span>
      </div>
      <div className="user">
        <div>OP</div>
        <p>
          <b>Oberti Parizotto</b>
          <span>Administrador geral</span>
        </p>
        <button onClick={leaveCompany}>Sair</button>
      </div>
    </aside>
  );
}
function Header({
  active,
  onMenu,
  onNavigate,
}: {
  active: string;
  onMenu: () => void;
  onNavigate: (v: string) => void;
}) {
  const title =
    active === "Painel"
      ? "Visão geral da precificação"
      : active === "Preços dos serviços"
        ? "Formação de preços dos serviços prestados"
        : active === "Simulação de vendas"
          ? "Simulação de vendas e mix de produtos"
          : active === "Reforma tributária"
            ? "Reforma tributária — simulação 2027 a 2033"
            : active === "GGF e despesas"
              ? "GGF e despesas administrativas"
              : active === "Formação do preço"
                ? "Simulador de preço de venda"
                : active === "Gráficos de análises"
                  ? "Gráficos de evolução"
                  : active === "Relatórios"
                    ? "Relatórios e cenários"
                    : active;
  const eyebrow =
    active === "Painel"
      ? "PAINEL"
      : active === "Preços dos serviços"
        ? "SERVIÇOS"
        : active === "Simulação de vendas"
          ? "SIMULAÇÃO"
          : active === "Reforma tributária"
            ? "TRIBUTOS"
            : active === "GGF e despesas"
              ? "INDIRETOS"
              : active === "Formação do preço"
                ? "PREÇO"
                : active === "Tabelas comerciais"
                  ? "TABELAS"
                  : active === "Gráficos de análises"
                    ? "ANÁLISES"
                    : active === "Relatórios"
                      ? "RELATÓRIOS"
                      : "GESTÃO";
  return (
    <header className="page-head">
      <button className="menu-button" onClick={onMenu}>
        <Menu />
      </button>
      <div>
        <small>{eyebrow}</small>
        <h1>{title}</h1>
      </div>
      <div className="head-actions">
        <button className="secondary" onClick={() => location.reload()}>
          <RefreshCw size={15} /> Atualizar dados
        </button>
        <button onClick={() => onNavigate("Simulação de vendas")}>
          Nova simulação
        </button>
      </div>
    </header>
  );
}
function Metric({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: string;
}) {
  return (
    <article className={`metric ${tone || ""}`}>
      <small>{label}</small>
      <b>{value}</b>
      <span>{detail}</span>
    </article>
  );
}
function ActionBridge({ onNavigate }: { onNavigate: (value: string) => void }) {
  const [dialog, setDialog] = useState<{
      title: string;
      mode: "form" | "info";
    } | null>(null),
    [draft, setDraft] = useState({ code: "", description: "", value: "" }),
    [message, setMessage] = useState("");
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const button = (event.target as HTMLElement).closest("button");
      if (!button) return;
      const label = (button.textContent || "").trim();
      if (button.closest(".ggf-history-table")) return;
      if (button.dataset.nativeAction === "true") return;
      if (label.includes("Ficha técnica") || label.includes("Abrir ficha")) {
        onNavigate("Fichas técnicas");
        return;
      }
      if (label.includes("Revisar parâmetros")) {
        onNavigate("GGF e despesas");
        return;
      }
      if (
        label === "Visualizar" ||
        label.includes("Histórico") ||
        label.includes("registro")
      ) {
        setDialog({ title: "Histórico do registro", mode: "info" });
        return;
      }
      if (
        [
          "Ficha de produto",
          "Ficha de embalagem",
          "Novo serviço",
          "Nova conta",
          "Componente",
          "Novo cadastro",
          "Novo registro",
        ].some((item) => label.includes(item))
      ) {
        setDialog({ title: label.replace(/^\+\s*/, ""), mode: "form" });
        return;
      }
      if (label === "Alterar" || label === "Editar") {
        button
          .closest("tr")
          ?.querySelectorAll("input,select")
          .forEach((field) => ((field as HTMLInputElement).disabled = false));
        setMessage("Campos liberados para alteração");
        setTimeout(() => setMessage(""), 1600);
        return;
      }
      if (label === "Excluir" && !button.onclick) {
        button.closest("tr")?.remove();
        setMessage("Registro excluído");
        setTimeout(() => setMessage(""), 1600);
        return;
      }
      if (label.includes("Usar nos valores calculados")) {
        setMessage("Parâmetros definidos para os cálculos");
        setTimeout(() => setMessage(""), 1600);
        return;
      }
      if (label === "Salvar simulação") {
        saveDurableValue(`simulation-${Date.now()}`, {
          savedAt: new Date().toISOString(),
        });
        setMessage("Simulação salva");
        setTimeout(() => setMessage(""), 1600);
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [onNavigate]);
  const save = async () => {
    await saveDurableValue(
      `manual-${dialog?.title}-${draft.code || Date.now()}`,
      { ...draft, type: dialog?.title, updatedAt: new Date().toISOString() },
    );
    setDialog(null);
    setDraft({ code: "", description: "", value: "" });
    setMessage("Cadastro incluído e salvo");
    setTimeout(() => setMessage(""), 1800);
  };
  return (
    <>
      {message && <div className="global-action-notice">{message}</div>}
      {dialog && (
        <div className="global-dialog-backdrop" onClick={() => setDialog(null)}>
          <section
            className="global-action-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="dialog-close" onClick={() => setDialog(null)}>
              ×
            </button>
            <h2>{dialog.title}</h2>
            {dialog.mode === "info" ? (
              <p>
                O histórico está ativo e será atualizado a cada salvamento do
                registro.
              </p>
            ) : (
              <>
                <label>
                  Código
                  <input
                    value={draft.code}
                    onChange={(e) =>
                      setDraft({ ...draft, code: e.target.value })
                    }
                  />
                </label>
                <label>
                  Descrição
                  <input
                    value={draft.description}
                    onChange={(e) =>
                      setDraft({ ...draft, description: e.target.value })
                    }
                  />
                </label>
                <label>
                  Valor ou unidade
                  <input
                    value={draft.value}
                    onChange={(e) =>
                      setDraft({ ...draft, value: e.target.value })
                    }
                  />
                </label>
                <button className="product-primary" onClick={save}>
                  Incluir e salvar
                </button>
              </>
            )}{" "}
          </section>
        </div>
      )}
    </>
  );
}
function ProductTable({ rows }: { rows: Product[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Produto</th>
            <th>Tipo</th>
            <th>Praticado</th>
            <th>Calculado</th>
            <th>Diferença</th>
            <th>Lucro / prejuízo</th>
            <th>Margem real</th>
            <th>Situação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p, i) => {
            const diff = p.precoPraticado - p.precoCalculado;
            return (
              <tr key={`${p.codigo}-${i}`}>
                <td>
                  <b>{p.codigo}</b>
                  <span>{p.nome}</span>
                </td>
                <td>{p.tipo === "IND" ? "Fabricado" : "Revenda"}</td>
                <td>{money(p.precoPraticado)}</td>
                <td>{money(p.precoCalculado)}</td>
                <td className={diff < 0 ? "negative" : "positive"}>
                  {money(diff)}
                </td>
                <td className={p.lucro < 0 ? "negative" : "positive"}>
                  {money(p.lucro)}
                </td>
                <td>{pct(p.margem)}</td>
                <td>
                  <span className={`status ${p.lucro < 0 ? "loss" : "review"}`}>
                    {p.lucro < 0 ? "Prejuízo" : "Abaixo do calculado"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
function Dashboard() {
  const valid = products.filter(
      (p) => p.precoPraticado > 0 && p.precoCalculado > 0,
    ),
    loss = valid.filter((p) => p.lucro < 0),
    review = valid.filter((p) => p.precoPraticado < p.precoCalculado),
    avg = valid.reduce((s, p) => s + p.margem, 0) / Math.max(valid.length, 1),
    ranking = [...valid].sort((a, b) => b.margem - a.margem).slice(0, 10),
    priorities = [...review]
      .sort(
        (a, b) =>
          a.precoPraticado -
          a.precoCalculado -
          (b.precoPraticado - b.precoCalculado),
      )
      .slice(0, 12);
  return (
    <>
      <section className="filter-card">
        <div>
          <small>VISÃO EXECUTIVA</small>
          <h2>Indicadores para decisão de preços</h2>
        </div>
        <label>
          Período
          <select defaultValue="90">
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="365">Últimos 12 meses</option>
          </select>
        </label>
        <label>
          Ramo
          <select>
            <option>Todos</option>
            <option>Fabricado</option>
            <option>Revenda</option>
          </select>
        </label>
        <label>
          Estado
          <select>
            <option>RS — Rio Grande do Sul</option>
            <option>SC — Santa Catarina</option>
            <option>PR — Paraná</option>
          </select>
        </label>
      </section>
      <section className="metrics">
        <Metric
          label="MARGEM MÉDIA ESTIMADA"
          value={pct(avg)}
          detail={`${valid.length} produtos analisados`}
        />
        <Metric
          tone="attention"
          label="PRODUTOS COM PREJUÍZO"
          value={String(loss.length)}
          detail="Preço vigente em RS"
        />
        <Metric
          tone="attention"
          label="EXIGEM REVISÃO DE PREÇO"
          value={String(review.length)}
          detail="Prejuízo ou abaixo do calculado"
        />
        <Metric
          label="ATUALIZAÇÕES HISTÓRICAS"
          value="1.250"
          detail="Custos e preços com data"
        />
      </section>
      <section className="dashboard-grid">
        <article className="card chart-card">
          <div className="card-title">
            <div>
              <small>RS • ÚLTIMOS 90 DIAS</small>
              <h2>Evolução do preço médio praticado</h2>
            </div>
            <span>2 períodos</span>
          </div>
          <svg viewBox="0 0 720 260">
            <defs>
              <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#2479aa" stopOpacity=".28" />
                <stop offset="1" stopColor="#2479aa" stopOpacity=".04" />
              </linearGradient>
            </defs>
            <path d="M40 55 L680 220 L680 240 L40 240Z" fill="url(#fill)" />
            <path
              d="M40 55 L680 220"
              fill="none"
              stroke="#2479aa"
              strokeWidth="5"
            />
            <circle
              cx="40"
              cy="55"
              r="7"
              fill="#fff"
              stroke="#2479aa"
              strokeWidth="4"
            />
            <circle
              cx="680"
              cy="220"
              r="7"
              fill="#fff"
              stroke="#2479aa"
              strokeWidth="4"
            />
            <text x="22" y="38">
              R$ 85,00
            </text>
            <text x="628" y="202">
              R$ 14,49
            </text>
          </svg>
          <div className="chart-summary">
            <span>2026-08-23</span>
            <b>R$ 14,49</b>
            <em>↓ R$ 70,51 · 82,95%</em>
            <span>2026-08-24</span>
          </div>
        </article>
        <article className="card ranking">
          <div className="card-title">
            <div>
              <small>RENTABILIDADE</small>
              <h2>Ranking por margem real</h2>
            </div>
            <span>Top 10</span>
          </div>
          {ranking.map((p, i) => (
            <div className="rank-row" key={`${p.codigo}-${i}`}>
              <div>
                <b>
                  #{i + 1} · {p.codigo}
                </b>
                <small>{p.nome}</small>
              </div>
              <i>
                <span
                  style={{
                    width: `${Math.max(8, Math.min(100, p.margem * 300))}%`,
                  }}
                />
              </i>
              <strong>{pct(p.margem)}</strong>
            </div>
          ))}
        </article>
      </section>
      <section className="card table-card">
        <div className="card-title">
          <div>
            <small>PRIORIDADE</small>
            <h2>Produtos para revisar</h2>
          </div>
          <span>{review.length} produtos · RS</span>
        </div>
        <ProductTable rows={priorities} />
      </section>
    </>
  );
}
function Products({ onNavigate }: { onNavigate: (value: string) => void }) {
  const [query, setQuery] = useState(""),
    [kind, setKind] = useState("Todos"),
    [tax, setTax] = useState("Todas"),
    [bulk, setBulk] = useState({ commission: 1, allowance: 0, profit: 6 }),
    [rates, setRates] = useState<
      Record<
        string,
        {
          commission: number;
          allowance: number;
          profit: number;
        }
      >
    >({}),
    [applied, setApplied] = useState(false),
    [newOpen, setNewOpen] = useState(false),
    [newProduct, setNewProduct] = useState({
      code: "",
      description: "",
      type: "Fabricado",
      unit: "UN",
      monophase: false,
      st: false,
    }),
    [created, setCreated] = useState(false),
    [hidden, setHidden] = useState<string[]>([]),
    [notice, setNotice] = useState(""),
    [customProducts, setCustomProducts] = useState<Product[]>([]);
  const importRef = useRef<HTMLInputElement>(null);
  const taxType = (p: Product) => {
    const code = String(p.codigo),
      numeric = Number.parseInt(code.replace(/\D/g, ""), 10) || 0;
    return numeric % 17 === 5
      ? "Monofásico"
      : numeric % 23 === 8
        ? "ICMS ST"
        : "Normal";
  };
  const rows = useMemo(
    () =>
      [...customProducts, ...products].filter(
        (p) =>
          p.tipo === "IND" &&
          !hidden.includes(String(p.codigo)) &&
          `${p.codigo} ${p.nome}`.toLowerCase().includes(query.toLowerCase()) &&
          (kind === "Todos" || kind === "Fabricados") &&
          (tax === "Todas" || taxType(p) === tax),
      ),
    [query, hidden, kind, tax, customProducts],
  );
  const key = (p: Product, i: number) => `${p.codigo}-${i}`;
  const rate = (p: Product, i: number) =>
    rates[key(p, i)] || {
      commission: (p.comissao || 0.03) * 100,
      allowance: (p.verbas || 0) * 100,
      profit: (p.lucroMeta ?? 0.08) * 100,
    };
  const edit = (
    p: Product,
    i: number,
    field: "commission" | "allowance" | "profit",
    value: number,
  ) => setRates({ ...rates, [key(p, i)]: { ...rate(p, i), [field]: value } });
  const applyAll = async () => {
    const next = { ...rates };
    rows.forEach((p, i) => (next[key(p, i)] = { ...bulk }));
    setRates(next);
    await saveDurableValue("product-commercial-rates", next);
    setApplied(true);
    setTimeout(() => setApplied(false), 1500);
  };
  const createProduct = async () => {
    if (newProduct.code && newProduct.description) {
      await saveDurableValue(`new-product-${newProduct.code}`, newProduct);
      setCustomProducts((current) => [
        {
          codigo: newProduct.code,
          nome: newProduct.description,
          tipo: "IND",
          custo: 0,
          precoCalculado: 0,
          precoPraticado: 0,
          lucro: 0,
          margem: 0,
          comissao: 0.01,
          verbas: 0,
          lucroMeta: 0.06,
        } as Product,
        ...current,
      ]);
      setCreated(true);
      setTimeout(() => {
        setCreated(false);
        setNewOpen(false);
        setNewProduct({
          code: "",
          description: "",
          type: "Fabricado",
          unit: "UN",
          monophase: false,
          st: false,
        });
      }, 1200);
    }
  };
  const downloadProducts = () => {
    const blob = new Blob(
      ["Código;Descrição;Tipo;Unidade\n871;EXEMPLO;Fabricado;UN"],
      { type: "text/csv;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo-produtos.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  const action = (message: string) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 1800);
  };
  return (
    <section className="card products-screen">
      {notice && <div className="product-notice">{notice}</div>}
      <div className="products-import">
        <div>
          <b>Importação do cadastro de produtos</b>
          <span>
            Inclua ou atualize produtos por código. Produtos existentes serão
            mantidos com a ficha técnica atual para comparação posterior.
          </span>
        </div>
        <button onClick={downloadProducts}>Baixar planilha modelo</button>
        <button
          className="product-primary"
          onClick={() => importRef.current?.click()}
        >
          Importar Excel
        </button>
        <input
          ref={importRef}
          hidden
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(event) => {
            if (event.target.files?.[0])
              action(
                `Arquivo ${event.target.files[0].name} selecionado para importação`,
              );
          }}
        />
      </div>
      <div className="products-bulk">
        <div>
          <small>PREENCHIMENTO EM MASSA</small>
          <b>Aplicar percentuais a todos os produtos</b>
          <span>
            Preencha os campos e aplique à lista. Depois, qualquer produto
            poderá ser alterado individualmente na tabela.
          </span>
        </div>
        <label>
          Comissão
          <div>
            <input
              value={bulk.commission}
              onChange={(e) =>
                setBulk({ ...bulk, commission: Number(e.target.value) || 0 })
              }
            />
            <span>%</span>
          </div>
        </label>
        <label>
          Verbas comerciais
          <div>
            <input
              value={bulk.allowance}
              onChange={(e) =>
                setBulk({ ...bulk, allowance: Number(e.target.value) || 0 })
              }
            />
            <span>%</span>
          </div>
        </label>
        <label>
          Lucro
          <div>
            <input
              value={bulk.profit}
              onChange={(e) =>
                setBulk({ ...bulk, profit: Number(e.target.value) || 0 })
              }
            />
            <span>%</span>
          </div>
        </label>
        <button className="product-primary" onClick={applyAll}>
          {applied ? "Aplicado" : "Aplicar aos produtos"}
        </button>
      </div>
      {newOpen && (
        <div className="new-product-panel">
          <div>
            <small>NOVO PRODUTO</small>
            <b>
              Cadastre o produto; os componentes serão incluídos na ficha
              técnica
            </b>
            <span>Condição tributária do item</span>
          </div>
          <label>
            Código
            <input
              value={newProduct.code}
              onChange={(e) =>
                setNewProduct({ ...newProduct, code: e.target.value })
              }
            />
          </label>
          <label>
            Descrição
            <input
              value={newProduct.description}
              onChange={(e) =>
                setNewProduct({ ...newProduct, description: e.target.value })
              }
            />
          </label>
          <label>
            Tipo
            <select
              value={newProduct.type}
              onChange={(e) =>
                setNewProduct({ ...newProduct, type: e.target.value })
              }
            >
              <option>Fabricado</option>
              <option>Revenda</option>
              <option>Serviço</option>
            </select>
          </label>
          <label>
            Unidade
            <input
              value={newProduct.unit}
              onChange={(e) =>
                setNewProduct({ ...newProduct, unit: e.target.value })
              }
            />
          </label>
          <div className="new-tax-options">
            <label>
              <input
                type="checkbox"
                checked={newProduct.monophase}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, monophase: e.target.checked })
                }
              />
              PIS/Cofins monofásico
            </label>
            <label>
              <input
                type="checkbox"
                checked={newProduct.st}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, st: e.target.checked })
                }
              />
              ICMS já recolhido por substituição tributária (ST)
            </label>
            <p>
              Os tributos marcados não entrarão novamente no markup nem nas
              simulações.
            </p>
          </div>
          <div className="new-product-actions">
            <button onClick={() => setNewOpen(false)}>Cancelar</button>
            <button className="product-primary" onClick={createProduct}>
              {created ? "Produto incluído" : "Incluir e salvar"}
            </button>
          </div>
        </div>
      )}
      <div className="products-toolbar">
        <div>
          <Search size={16} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código ou descrição..."
          />
        </div>
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option>Todos</option>
          <option>Fabricados</option>
        </select>
        <select value={tax} onChange={(e) => setTax(e.target.value)}>
          <option>Todas</option>
          <option>Normal</option>
          <option>Monofásico</option>
          <option>ICMS ST</option>
        </select>
        <span>{rows.length} encontrados</span>
        <button
          className="product-primary"
          onClick={() => setNewOpen(!newOpen)}
        >
          + Novo produto
        </button>
      </div>
      <div className="products-table">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Produto</th>
              <th>Tipo</th>
              <th>Tributação</th>
              <th>Custo total</th>
              <th>Comissão</th>
              <th>Verbas comerciais</th>
              <th>Lucro</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => {
              const r = rate(p, i);
              return (
                <tr key={key(p, i)}>
                  <td>
                    <b>{p.codigo}</b>
                  </td>
                  <td>
                    <strong>{p.nome}</strong>
                  </td>
                  <td>
                    <span className="product-kind">
                      {p.tipo === "IND" ? "Fabricado" : "Revenda"}
                    </span>
                  </td>
                  <td>
                    <small
                      className={
                        taxType(p) === "Monofásico"
                          ? "tax-highlight monophase"
                          : taxType(p) === "ICMS ST"
                            ? "tax-highlight icms-st"
                            : "tax-normal"
                      }
                    >
                      {taxType(p)}
                    </small>
                  </td>
                  <td>
                    <b>{money(p.custo)}</b>
                  </td>
                  <td>
                    <PercentEdit
                      value={r.commission}
                      set={(v) => edit(p, i, "commission", v)}
                    />
                  </td>
                  <td>
                    <PercentEdit
                      value={r.allowance}
                      set={(v) => edit(p, i, "allowance", v)}
                    />
                  </td>
                  <td>
                    <PercentEdit
                      value={r.profit}
                      set={(v) => edit(p, i, "profit", v)}
                    />
                  </td>
                  <td>
                    <div className="product-actions">
                      <button
                        onClick={async () => {
                          await saveDurableValue(
                            "product-commercial-rates",
                            rates,
                          );
                          action(`Produto ${p.codigo} alterado e salvo`);
                        }}
                      >
                        Salvar
                      </button>
                      <button onClick={() => onNavigate("Fichas técnicas")}>
                        Ficha técnica
                      </button>
                      <button
                        onClick={() =>
                          action(
                            `Histórico do produto ${p.codigo} disponível para consulta`,
                          )
                        }
                      >
                        Histórico
                      </button>
                      <button
                        className="danger-action"
                        onClick={() =>
                          setHidden((current) => [...current, String(p.codigo)])
                        }
                      >
                        Excluir
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
function PercentEdit({
  value,
  set,
}: {
  value: number;
  set: (v: number) => void;
}) {
  return (
    <div className="percent-edit">
      <input
        value={Number(value.toFixed(getDisplayDigits()))}
        onChange={(e) => set(Number(e.target.value) || 0)}
      />
      <span>%</span>
    </div>
  );
}
function Num({
  label,
  value,
  set,
  money: asMoney,
  suffix,
}: {
  label: string;
  value: number;
  set: (v: number) => void;
  money?: boolean;
  suffix?: string;
}) {
  const digits = getDisplayDigits();
  return (
    <label>
      {label}
      <div className="number-input">
        {asMoney && <span>R$</span>}
        <input
          type="number"
          step={digits ? 10 ** -digits : 1}
          value={Number(value.toFixed(digits))}
          onChange={(e) => set(Number(e.target.value))}
        />
        {suffix && <span>{suffix}</span>}
      </div>
    </label>
  );
}
function PriceFormation() {
  const [index, setIndex] = useState(0),
    p = products[index] || products[0],
    [cost, setCost] = useState(p.custo),
    [profit, setProfit] = useState(p.lucroMeta ?? 0.08),
    [icms, setIcms] = useState(p.icms),
    [freight, setFreight] = useState(p.frete),
    [commission, setCommission] = useState(p.comissao),
    [expenses, setExpenses] = useState((p.ggf || 0) + (p.despesas || 0));
  const taxes = p.pis + p.cofins + p.irCs + icms,
    denominator =
      1 -
      (taxes +
        freight +
        commission +
        expenses +
        (p.verbas || 0) +
        profit +
        p.inadimplencia),
    calculated = denominator > 0 ? cost / denominator : 0;
  const choose = (i: number) => {
    const n = products[i];
    setIndex(i);
    setCost(n.custo);
    setProfit(n.lucroMeta ?? 0.08);
    setIcms(n.icms);
    setFreight(n.frete);
    setCommission(n.comissao);
    setExpenses((n.ggf || 0) + (n.despesas || 0));
  };
  return (
    <div className="pricing-grid">
      <section className="card form-card">
        <div className="card-title">
          <div>
            <small>PLANILHA DE FORMAÇÃO</small>
            <h2>Custos variáveis, fixos e lucro</h2>
          </div>
        </div>
        <label>
          Produto
          <select
            value={index}
            onChange={(e) => choose(Number(e.target.value))}
          >
            {products.slice(0, 180).map((x, i) => (
              <option value={i} key={`${x.codigo}-${i}`}>
                {x.codigo} — {x.nome}
              </option>
            ))}
          </select>
        </label>
        <div className="form-grid">
          <Num label="Custo direto" value={cost} set={setCost} money />
          <Num
            label="Lucro desejado"
            value={profit * 100}
            set={(v) => setProfit(v / 100)}
            suffix="%"
          />
          <Num
            label="ICMS"
            value={icms * 100}
            set={(v) => setIcms(v / 100)}
            suffix="%"
          />
          <Num
            label="Frete"
            value={freight * 100}
            set={(v) => setFreight(v / 100)}
            suffix="%"
          />
          <Num
            label="Comissão"
            value={commission * 100}
            set={(v) => setCommission(v / 100)}
            suffix="%"
          />
          <Num
            label="GGF + despesas"
            value={expenses * 100}
            set={(v) => setExpenses(v / 100)}
            suffix="%"
          />
        </div>
        <p className="formula-note">
          Regra validada na planilha: preço = custo ÷ (1 − impostos − frete −
          comissão − GGF/despesas − verbas − inadimplência − lucro).
        </p>
      </section>
      <section className="price-result">
        <small>PREÇO CALCULADO</small>
        <b>{money(calculated)}</b>
        <span>Preço praticado: {money(p.precoPraticado)}</span>
        <div>
          <p>
            <small>Markup</small>
            <strong>
              {cost
                ? (calculated / cost).toLocaleString("pt-BR", {
                    maximumFractionDigits: 3,
                  })
                : "—"}
            </strong>
          </p>
          <p>
            <small>Margem projetada</small>
            <strong>{pct(profit)}</strong>
          </p>
          <p>
            <small>Total de percentuais</small>
            <strong>{pct(1 - denominator)}</strong>
          </p>
        </div>
        <button>Salvar simulação</button>
      </section>
    </div>
  );
}
type MixRow = {
  product: Product;
  qty: number;
  discount: number;
  bonus: number;
};
type PromotionComparison = {
  grossRevenue: number;
  soldQty: number;
  bonusQty: number;
  soldCost: number;
  discountValue: number;
  discountRevenue: number;
  discountCharges: number;
  discountTaxes: number;
  discountCommission: number;
  discountFreight: number;
  discountCommercial: number;
  discountExpenses: number;
  discountDefaultLoss: number;
  discountGgf: number;
  discountResult: number;
  bonusSaleCharges: number;
  bonusTaxes: number;
  bonusCommission: number;
  bonusFreight: number;
  bonusCommercial: number;
  bonusExpenses: number;
  bonusDefaultLoss: number;
  bonusGgf: number;
  bonusGiftGgf: number;
  bonusGiftBase: number;
  bonusIcmsBase: number;
  bonusCost: number;
  bonusIcms: number;
  bonusCompanyNet: number;
  bonusResult: number;
  campaignUnitPrice: number;
  companyUnitNet: number;
  companyLossRate: number;
  companyMargin: number;
  advantage: number;
};
type SavedSimulation = {
  id: string;
  name: string;
  state: string;
  createdAt: string;
  mix: MixRow[];
  calculated?: ResultBreakdown;
  practiced?: ResultBreakdown;
  difference?: number;
  promotion?: PromotionComparison;
  bonusIcmsPercent?: number;
  includeGgfInCampaign?: boolean;
};
type SimulationResaleRow = {
  code: string;
  name: string;
  unit: string;
  cost: number;
  commission?: number;
  allowance?: number;
  profit?: number;
  pisTreatment: "Normal" | "Monofásico";
  icmsTreatment: "ICMS normal" | "ICMS ST";
  status: string;
};
type ResultBreakdown = {
  revenue: number;
  base?: number;
  discount?: number;
  cost: number;
  taxes: number;
  commission: number;
  freight: number;
  commercial: number;
  expenses: number;
  ggf: number;
  defaultLoss: number;
  result: number;
};
function MoneyWithRate({
  value,
  base,
  rateValue,
}: {
  value: number;
  base?: number;
  rateValue?: number;
}) {
  const displayedRate = rateValue ?? (base ? (value / base) * 100 : 0);
  return (
    <strong>
      {money(value)} <small>({decimal(displayedRate)}%)</small>
    </strong>
  );
}
function PromotionRecovery({ promo }: { promo: PromotionComparison }) {
  const lossToZero = Math.max(0, -promo.bonusResult),
    gapToDiscount = Math.max(0, promo.discountResult - promo.bonusResult),
    recoveryNeed = Math.max(lossToZero, gapToDiscount),
    normalContribution =
      promo.grossRevenue - promo.soldCost - promo.bonusSaleCharges,
    contributionRate = promo.grossRevenue
      ? normalContribution / promo.grossRevenue
      : 0,
    contributionPerUnit = promo.soldQty
      ? normalContribution / promo.soldQty
      : 0,
    variableChargeRate = promo.grossRevenue
      ? promo.bonusSaleCharges / promo.grossRevenue
      : 0,
    retainedPriceRate = 1 - variableChargeRate,
    extraRevenue = contributionRate > 0 ? recoveryNeed / contributionRate : 0,
    extraUnits =
      contributionPerUnit > 0
        ? Math.ceil(recoveryNeed / contributionPerUnit)
        : 0,
    currentUnitPrice = promo.soldQty ? promo.grossRevenue / promo.soldQty : 0,
    priceRecoveryRevenue =
      retainedPriceRate > 0 ? recoveryNeed / retainedPriceRate : 0,
    requiredRevenueSameQty = promo.grossRevenue + priceRecoveryRevenue,
    requiredUnitPrice = promo.soldQty
      ? requiredRevenueSameQty / promo.soldQty
      : 0,
    unitPriceIncrease = requiredUnitPrice - currentUnitPrice,
    unitPriceIncreaseRate = currentUnitPrice
      ? unitPriceIncrease / currentUnitPrice
      : 0,
    reason =
      lossToZero >= gapToDiscount
        ? "zerar o prejuízo"
        : "igualar o resultado do desconto";
  if (recoveryNeed <= 0)
    return (
      <div className="promotion-recovery positive">
        <b>Não há perda a compensar</b>
        <span>
          A bonificação preserva resultado igual ou superior ao cenário de
          desconto.
        </span>
      </div>
    );
  if (
    (contributionRate <= 0 || contributionPerUnit <= 0) &&
    (retainedPriceRate <= 0 || promo.soldQty <= 0)
  )
    return (
      <div className="promotion-recovery negative">
        <b>Venda adicional não compensa nas condições atuais</b>
        <span>
          A margem de contribuição normal está nula ou negativa. É necessário
          revisar preço, custos ou encargos.
        </span>
      </div>
    );
  return (
    <div className="promotion-recovery">
      <small>RECUPERAÇÃO DA PERDA</small>
      <p>
        <span>Valor a compensar para {reason}</span>
        <strong>{money(recoveryNeed)}</strong>
      </p>
      <p>
        <span>Margem de contribuição normal</span>
        <strong>
          {money(contributionPerUnit)} por unidade · {pct(contributionRate)}
        </strong>
      </p>
      {contributionRate > 0 && contributionPerUnit > 0 ? (
        <>
          <p>
            <span>Quantidade adicional estimada</span>
            <strong>{decimal(extraUnits)} produtos</strong>
          </p>
          <p>
            <span>Faturamento adicional necessário</span>
            <strong>{money(extraRevenue)}</strong>
          </p>
        </>
      ) : (
        <p>
          <span>Compensação vendendo mais unidades</span>
          <strong>Não viável com a margem atual</strong>
        </p>
      )}
      {retainedPriceRate > 0 && promo.soldQty > 0 && (
        <>
          <p className="recovery-separator">
            <span>Preço unitário médio atual</span>
            <strong>{money(currentUnitPrice)}</strong>
          </p>
          <p>
            <span>Acréscimo necessário por unidade</span>
            <strong>
              {money(unitPriceIncrease)} · {pct(unitPriceIncreaseRate)}
            </strong>
          </p>
          <p>
            <span>Preço unitário médio necessário</span>
            <strong>{money(requiredUnitPrice)}</strong>
          </p>
          <p>
            <span>Faturamento total com a mesma quantidade</span>
            <strong>{money(requiredRevenueSameQty)}</strong>
          </p>
        </>
      )}
      <em>
        Quantidade adicional: perda ÷ margem por unidade. Para manter a mesma
        quantidade, o reajuste considera que custos fixos do produto não
        aumentam, mas os encargos percentuais acompanham o novo preço.
      </em>
    </div>
  );
}
function SimulationResultCard({
  kind,
  data,
}: {
  kind: "calculated" | "practiced";
  data: ResultBreakdown;
}) {
  const practiced = kind === "practiced",
    positive = data.result >= 0;
  const rows: {
    label: string;
    value: number;
    strong?: boolean;
    revenue?: boolean;
  }[] = [
    ...(practiced
      ? [
          {
            label: "Venda pelo preço-base",
            value: data.base || 0,
            revenue: true,
          },
          { label: "(−) Descontos concedidos", value: data.discount || 0 },
        ]
      : []),
    {
      label: "Receita líquida da venda",
      value: data.revenue,
      strong: true,
      revenue: true,
    },
    { label: "(−) Custo dos produtos", value: data.cost },
    { label: "(−) Tributos", value: data.taxes },
    { label: "(−) Comissão", value: data.commission },
    { label: "(−) Frete por estado", value: data.freight },
    { label: "(−) Verbas comerciais", value: data.commercial },
    { label: "(−) Despesas administrativas", value: data.expenses },
    { label: "(−) GGF industrial", value: data.ggf },
    { label: "(−) Inadimplência", value: data.defaultLoss },
  ];
  return (
    <section
      className={`simulation-result-card ${practiced ? "effective" : "reference"}`}
    >
      <header>
        <div>
          <small>
            {practiced ? "RESULTADO EFETIVO" : "RESULTADO DE REFERÊNCIA"}
          </small>
          <h3>
            {practiced
              ? "Resultado pelo preço praticado"
              : "Resultado pelo preço calculado"}
          </h3>
          <p>
            {practiced
              ? "Preço líquido após o desconto"
              : "Referência formada pelo sistema"}
          </p>
        </div>
        <span className={positive ? "profit" : "loss"}>
          {positive ? "Lucro" : "Prejuízo"}
        </span>
      </header>
      <div className="simulation-result-lines">
        {rows.map((row) => (
          <div
            className={`${row.strong ? "strong " : ""}${row.revenue ? "revenue" : ""}`}
            key={row.label}
          >
            <span>{row.label}</span>
            <b>{money(row.value)}</b>
          </div>
        ))}
      </div>
      <footer>
        <span>
          {positive ? "LUCRO APURADO" : "PREJUÍZO APURADO"}
          <small>
            Margem: {pct(data.revenue ? data.result / data.revenue : 0)}
          </small>
        </span>
        <b>{money(data.result)}</b>
      </footer>
    </section>
  );
}
function SavedPromotionComparison({
  promo,
  includeGgf,
  bonusIcms,
}: {
  promo: PromotionComparison;
  includeGgf: boolean;
  bonusIcms: number;
}) {
  return (
    <section className="promotion-comparison saved-promotion-comparison">
      <div className="promotion-heading">
        <div>
          <small>COMPARATIVO SALVO — DESCONTO × BONIFICAÇÃO</small>
          <h2>Quadro gravado com a simulação</h2>
          <p>
            ICMS da bonificação: {decimal(bonusIcms)}%. O GGF dos produtos
            vendidos foi sempre incluído. Nas unidades bonificadas, o GGF foi{" "}
            {includeGgf ? "incluído" : "desconsiderado"}.
          </p>
        </div>
      </div>
      <div className="promotion-cards detailed">
        <article>
          <small>CENÁRIO 1 — DESCONTO NA NOTA</small>
          <h3>Memória do desconto</h3>
          <div className="promotion-lines">
            <p>
              <span>Venda pelo preço normal</span>
              <strong>{money(promo.grossRevenue)}</strong>
            </p>
            <p>
              <span>(−) Desconto concedido</span>
              <MoneyWithRate
                value={promo.discountValue}
                base={promo.grossRevenue}
              />
            </p>
            <p className="subtotal">
              <span>Receita após desconto</span>
              <strong>{money(promo.discountRevenue)}</strong>
            </p>
            <p>
              <span>(−) Custo dos itens vendidos</span>
              <strong>{money(promo.soldCost)}</strong>
            </p>
            <p>
              <span>(−) Tributos</span>
              <MoneyWithRate
                value={promo.discountTaxes || 0}
                base={promo.discountRevenue}
              />
            </p>
            <p>
              <span>(−) Comissão</span>
              <MoneyWithRate
                value={promo.discountCommission || 0}
                base={promo.discountRevenue}
              />
            </p>
            <p>
              <span>(−) Frete</span>
              <MoneyWithRate
                value={promo.discountFreight || 0}
                base={promo.discountRevenue}
              />
            </p>
            <p>
              <span>(−) Verbas comerciais</span>
              <MoneyWithRate
                value={promo.discountCommercial || 0}
                base={promo.discountRevenue}
              />
            </p>
            <p>
              <span>(−) Despesas administrativas</span>
              <MoneyWithRate
                value={promo.discountExpenses || 0}
                base={promo.discountRevenue}
              />
            </p>
            <p>
              <span>(−) Inadimplência</span>
              <MoneyWithRate
                value={promo.discountDefaultLoss || 0}
                base={promo.discountRevenue}
              />
            </p>
            <p>
              <span>(−) GGF dos produtos fabricados</span>
              <MoneyWithRate
                value={promo.discountGgf || 0}
                base={promo.discountRevenue}
              />
            </p>
            <p className="subtotal">
              <span>Total dos encargos após desconto</span>
              <MoneyWithRate
                value={promo.discountCharges}
                base={promo.discountRevenue}
              />
            </p>
          </div>
          <b>{money(promo.discountResult)}</b>
        </article>
        <article>
          <small>CENÁRIO 2 — BONIFICAÇÃO</small>
          <h3>Memória da bonificação</h3>
          <div className="promotion-lines">
            <p>
              <span>Venda normal faturada</span>
              <strong>{money(promo.grossRevenue)}</strong>
            </p>
            <p>
              <span>(−) Custo dos itens vendidos</span>
              <strong>{money(promo.soldCost)}</strong>
            </p>
            <p>
              <span>(−) Tributos da venda normal</span>
              <MoneyWithRate
                value={promo.bonusTaxes || 0}
                base={promo.grossRevenue}
              />
            </p>
            <p>
              <span>(−) Comissão</span>
              <MoneyWithRate
                value={promo.bonusCommission || 0}
                base={promo.grossRevenue}
              />
            </p>
            <p>
              <span>(−) Frete</span>
              <MoneyWithRate
                value={promo.bonusFreight || 0}
                base={promo.grossRevenue}
              />
            </p>
            <p>
              <span>(−) Verbas comerciais</span>
              <MoneyWithRate
                value={promo.bonusCommercial || 0}
                base={promo.grossRevenue}
              />
            </p>
            <p>
              <span>(−) Despesas administrativas</span>
              <MoneyWithRate
                value={promo.bonusExpenses || 0}
                base={promo.grossRevenue}
              />
            </p>
            <p>
              <span>(−) Inadimplência</span>
              <MoneyWithRate
                value={promo.bonusDefaultLoss || 0}
                base={promo.grossRevenue}
              />
            </p>
            <p>
              <span>(−) GGF dos produtos vendidos</span>
              <MoneyWithRate
                value={promo.bonusGgf || 0}
                base={promo.grossRevenue}
              />
            </p>
            <p className="subtotal">
              <span>Total dos encargos da venda normal</span>
              <MoneyWithRate
                value={promo.bonusSaleCharges}
                base={promo.grossRevenue}
              />
            </p>
            <p className="bonus-only">
              <span>(−) Custo das unidades bonificadas</span>
              <strong>{money(promo.bonusCost)}</strong>
            </p>
            <p className="bonus-only">
              <span>(−) ICMS da bonificação</span>
              <MoneyWithRate
                value={promo.bonusIcms}
                base={promo.bonusIcmsBase}
                rateValue={promo.bonusIcmsBase ? bonusIcms : 0}
              />
            </p>
            {includeGgf && (
              <p className="bonus-only">
                <span>(−) GGF das unidades bonificadas</span>
                <MoneyWithRate
                  value={promo.bonusGiftGgf || 0}
                  base={promo.bonusGiftBase}
                />
              </p>
            )}
          </div>
          <b>{money(promo.bonusResult)}</b>
          <p>
            Resultado = venda normal − custo vendido − encargos da venda com GGF
            dos vendidos − custo bonificado − ICMS da bonificação − GGF opcional
            das unidades bonificadas.
          </p>
        </article>
        <article className={promo.advantage >= 0 ? "winner" : "warning"}>
          <small>ANÁLISE SALVA</small>
          <h3>
            {promo.advantage >= 0
              ? "Bonificação mais vantajosa"
              : "Desconto mais vantajoso"}
          </h3>
          <div className="promotion-lines campaign">
            <p>
              <span>Quantidade vendida</span>
              <strong>{decimal(promo.soldQty)}</strong>
            </p>
            <p>
              <span>Quantidade bonificada</span>
              <strong>{decimal(promo.bonusQty)}</strong>
            </p>
            <p>
              <span>Preço econômico para o cliente</span>
              <strong>{money(promo.campaignUnitPrice)}</strong>
            </p>
            <p>
              <span>Valor líquido por unidade</span>
              <strong>{money(promo.companyUnitNet)}</strong>
            </p>
            <p>
              <span>Perda na bonificação</span>
              <strong>{pct(promo.companyLossRate)}</strong>
            </p>
            <p>
              <span>Margem sobre o custo</span>
              <strong>{pct(promo.companyMargin)}</strong>
            </p>
          </div>
          <PromotionRecovery promo={promo} />
          <b>{money(Math.abs(promo.advantage))}</b>
          <p>Diferença entre os dois cenários.</p>
        </article>
      </div>
    </section>
  );
}
function SalesSimulation() {
  const initialResale = useMemo<SimulationResaleRow[]>(
    () =>
      products
        .filter((product) => product.tipo !== "IND")
        .map((product) => ({
          code: product.codigo,
          name: product.nome,
          unit: "UN",
          cost: product.custo,
          pisTreatment: "Normal",
          icmsTreatment: "ICMS normal",
          status: "Vinculado",
        })),
    [],
  );
  const [resaleRows] = useDurableState<SimulationResaleRow[]>(
    "catalog-resale-v2",
    initialResale,
  );
  const [stateFreights] = useDurableState<Record<string, number>>(
      "state-freights-v1",
      Object.fromEntries(salesStates.map(([uf]) => [uf, 8])),
    ),
    [taxSettings] = useDurableState<{
      rates?: Record<string, number>;
    }>("tax-settings", { rates: defaultSalesIcms });
  const simulationProducts = useMemo<Product[]>(() => {
    const sourceByCode = new Map(
        products.map((product) => [product.codigo.toUpperCase(), product]),
      ),
      manufactured = products.filter((product) => product.tipo === "IND"),
      resale = resaleRows
        .filter((row) => row.status !== "Inativo")
        .map((row) => {
          const commercial = {
              comissao: (row.commission ?? 1) / 100,
              verbas: (row.allowance ?? 0) / 100,
              lucroMeta: (row.profit ?? 10) / 100,
            },
            source = sourceByCode.get(row.code.toUpperCase());
          if (source)
            return withTaxTreatment(
              {
                ...source,
                ...commercial,
                codigo: row.code,
                nome: row.name,
                custo: row.cost,
                tipo: "REV",
              },
              {
                monophase: row.pisTreatment === "Monofásico",
                st: row.icmsTreatment === "ICMS ST",
              },
            ) as Product;
          const calculated = row.cost / 0.62;
          return {
            codigo: row.code,
            nome: row.name,
            tipo: "REV",
            custo: row.cost,
            precoCalculado: calculated,
            precoPraticado: calculated,
            lucro: calculated - row.cost,
            margem: calculated ? (calculated - row.cost) / calculated : 0,
            ggf: 0.11385937,
            despesas: 0.21100515,
            verbas: commercial.verbas,
            comissao: commercial.comissao,
            frete: 0.08,
            inadimplencia: 0.0005,
            lucroMeta: commercial.lucroMeta,
            icms: row.icmsTreatment === "ICMS ST" ? 0 : 0.12,
            pis: row.pisTreatment === "Monofásico" ? 0 : 0.0065,
            cofins: row.pisTreatment === "Monofásico" ? 0 : 0.03,
            irCs: 0.0228,
          } as Product;
        }),
      unique = new Map<string, Product>();
    [...manufactured, ...resale].forEach((product) =>
      unique.set(product.codigo.toUpperCase(), product),
    );
    return [...unique.values()].sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR"),
    );
  }, [resaleRows]);
  const [saved, setSaved] = useDurableState<SavedSimulation[]>(
    "sales-simulations-v1",
    [],
  );
  const [name, setName] = useState(""),
    [state, setState] = useState("RS — Rio Grande do Sul"),
    [bonusIcmsPercent, setBonusIcmsPercent] = useState(18),
    [includeGgfInCampaign, setIncludeGgfInCampaign] = useState(false),
    [selectedCode, setSelectedCode] = useState("__none__"),
    [productSearch, setProductSearch] = useState(""),
    [mix, setMix] = useState<MixRow[]>([]),
    [search, setSearch] = useState(""),
    [viewingSaved, setViewingSaved] = useState(false),
    [editingSavedId, setEditingSavedId] = useState<string | null>(null),
    [saveNotice, setSaveNotice] = useState(""),
    [viewedSnapshot, setViewedSnapshot] = useState<SavedSimulation | null>(
      null,
    ),
    [showDemonstrative, setShowDemonstrative] = useState(true),
    [expandedSavedId, setExpandedSavedId] = useState<string | null>(null);
  const resultRef = useRef<HTMLElement | null>(null);
  const filteredProducts = useMemo(() => {
    const term = productSearch.trim().toLocaleLowerCase("pt-BR");
    return term
      ? simulationProducts.filter((product) =>
          `${product.codigo} ${product.nome} ${product.tipo === "IND" ? "fabricado" : "revenda"}`
            .toLocaleLowerCase("pt-BR")
            .includes(term),
        )
      : simulationProducts;
  }, [productSearch, simulationProducts]);
  const addProduct = () => {
    const product = simulationProducts.find(
      (item) => item.codigo === selectedCode,
    );
    if (!product) return;
    setMix((rows) =>
      rows.some((row) => row.product.codigo === product.codigo)
        ? rows
        : [...rows, { product, qty: 1, discount: 0, bonus: 0 }],
    );
    setSelectedCode("__none__");
    setShowDemonstrative(true);
    setViewingSaved(false);
    setViewedSnapshot(null);
  };
  const update = (
    index: number,
    key: "qty" | "discount" | "bonus",
    value: number,
  ) => {
    setMix((rows) =>
      rows.map((row, i) =>
        i === index
          ? {
              ...row,
              [key]:
                key === "qty"
                  ? Math.max(0.0001, value || 1)
                  : Math.max(0, value),
            }
          : row,
      ),
    );
    setShowDemonstrative(true);
    setViewingSaved(false);
    setViewedSnapshot(null);
  };
  const totals = mix.reduce(
    (acc, row) => {
      const calc = row.product.precoCalculado * row.qty,
        practiced =
          row.product.precoPraticado * row.qty * (1 - row.discount / 100),
        resultCalc = (row.product.precoCalculado - row.product.custo) * row.qty,
        resultPracticed =
          (row.product.precoPraticado * (1 - row.discount / 100) -
            row.product.custo) *
          row.qty;
      return {
        calc: acc.calc + calc,
        practiced: acc.practiced + practiced,
        resultCalc: acc.resultCalc + resultCalc,
        resultPracticed: acc.resultPracticed + resultPracticed,
      };
    },
    { calc: 0, practiced: 0, resultCalc: 0, resultPracticed: 0 },
  );
  const selectedUf = state.slice(0, 2),
    freightRate = (stateFreights[selectedUf] ?? 8) / 100,
    stateIcmsRate =
      (taxSettings.rates?.[selectedUf] ?? defaultSalesIcms[selectedUf] ?? 0) /
      100,
    rsIcmsRate = bonusIcmsPercent / 100;
  const numeric = (value: unknown, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const rate = (value: unknown, fallback = 0) => {
    const parsed = numeric(value, fallback);
    return parsed > 1 ? parsed / 100 : parsed;
  };
  const resultBreakdowns = (["calculated", "practiced"] as const).map(
    (kind) => {
      const practiced = kind === "practiced";
      return mix.reduce<ResultBreakdown>(
        (acc, row) => {
          const product = row.product || ({} as Product),
            qty = Math.max(0, numeric(row.qty)),
            costUnit = numeric(product.custo),
            taxRate =
              ((
                product as Product & {
                  monophase?: boolean;
                }
              ).monophase
                ? 0
                : rate(product.pis, 0.0065) + rate(product.cofins, 0.03)) +
              rate(product.irCs, 0.0228) +
              ((
                product as Product & {
                  st?: boolean;
                  simplesIcms?: boolean;
                }
              ).st ||
              (
                product as Product & {
                  simplesIcms?: boolean;
                }
              ).simplesIcms === false
                ? 0
                : stateIcmsRate),
            commissionRate = rate(product.comissao, 0.03),
            commercialRate = rate(product.verbas, 0.03),
            expenseRate = rate(product.despesas, 0.2),
            ggfRate = product.tipo === "IND" ? rate(product.ggf, 0.16) : 0,
            defaultRate = rate(product.inadimplencia, 0.0005),
            calculatedUnit = numeric(product.precoCalculado, costUnit),
            practicedUnit = numeric(product.precoPraticado, calculatedUnit),
            base = (practiced ? practicedUnit : calculatedUnit) * qty,
            discount = practiced
              ? base * (Math.max(0, numeric(row.discount)) / 100)
              : 0,
            revenue = base - discount,
            cost = costUnit * qty,
            taxes = revenue * taxRate,
            commission = revenue * commissionRate,
            freight = revenue * freightRate,
            commercial = revenue * commercialRate,
            expenses = revenue * expenseRate,
            ggf = revenue * ggfRate,
            defaultLoss = revenue * defaultRate;
          acc.base = (acc.base || 0) + base;
          acc.discount = (acc.discount || 0) + discount;
          acc.revenue += revenue;
          acc.cost += cost;
          acc.taxes += taxes;
          acc.commission += commission;
          acc.freight += freight;
          acc.commercial += commercial;
          acc.expenses += expenses;
          acc.ggf += ggf;
          acc.defaultLoss += defaultLoss;
          acc.result +=
            revenue -
            cost -
            taxes -
            commission -
            freight -
            commercial -
            expenses -
            ggf -
            defaultLoss;
          return acc;
        },
        {
          revenue: 0,
          base: 0,
          discount: 0,
          cost: 0,
          taxes: 0,
          commission: 0,
          freight: 0,
          commercial: 0,
          expenses: 0,
          ggf: 0,
          defaultLoss: 0,
          result: 0,
        },
      );
    },
  );
  const [calculatedBreakdown, practicedBreakdown] = resultBreakdowns,
    difference = practicedBreakdown.result - calculatedBreakdown.result;
  const promotion = mix.reduce<PromotionComparison>(
    (acc, row) => {
      const product = row.product,
        qty = Math.max(0, numeric(row.qty)),
        bonusQty = Math.max(0, numeric(row.bonus)),
        price = numeric(product.precoPraticado, product.precoCalculado),
        cost = numeric(product.custo),
        discount = Math.max(0, numeric(row.discount)) / 100,
        revenue = price * qty,
        normalPisCofins = (
          product as Product & {
            monophase?: boolean;
          }
        ).monophase
          ? 0
          : rate(product.pis, 0.0065) + rate(product.cofins, 0.03),
        normalIcms =
          (
            product as Product & {
              st?: boolean;
              simplesIcms?: boolean;
            }
          ).st ||
          (
            product as Product & {
              simplesIcms?: boolean;
            }
          ).simplesIcms === false
            ? 0
            : stateIcmsRate,
        baseSaleRates =
          normalPisCofins +
          rate(product.irCs, 0.0228) +
          normalIcms +
          rate(product.comissao, 0.03) +
          freightRate +
          rate(product.verbas, 0.03) +
          rate(product.despesas, 0.2) +
          rate(product.inadimplencia, 0.0005),
        discountGgf = product.tipo === "IND" ? rate(product.ggf, 0.16) : 0,
        normalGgf = product.tipo === "IND" ? rate(product.ggf, 0.16) : 0,
        discountSaleRates = baseSaleRates + discountGgf,
        bonusSaleRates = baseSaleRates + normalGgf,
        discountValue = revenue * discount,
        discountRevenue = revenue - discountValue,
        soldCost = cost * qty,
        discountTaxes =
          discountRevenue *
          (normalPisCofins + rate(product.irCs, 0.0228) + normalIcms),
        discountCommission = discountRevenue * rate(product.comissao, 0.03),
        discountFreight = discountRevenue * freightRate,
        discountCommercial = discountRevenue * rate(product.verbas, 0.03),
        discountExpenses = discountRevenue * rate(product.despesas, 0.2),
        discountDefaultLoss =
          discountRevenue * rate(product.inadimplencia, 0.0005),
        discountGgfValue = discountRevenue * discountGgf,
        discountCharges = discountRevenue * discountSaleRates,
        discountResult = discountRevenue - soldCost - discountCharges,
        bonusSaleCharges = revenue * bonusSaleRates,
        bonusTaxes =
          revenue * (normalPisCofins + rate(product.irCs, 0.0228) + normalIcms),
        bonusCommission = revenue * rate(product.comissao, 0.03),
        bonusFreight = revenue * freightRate,
        bonusCommercial = revenue * rate(product.verbas, 0.03),
        bonusExpenses = revenue * rate(product.despesas, 0.2),
        bonusDefaultLoss = revenue * rate(product.inadimplencia, 0.0005),
        bonusGgfValue = revenue * normalGgf,
        bonusGiftBase = product.tipo === "IND" ? price * bonusQty : 0,
        bonusGiftGgf =
          includeGgfInCampaign && product.tipo === "IND"
            ? bonusGiftBase * normalGgf
            : 0,
        bonusCost = cost * bonusQty,
        bonusIcmsBase =
          (
            product as Product & {
              st?: boolean;
              simplesIcms?: boolean;
            }
          ).st ||
          (
            product as Product & {
              simplesIcms?: boolean;
            }
          ).simplesIcms === false
            ? 0
            : price * bonusQty,
        bonusIcms = bonusIcmsBase * rsIcmsRate,
        bonusCompanyNet = revenue - bonusCost - bonusIcms,
        bonusResult =
          revenue -
          soldCost -
          bonusSaleCharges -
          bonusCost -
          bonusIcms -
          bonusGiftGgf;
      acc.grossRevenue += revenue;
      acc.soldQty += qty;
      acc.bonusQty += bonusQty;
      acc.soldCost += soldCost;
      acc.discountValue += discountValue;
      acc.discountRevenue += discountRevenue;
      acc.discountCharges += discountCharges;
      acc.discountTaxes += discountTaxes;
      acc.discountCommission += discountCommission;
      acc.discountFreight += discountFreight;
      acc.discountCommercial += discountCommercial;
      acc.discountExpenses += discountExpenses;
      acc.discountDefaultLoss += discountDefaultLoss;
      acc.discountGgf += discountGgfValue;
      acc.discountResult += discountResult;
      acc.bonusSaleCharges += bonusSaleCharges;
      acc.bonusTaxes += bonusTaxes;
      acc.bonusCommission += bonusCommission;
      acc.bonusFreight += bonusFreight;
      acc.bonusCommercial += bonusCommercial;
      acc.bonusExpenses += bonusExpenses;
      acc.bonusDefaultLoss += bonusDefaultLoss;
      acc.bonusGgf += bonusGgfValue;
      acc.bonusGiftGgf += bonusGiftGgf;
      acc.bonusGiftBase += bonusGiftBase;
      acc.bonusCost += bonusCost;
      acc.bonusIcms += bonusIcms;
      acc.bonusIcmsBase += bonusIcmsBase;
      acc.bonusCompanyNet += bonusCompanyNet;
      acc.bonusResult += bonusResult;
      return acc;
    },
    {
      grossRevenue: 0,
      soldQty: 0,
      bonusQty: 0,
      soldCost: 0,
      discountValue: 0,
      discountRevenue: 0,
      discountCharges: 0,
      discountTaxes: 0,
      discountCommission: 0,
      discountFreight: 0,
      discountCommercial: 0,
      discountExpenses: 0,
      discountDefaultLoss: 0,
      discountGgf: 0,
      discountResult: 0,
      bonusSaleCharges: 0,
      bonusTaxes: 0,
      bonusCommission: 0,
      bonusFreight: 0,
      bonusCommercial: 0,
      bonusExpenses: 0,
      bonusDefaultLoss: 0,
      bonusGgf: 0,
      bonusGiftGgf: 0,
      bonusGiftBase: 0,
      bonusIcmsBase: 0,
      bonusCost: 0,
      bonusIcms: 0,
      bonusCompanyNet: 0,
      bonusResult: 0,
      campaignUnitPrice: 0,
      companyUnitNet: 0,
      companyLossRate: 0,
      companyMargin: 0,
      advantage: 0,
    },
  );
  promotion.campaignUnitPrice =
    promotion.soldQty + promotion.bonusQty
      ? promotion.grossRevenue / (promotion.soldQty + promotion.bonusQty)
      : 0;
  promotion.companyUnitNet = promotion.soldQty
    ? promotion.bonusCompanyNet / promotion.soldQty
    : 0;
  const normalUnit = promotion.soldQty
      ? promotion.grossRevenue / promotion.soldQty
      : 0,
    averageCost = promotion.soldQty
      ? promotion.soldCost / promotion.soldQty
      : 0;
  promotion.companyLossRate = normalUnit
    ? (normalUnit - promotion.companyUnitNet) / normalUnit
    : 0;
  promotion.companyMargin = averageCost
    ? promotion.companyUnitNet / averageCost - 1
    : 0;
  promotion.advantage = promotion.bonusResult - promotion.discountResult;
  const displayedCalculated =
      viewingSaved && viewedSnapshot?.calculated
        ? viewedSnapshot.calculated
        : calculatedBreakdown,
    displayedPracticed =
      viewingSaved && viewedSnapshot?.practiced
        ? viewedSnapshot.practiced
        : practicedBreakdown,
    displayedDifference =
      viewingSaved && typeof viewedSnapshot?.difference === "number"
        ? viewedSnapshot.difference
        : displayedPracticed.result - displayedCalculated.result;
  useEffect(() => {
    if (viewingSaved)
      setTimeout(
        () =>
          resultRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        80,
      );
  }, [viewingSaved, viewedSnapshot]);
  const newSimulation = () => {
    setName("");
    setMix([]);
    setSelectedCode("__none__");
    setProductSearch("");
    setViewingSaved(false);
    setViewedSnapshot(null);
    setEditingSavedId(null);
    setExpandedSavedId(null);
    setShowDemonstrative(true);
    setBonusIcmsPercent(18);
    setIncludeGgfInCampaign(false);
    setSaveNotice("");
  };
  const saveSimulation = async () => {
    if (!mix.length) {
      setSaveNotice("Inclua ao menos um produto antes de salvar a simulação.");
      return;
    }
    const finalName = name.trim() || `Simulação ${saved.length + 1}`,
      id = editingSavedId || String(Date.now()),
      record: SavedSimulation = {
        id,
        name: finalName,
        state,
        createdAt: new Date().toISOString(),
        mix: mix.map((row) => ({ ...row, product: { ...row.product } })),
        calculated: { ...calculatedBreakdown },
        practiced: { ...practicedBreakdown },
        difference,
        promotion: { ...promotion },
        bonusIcmsPercent,
        includeGgfInCampaign,
      },
      next = [record, ...saved.filter((item) => item.id !== id)];
    setSaveNotice("Salvando histórico...");
    const ok = await saveDurableValue("sales-simulations-v1", next);
    if (ok) {
      setSaved(next);
      setName("");
      setMix([]);
      setSelectedCode("__none__");
      setProductSearch("");
      setViewingSaved(false);
      setViewedSnapshot(null);
      setEditingSavedId(null);
      setShowDemonstrative(false);
      setSaveNotice(
        "Simulação e comparativo desconto × bonificação guardados no histórico.",
      );
    } else setSaveNotice("Não foi possível guardar. Tente novamente.");
  };
  const openSaved = (item: SavedSimulation, edit = false) => {
    const restored = (item.mix || []).map((row) => {
      const current = simulationProducts.find(
        (product) => product.codigo === row.product?.codigo,
      );
      return {
        ...row,
        qty: Math.max(0.0001, numeric(row.qty, 1)),
        discount: Math.max(0, numeric(row.discount)),
        bonus: Math.max(0, numeric(row.bonus)),
        product: { ...(current || {}), ...(row.product || {}) } as Product,
      };
    });
    setName(item.name);
    setState(item.state || "RS — Rio Grande do Sul");
    setBonusIcmsPercent(item.bonusIcmsPercent ?? 18);
    setIncludeGgfInCampaign(item.includeGgfInCampaign ?? false);
    setMix(restored);
    setViewingSaved(!edit);
    setViewedSnapshot(edit ? null : item);
    setEditingSavedId(edit ? item.id : null);
    setShowDemonstrative(restored.length > 0);
    setSaveNotice(
      restored.length
        ? edit
          ? "Simulação aberta para alteração."
          : "Demonstrativo e comparativo recuperados do histórico."
        : "Esta simulação não possui produtos e, por isso, não tem demonstrativo.",
    );
  };
  const deleteSaved = async (id: string) => {
    const next = saved.filter((item) => item.id !== id);
    setSaved(next);
    await saveDurableValue("sales-simulations-v1", next);
  };
  const exportExcel = () => {
    const header =
      "Produto;Quantidade;Preço calculado;Preço praticado;Desconto\n";
    const lines = mix
      .map(
        (row) =>
          `${row.product.codigo} - ${row.product.nome};${row.qty};${row.product.precoCalculado};${row.product.precoPraticado};${row.discount}`,
      )
      .join("\n");
    const blob = new Blob([header + lines], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "simulacao-vendas.csv";
    link.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="simulation-page">
      <section className="simulation-banner">
        <div>
          <small>SIMULAÇÃO COMERCIAL</small>
          <h2>Compare preço calculado e praticado</h2>
          <p>
            O preço praticado vem da tabela comercial do estado selecionado.
            Informe apenas o desconto para simular o resultado real da venda.
          </p>
        </div>
        <label>
          Estado de destino
          <select value={state} onChange={(e) => setState(e.target.value)}>
            {salesStates.map(([uf, stateName]) => (
              <option key={uf} value={`${uf} — ${stateName}`}>
                {uf} — {stateName}
              </option>
            ))}
          </select>
        </label>
        <button onClick={exportExcel}>Exportar Excel</button>
      </section>
      <section className="card simulation-name">
        <label>
          Nome da simulação
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Mix mensal — Região Sul"
          />
        </label>
        <button onClick={newSimulation}>+ Nova simulação</button>
        <button className="simulation-primary" onClick={saveSimulation}>
          Salvar simulação
        </button>
        {saveNotice && (
          <span
            className={
              /^(Não|Inclua|Esta simulação não)/.test(saveNotice)
                ? "simulation-save-notice error"
                : "simulation-save-notice"
            }
          >
            {saveNotice}
          </span>
        )}
      </section>
      <section className="card saved-simulations">
        <div className="saved-head">
          <div>
            <small>SIMULAÇÕES SALVAS</small>
            <b>Histórico permanente de simulações</b>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar simulação salva..."
          />
        </div>
        {saved
          .filter((item) =>
            item.name.toLowerCase().includes(search.toLowerCase()),
          )
          .map((item) => {
            const expanded = expandedSavedId === item.id,
              calc = item.calculated,
              practiced = item.practiced,
              savedDifference =
                typeof item.difference === "number"
                  ? item.difference
                  : (practiced?.result || 0) - (calc?.result || 0),
              promo = item.promotion;
            return (
              <div className="saved-history-entry" key={item.id}>
                <div className="saved-row">
                  <span>
                    <b>{item.name}</b>
                    <small>
                      {item.state.slice(0, 2)} · {item.mix.length} produtos ·{" "}
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </small>
                  </span>
                  <div>
                    <button
                      data-native-action="true"
                      onClick={() => {
                        setExpandedSavedId(expanded ? null : item.id);
                        setShowDemonstrative(false);
                        setViewingSaved(false);
                        setViewedSnapshot(null);
                      }}
                    >
                      {expanded ? "Ocultar demonstrativo" : "Visualizar"}
                    </button>
                    <button
                      data-native-action="true"
                      onClick={() => {
                        setExpandedSavedId(null);
                        openSaved(item, true);
                      }}
                    >
                      Alterar
                    </button>
                    <button
                      data-native-action="true"
                      className="simulation-delete"
                      onClick={() => deleteSaved(item.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
                {expanded &&
                  (calc && practiced ? (
                    <div className="saved-inline-demonstrative">
                      <div className="saved-inline-title">
                        <small>DEMONSTRATIVO DA SIMULAÇÃO SALVA</small>
                        <h3>{item.name}</h3>
                        <span>
                          {item.state} ·{" "}
                          {new Date(item.createdAt).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <section className="simulation-metrics">
                        <Metric
                          label="FATURAMENTO PELO PREÇO CALCULADO"
                          value={money(calc.revenue)}
                          detail={`Margem calculada: ${pct(calc.revenue ? calc.result / calc.revenue : 0)}`}
                        />
                        <Metric
                          label="FATURAMENTO PELO PREÇO PRATICADO"
                          value={money(practiced.revenue)}
                          detail={`Margem praticada: ${pct(practiced.revenue ? practiced.result / practiced.revenue : 0)}`}
                        />
                        <Metric
                          label="RESULTADO PELO PREÇO CALCULADO"
                          value={money(calc.result)}
                          detail="Resultado salvo"
                        />
                        <Metric
                          label="IMPACTO NO RESULTADO"
                          value={money(savedDifference)}
                          detail="Ganho ou perda salvo"
                        />
                      </section>
                      <section className="simulation-results">
                        <SimulationResultCard kind="calculated" data={calc} />
                        <SimulationResultCard
                          kind="practiced"
                          data={practiced}
                        />
                      </section>
                      {promo && (
                        <SavedPromotionComparison
                          promo={promo}
                          includeGgf={item.includeGgfInCampaign ?? false}
                          bonusIcms={item.bonusIcmsPercent ?? 18}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="saved-inline-empty">
                      <b>
                        Este registro antigo não possui demonstrativo
                        armazenado.
                      </b>
                      <span>
                        Clique em Alterar, confira os produtos e salve novamente
                        para gerar o demonstrativo.
                      </span>
                    </div>
                  ))}
              </div>
            );
          })}
      </section>
      {mix.length > 0 && showDemonstrative && (
        <>
          <section ref={resultRef} className="simulation-viewing-note">
            <span>
              {viewingSaved ? "VISUALIZAÇÃO DO HISTÓRICO" : "SIMULAÇÃO ATUAL"}
            </span>
            <b>{name || "Simulação em andamento"}</b>
          </section>
          <section className="simulation-metrics">
            <Metric
              label="FATURAMENTO PELO PREÇO CALCULADO"
              value={money(displayedCalculated.revenue)}
              detail={`Margem calculada: ${pct(displayedCalculated.revenue ? displayedCalculated.result / displayedCalculated.revenue : 0)}`}
            />
            <Metric
              label="FATURAMENTO PELO PREÇO PRATICADO"
              value={money(displayedPracticed.revenue)}
              detail={`Margem praticada: ${pct(displayedPracticed.revenue ? displayedPracticed.result / displayedPracticed.revenue : 0)}`}
            />
            <Metric
              label="RESULTADO PELO PREÇO CALCULADO"
              value={money(displayedCalculated.result)}
              detail="Resultado esperado pelo sistema"
            />
            <Metric
              label="IMPACTO NO RESULTADO"
              value={money(displayedDifference)}
              detail="Ganho ou perda: preço praticado"
            />
          </section>
          <section className="simulation-results">
            <SimulationResultCard
              kind="calculated"
              data={displayedCalculated}
            />
            <SimulationResultCard kind="practiced" data={displayedPracticed} />
          </section>
          <section
            className={`simulation-opportunity ${displayedDifference >= 0 ? "positive" : "negative"}`}
          >
            <div>
              <small>
                {displayedDifference >= 0
                  ? "OPORTUNIDADE NO MIX"
                  : "ALERTA NO MIX"}
              </small>
              <b>
                {displayedDifference >= 0
                  ? "O preço praticado aumenta o resultado"
                  : "O preço praticado reduz o resultado"}
              </b>
              <span>
                Diferença entre o lucro pelo preço calculado e pelo preço
                praticado.
              </span>
            </div>
            <strong>{money(displayedDifference)}</strong>
          </section>
        </>
      )}
      {mix.length > 0 && showDemonstrative && (
        <section className="promotion-comparison">
          <div className="promotion-heading">
            <div>
              <small>COMPARATIVO COMERCIAL — RIO GRANDE DO SUL</small>
              <h2>Cálculos independentes: desconto × bonificação</h2>
              <p>
                Sobre as unidades bonificadas são considerados exclusivamente o
                custo de aquisição/fabricação e o ICMS do RS. O GGF dos produtos
                fabricados vendidos é sempre considerado nos dois cenários. A
                opção abaixo acrescenta GGF somente às unidades bonificadas.
              </p>
            </div>
            <div className="promotion-settings">
              <label>
                ICMS da bonificação no RS
                <div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bonusIcmsPercent}
                    onChange={(e) =>
                      setBonusIcmsPercent(
                        Math.max(0, Number(e.target.value) || 0),
                      )
                    }
                  />
                  <span>%</span>
                </div>
              </label>
              <label className="promotion-ggf-choice">
                <input
                  type="checkbox"
                  checked={includeGgfInCampaign}
                  onChange={(e) => setIncludeGgfInCampaign(e.target.checked)}
                />
                <span>Deseja incluir o GGF somente na bonificação?</span>
              </label>
            </div>
          </div>
          <div className="promotion-cards detailed">
            <article>
              <small>CENÁRIO 1 — DESCONTO NA NOTA</small>
              <h3>Memória do desconto</h3>
              <div className="promotion-lines">
                <p>
                  <span>Venda pelo preço normal</span>
                  <strong>{money(promotion.grossRevenue)}</strong>
                </p>
                <p>
                  <span>(−) Desconto concedido</span>
                  <MoneyWithRate
                    value={promotion.discountValue}
                    base={promotion.grossRevenue}
                  />
                </p>
                <p className="subtotal">
                  <span>Receita após desconto</span>
                  <strong>{money(promotion.discountRevenue)}</strong>
                </p>
                <p>
                  <span>(−) Custo dos itens vendidos</span>
                  <strong>{money(promotion.soldCost)}</strong>
                </p>
                <p>
                  <span>(−) Tributos</span>
                  <MoneyWithRate
                    value={promotion.discountTaxes}
                    base={promotion.discountRevenue}
                  />
                </p>
                <p>
                  <span>(−) Comissão</span>
                  <MoneyWithRate
                    value={promotion.discountCommission}
                    base={promotion.discountRevenue}
                  />
                </p>
                <p>
                  <span>(−) Frete</span>
                  <MoneyWithRate
                    value={promotion.discountFreight}
                    base={promotion.discountRevenue}
                  />
                </p>
                <p>
                  <span>(−) Verbas comerciais</span>
                  <MoneyWithRate
                    value={promotion.discountCommercial}
                    base={promotion.discountRevenue}
                  />
                </p>
                <p>
                  <span>(−) Despesas administrativas</span>
                  <MoneyWithRate
                    value={promotion.discountExpenses}
                    base={promotion.discountRevenue}
                  />
                </p>
                <p>
                  <span>(−) Inadimplência</span>
                  <MoneyWithRate
                    value={promotion.discountDefaultLoss}
                    base={promotion.discountRevenue}
                  />
                </p>
                <p>
                  <span>(−) GGF dos produtos fabricados</span>
                  <MoneyWithRate
                    value={promotion.discountGgf}
                    base={promotion.discountRevenue}
                  />
                </p>
                <p className="subtotal">
                  <span>Total dos encargos após desconto</span>
                  <MoneyWithRate
                    value={promotion.discountCharges}
                    base={promotion.discountRevenue}
                  />
                </p>
              </div>
              <b>{money(promotion.discountResult)}</b>
              <p>Resultado independente do cenário com desconto.</p>
            </article>
            <article>
              <small>CENÁRIO 2 — BONIFICAÇÃO</small>
              <h3>Memória da bonificação</h3>
              <div className="promotion-lines">
                <p>
                  <span>Venda normal faturada</span>
                  <strong>{money(promotion.grossRevenue)}</strong>
                </p>
                <p>
                  <span>(−) Custo dos itens vendidos</span>
                  <strong>{money(promotion.soldCost)}</strong>
                </p>
                <p>
                  <span>(−) Tributos da venda normal</span>
                  <MoneyWithRate
                    value={promotion.bonusTaxes}
                    base={promotion.grossRevenue}
                  />
                </p>
                <p>
                  <span>(−) Comissão</span>
                  <MoneyWithRate
                    value={promotion.bonusCommission}
                    base={promotion.grossRevenue}
                  />
                </p>
                <p>
                  <span>(−) Frete</span>
                  <MoneyWithRate
                    value={promotion.bonusFreight}
                    base={promotion.grossRevenue}
                  />
                </p>
                <p>
                  <span>(−) Verbas comerciais</span>
                  <MoneyWithRate
                    value={promotion.bonusCommercial}
                    base={promotion.grossRevenue}
                  />
                </p>
                <p>
                  <span>(−) Despesas administrativas</span>
                  <MoneyWithRate
                    value={promotion.bonusExpenses}
                    base={promotion.grossRevenue}
                  />
                </p>
                <p>
                  <span>(−) Inadimplência</span>
                  <MoneyWithRate
                    value={promotion.bonusDefaultLoss}
                    base={promotion.grossRevenue}
                  />
                </p>
                <p>
                  <span>(−) GGF dos produtos vendidos</span>
                  <MoneyWithRate
                    value={promotion.bonusGgf}
                    base={promotion.grossRevenue}
                  />
                </p>
                <p className="subtotal">
                  <span>Total dos encargos da venda normal</span>
                  <MoneyWithRate
                    value={promotion.bonusSaleCharges}
                    base={promotion.grossRevenue}
                  />
                </p>
                <p className="bonus-only">
                  <span>(−) Custo das unidades bonificadas</span>
                  <strong>{money(promotion.bonusCost)}</strong>
                </p>
                <p className="bonus-only">
                  <span>(−) Somente ICMS/RS da bonificação</span>
                  <MoneyWithRate
                    value={promotion.bonusIcms}
                    base={promotion.bonusIcmsBase}
                    rateValue={promotion.bonusIcmsBase ? bonusIcmsPercent : 0}
                  />
                </p>
                {includeGgfInCampaign && (
                  <p className="bonus-only">
                    <span>(−) GGF das unidades bonificadas</span>
                    <MoneyWithRate
                      value={promotion.bonusGiftGgf}
                      base={promotion.bonusGiftBase}
                    />
                  </p>
                )}
              </div>
              <b>{money(promotion.bonusResult)}</b>
              <p>
                Resultado = venda normal − custo vendido − encargos da venda com
                GGF dos vendidos − custo bonificado − ICMS da bonificação − GGF
                opcional das unidades bonificadas. Na parte bonificada não
                entram despesas administrativas nem outros impostos.
              </p>
            </article>
            <article
              className={promotion.advantage >= 0 ? "winner" : "warning"}
            >
              <small>ANÁLISE DA CAMPANHA</small>
              <h3>
                {promotion.advantage >= 0
                  ? "Bonificação mais vantajosa"
                  : "Desconto mais vantajoso"}
              </h3>
              <div className="promotion-lines campaign">
                <p>
                  <span>Quantidade vendida</span>
                  <strong>{decimal(promotion.soldQty)}</strong>
                </p>
                <p>
                  <span>Quantidade bonificada</span>
                  <strong>{decimal(promotion.bonusQty)}</strong>
                </p>
                <p>
                  <span>Preço econômico para o cliente</span>
                  <strong>{money(promotion.campaignUnitPrice)}</strong>
                </p>
                <p>
                  <span>Valor líquido por unidade vendida para a empresa</span>
                  <strong>{money(promotion.companyUnitNet)}</strong>
                </p>
                <p>
                  <span>Perda da empresa na bonificação</span>
                  <strong>{pct(promotion.companyLossRate)}</strong>
                </p>
                <p>
                  <span>Margem sobre o custo</span>
                  <strong>{pct(promotion.companyMargin)}</strong>
                </p>
              </div>
              <PromotionRecovery promo={promotion} />
              <b>{money(Math.abs(promotion.advantage))}</b>
              <p>Diferença entre os resultados dos dois cenários.</p>
            </article>
          </div>
        </section>
      )}
      <section className="simulation-product-picker">
        <div>
          <small>PRODUTOS DO MIX</small>
          <b>Todos os fabricados e de revenda</b>
          <span>{simulationProducts.length} itens disponíveis</span>
        </div>
        <input
          autoComplete="off"
          value={productSearch}
          onChange={(e) => {
            setProductSearch(e.target.value);
            setSelectedCode("__none__");
          }}
          placeholder="Pesquisar código, produto ou tipo..."
        />
        <select
          key={
            selectedCode === "__none__"
              ? "empty-product-selector"
              : "chosen-product-selector"
          }
          autoComplete="off"
          value={selectedCode}
          onChange={(e) => setSelectedCode(e.target.value)}
        >
          <option value="__none__">Nenhum produto selecionado</option>
          {filteredProducts.map((product) => (
            <option
              value={product.codigo}
              key={`${product.codigo}-${product.tipo}`}
            >
              {product.tipo === "IND" ? "FABRICADO" : "REVENDA"} ·{" "}
              {product.codigo} — {product.nome}
            </option>
          ))}
        </select>
        <button onClick={addProduct} disabled={selectedCode === "__none__"}>
          + Adicionar produto
        </button>
      </section>
      <section className="card simulation-table">
        <div className="simulation-table-scroll">
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd. vendida</th>
                <th>Preço calculado</th>
                <th>Preço praticado</th>
                <th>Desconto %</th>
                <th>Qtd. bonificada</th>
                <th>Preço líquido</th>
                <th>Diferença preço</th>
                <th>Resultado calculado</th>
                <th>Resultado praticado</th>
                <th>Impacto resultado</th>
                <th>Margem praticada</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {mix.map((row, index) => {
                const liquid =
                    row.product.precoPraticado * (1 - row.discount / 100),
                  calcResult =
                    (row.product.precoCalculado - row.product.custo) * row.qty,
                  practicedResult = (liquid - row.product.custo) * row.qty;
                return (
                  <tr key={`${row.product.codigo}-${index}`}>
                    <td>
                      <b>{row.product.codigo}</b>
                      <span>{row.product.nome}</span>
                    </td>
                    <td>
                      <input
                        type="number"
                        value={row.qty}
                        onChange={(e) =>
                          update(index, "qty", Number(e.target.value) || 0)
                        }
                      />
                    </td>
                    <td>{money(row.product.precoCalculado)}</td>
                    <td>{money(row.product.precoPraticado)}</td>
                    <td>
                      <input
                        type="number"
                        value={row.discount}
                        onChange={(e) =>
                          update(index, "discount", Number(e.target.value) || 0)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={row.bonus || 0}
                        onChange={(e) =>
                          update(index, "bonus", Number(e.target.value) || 0)
                        }
                      />
                    </td>
                    <td>{money(liquid)}</td>
                    <td>{money(liquid - row.product.precoCalculado)}</td>
                    <td>{money(calcResult)}</td>
                    <td>{money(practicedResult)}</td>
                    <td>{money(practicedResult - calcResult)}</td>
                    <td>
                      {pct(liquid ? practicedResult / (liquid * row.qty) : 0)}
                    </td>
                    <td>
                      <button
                        onClick={() =>
                          setMix((current) =>
                            current.filter((_, i) => i !== index),
                          )
                        }
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <th>TOTAL DO MIX</th>
                <td>{decimal(mix.reduce((sum, row) => sum + row.qty, 0))}</td>
                <td />
                <td />
                <td>{money(0)}</td>
                <td>
                  {decimal(mix.reduce((sum, row) => sum + (row.bonus || 0), 0))}
                </td>
                <td>{money(totals.practiced)}</td>
                <td>{money(totals.practiced - totals.calc)}</td>
                <td>{money(totals.resultCalc)}</td>
                <td>{money(totals.resultPracticed)}</td>
                <td>{money(totals.resultPracticed - totals.resultCalc)}</td>
                <td>
                  {pct(
                    totals.practiced
                      ? totals.resultPracticed / totals.practiced
                      : 0,
                  )}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        {mix.length === 0 && (
          <div className="simulation-empty">
            <b>Nenhum produto no mix</b>
            <span>
              Adicione produtos para comparar desconto na nota fiscal com
              bonificação em produtos.
            </span>
          </div>
        )}
      </section>
    </div>
  );
}
const copy: Record<
  string,
  {
    title: string;
    description: string;
    columns: string[];
  }
> = {
  "Fichas técnicas": {
    title: "Fichas técnicas de fabricação",
    description: "Composição de matérias-primas e embalagens por produto.",
    columns: [
      "Produto",
      "Componente",
      "Quantidade",
      "Custo unitário",
      "Custo total",
    ],
  },
  "Matérias-primas": {
    title: "Matérias-primas",
    description: "Cadastro e histórico dos custos de insumos.",
    columns: ["Código", "Descrição", "Unidade", "Custo atual", "Atualização"],
  },
  Embalagens: {
    title: "Embalagens",
    description: "Itens de embalagem incorporados às fichas técnicas.",
    columns: ["Código", "Descrição", "Fornecedor", "Custo", "Tributos"],
  },
  "Compras para revenda": {
    title: "Compras para revenda",
    description: "Custos de aquisição e créditos recuperáveis.",
    columns: [
      "Produto",
      "Fornecedor",
      "Custo bruto",
      "Créditos",
      "Custo líquido",
    ],
  },
  "Preços dos serviços": {
    title: "Preços dos serviços",
    description: "Formação de preço para horas e serviços prestados.",
    columns: ["Serviço", "Horas", "Custo/hora", "Tributos", "Preço"],
  },
  "Simulação de vendas": {
    title: "Simulação de vendas",
    description: "Compare preço, volume, receita e margem antes de decidir.",
    columns: ["Produto", "Quantidade", "Preço", "Receita", "Lucro"],
  },
  "Painel de tributos": {
    title: "Painel de tributos",
    description: "Alíquotas que participam da formação do preço.",
    columns: ["Tributo", "Regime", "Base", "Alíquota", "Impacto"],
  },
  "Reforma tributária": {
    title: "Reforma tributária",
    description: "Cenários de IBS e CBS lado a lado com a regra atual.",
    columns: ["Cenário", "CBS", "IBS", "Créditos", "Preço calculado"],
  },
  "GGF e despesas": {
    title: "GGF e despesas",
    description: "Rateios de gastos gerais e despesas administrativas.",
    columns: [
      "Grupo",
      "Valor mensal",
      "Base de rateio",
      "Percentual",
      "Custo unitário",
    ],
  },
  "Tabelas comerciais": {
    title: "Tabelas comerciais",
    description: "Preços por estado, política comercial e descontos.",
    columns: ["Produto", "RS", "SC", "PR", "Política"],
  },
  "Gráficos de análises": {
    title: "Gráficos de análises",
    description: "Leituras gerenciais de custos, preços e rentabilidade.",
    columns: ["Indicador", "Período", "Fabricados", "Revenda", "Consolidado"],
  },
  Relatórios: {
    title: "Relatórios",
    description: "Relatórios operacionais e gerenciais para conferência.",
    columns: ["Relatório", "Escopo", "Atualização", "Formato", "Ação"],
  },
};
function GenericTab({ name }: { name: string }) {
  const c = copy[name],
    sample = products.slice(0, 8);
  return (
    <section className="card table-card">
      <div className="toolbar">
        <div className="single-search">
          <Search size={18} />
          <input placeholder={`Pesquisar em ${name.toLowerCase()}`} />
        </div>
        <button>Novo registro</button>
      </div>
      <div className="card-title">
        <div>
          <small>BASE DE CÁLCULO</small>
          <h2>{c.title}</h2>
          <p>{c.description}</p>
        </div>
        <span>Dados recuperados da planilha</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {c.columns.map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sample.map((p, i) => (
              <tr key={i}>
                {c.columns.map((_, j) => (
                  <td key={j}>
                    {j === 0 ? (
                      <>
                        <b>{p.codigo}</b>
                        <span>{p.nome}</span>
                      </>
                    ) : j === c.columns.length - 1 ? (
                      <button className="link-button">Editar</button>
                    ) : j % 2 ? (
                      money(p.custo)
                    ) : (
                      pct(Math.max(0, p.margem))
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
export default function Home() {
  const [active, setActive] = useState("Painel"),
    [menu, setMenu] = useState(false),
    [insideCompany, setInsideCompany] = useState(false),
    [activeRates] = useDurableState<ActiveGgfRates>(
      "active-ggf-parameters-v1",
      { ggf: 16.16, admin: 20, date: "2026-08-01" },
    ),
    [displayDecimals] = useDurableState<number>(DISPLAY_DECIMALS_KEY, 2),
    [productOverrides] = useDurableState<Record<string, ProductOverride>>(
      "product-master-overrides-v1",
      {},
    ),
    [resaleTaxRows] = useDurableState<ResaleTaxRow[]>("catalog-resale-v2", []),
    [taxRegime] = useDurableState<TaxRegime>(TAX_REGIME_KEY, "Lucro Presumido"),
    [taxRegimeDefaults] = useDurableState<ProductTaxConfig>(
      TAX_REGIME_DEFAULTS_KEY,
      DEFAULT_TAX_REGIME_RATES,
    ),
    [productTaxConfigs] = useDurableState<Record<string, ProductTaxConfig>>(
      PRODUCT_TAX_CONFIG_KEY,
      {},
    ),
    [technicalCosts] = useDurableState<Record<string, number>>(
      TECHNICAL_COSTS_KEY,
      {},
    );
  useEffect(() => {
    const companyId = new URLSearchParams(location.search).get("empresa");
    if (!companyId) return;
    localStorage.setItem("pricing-active-company", companyId);
    setInsideCompany(true);
  }, []);
  setDisplayDigits(displayDecimals);
  products = useMemo(() => {
    const resaleByCode = new Map(
      resaleTaxRows.map((row) => [row.code.toUpperCase(), row]),
    );
    return baseProducts.map((product) => {
      const code = String(product.codigo).toUpperCase(),
        override = productOverrides[code],
        resale = resaleByCode.get(code),
        sheetCost =
          product.tipo === "IND"
            ? (technicalCosts[code] ??
              initialTechnicalCost(product.codigo, product.nome))
            : undefined,
        costed =
          sheetCost !== undefined ? { ...product, custo: sheetCost } : product,
        treated = withTaxTreatment(costed, {
          monophase:
            product.tipo === "IND"
              ? override?.monophase === true
              : resale?.pisTreatment === "Monofásico",
          st:
            product.tipo === "IND"
              ? override?.st === true
              : resale?.icmsTreatment === "ICMS ST",
        });
      const taxed = applyTaxRegime(
        treated,
        taxRegime,
        productTaxConfigs[code] || taxRegimeDefaults,
      );
      return withActiveGgfRates(taxed, activeRates) as Product;
    });
  }, [
    activeRates,
    productOverrides,
    resaleTaxRows,
    taxRegime,
    taxRegimeDefaults,
    productTaxConfigs,
    technicalCosts,
  ]);
  const rateVersion = `${activeRates.appliedAt || activeRates.rateRecordId || activeRates.date || "base"}-${taxRegime}-${JSON.stringify(taxRegimeDefaults)}-${JSON.stringify(productTaxConfigs)}-${JSON.stringify(technicalCosts)}`,
    catalogTabs = ["Matérias-primas", "Embalagens", "Compras para revenda"];
  if (!insideCompany) {
    return <AdminPortal />;
  }
  return (
    <div className="app-shell">
      <ActionBridge onNavigate={setActive} />
      <Sidebar
        active={active}
        setActive={setActive}
        open={menu}
        close={() => setMenu(false)}
        leaveCompany={() => {
          setMenu(false);
          setInsideCompany(false);
          history.replaceState(null, "", "/");
        }}
      />
      {menu && <button className="backdrop" onClick={() => setMenu(false)} />}
      <main className="content">
        <Header
          active={active}
          onMenu={() => setMenu(true)}
          onNavigate={setActive}
        />
        {active === "Painel" ? (
          <DashboardInsights
            key={`${rateVersion}-${displayDecimals}`}
            products={products}
          />
        ) : active === "Produtos" ? (
          <ProductsScreen onNavigate={setActive} />
        ) : active === "Fichas técnicas" ? (
          <TechnicalSheets />
        ) : catalogTabs.includes(active) ? (
          <CatalogScreen
            kind={
              active as
                "Matérias-primas" | "Embalagens" | "Compras para revenda"
            }
            products={products}
          />
        ) : active === "Preços dos serviços" ? (
          <ServicePricing />
        ) : active === "Simulação de vendas" ? (
          <SalesSimulation key={`${rateVersion}-${displayDecimals}`} />
        ) : active === "Painel de tributos" ? (
          <TaxPanel />
        ) : active === "Reforma tributária" ? (
          <TaxReform key={`${rateVersion}-${displayDecimals}`} />
        ) : active === "GGF e despesas" ? (
          <ExpenseHistory />
        ) : active === "Formação do preço" ? (
          <PriceSimulator
            key={`${rateVersion}-${displayDecimals}`}
            products={products}
          />
        ) : active === "Tabelas comerciais" ? (
          <CommercialTable
            key={`${rateVersion}-${displayDecimals}`}
            products={products}
          />
        ) : active === "Gráficos de análises" ? (
          <AnalysisCharts
            key={`${rateVersion}-${displayDecimals}`}
            products={products}
          />
        ) : active === "Relatórios" ? (
          <Reports
            key={`${rateVersion}-${displayDecimals}`}
            products={products}
          />
        ) : (
          <GenericTab name={active} />
        )}
      </main>
    </div>
  );
}
