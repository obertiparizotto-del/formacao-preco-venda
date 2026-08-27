"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, PackagePlus, Trash2 } from "lucide-react";
import workbook from "./data/technical-sheets.json";
import catalogData from "./data/catalogs.json";
import { saveDurableValue, useDurableState } from "./use-durable-state";
import { TECHNICAL_COSTS_KEY } from "./technical-costs";
import { isPrimaryCompany } from "./tenant";

type ExcelItem = {
  description: string;
  qty: number;
  unit: string;
  cost: number;
  ipi: number;
  pisCofins: number;
  icms: number;
  freight: number;
  multiplier: number;
  final: number;
};
type ExcelSheet = {
  code: string;
  name: string;
  unit: string;
  factor: number;
  total: number;
  items: ExcelItem[];
};
type CatalogItem = {
  code: string;
  name: string;
  unit: string;
  cost: number;
  ipi?: number;
  pisCofins?: number;
  icms?: number;
  freight?: number;
};
type SheetRow = ExcelItem & {
  code: string;
  type: "Matéria-prima" | "Embalagem";
};
const primarySource = workbook as {
  products: ExcelSheet[];
  packages: ExcelSheet[];
};
const primaryCatalogs = catalogData as {
  materials: CatalogItem[];
  packages: CatalogItem[];
};
const money = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  });
const number = (value: number) =>
  value.toLocaleString("pt-BR", { maximumFractionDigits: 8 });
const rowType = (description: string): SheetRow["type"] =>
  /embalagem|frasco|tampa|rótulo|rotulo|fardo|caixa|inkjet|válvula|valvula|filme/i.test(
    description,
  )
    ? "Embalagem"
    : "Matéria-prima";
const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
const findCatalog = (
  description: string,
  catalog: CatalogItem[],
  cost: number,
) => {
  const needle = normalize(description),
    exact = catalog.find((item) => normalize(item.name) === needle);
  if (exact) return exact;
  const candidates = catalog.filter(
    (item) =>
      normalize(item.name).includes(needle) ||
      needle.includes(normalize(item.name)),
  );
  return (
    [...candidates].sort(
      (a, b) => Math.abs(a.cost - cost) - Math.abs(b.cost - cost),
    )[0] || catalog.find((item) => Math.abs(item.cost - cost) < 0.0001)
  );
};
const mapped = (
  sheet: ExcelSheet,
  materials: CatalogItem[],
  packages: CatalogItem[],
) =>
  sheet.items.map((item) => {
    const type = rowType(item.description),
      match = findCatalog(
        item.description,
        type === "Matéria-prima" ? materials : packages,
        item.cost,
      );
    return { ...item, type, code: match?.code || "" };
  });
const finalCost = (row: SheetRow) =>
  row.qty *
  (row.cost -
    row.cost * row.ipi -
    row.cost * row.pisCofins -
    row.cost * row.icms +
    row.freight);

export default function TechnicalSheets() {
  const [customProducts] = useDurableState<
    Array<{ codigo: string | number; nome: string }>
  >("product-custom-fabricated-v1", []);
  const source = useMemo<{
    products: ExcelSheet[];
    packages: ExcelSheet[];
  }>(() => {
    if (isPrimaryCompany()) return primarySource;
    const products = customProducts.map((product) => ({
      code: String(product.codigo),
      name: product.nome,
      unit: "UN",
      factor: 1,
      total: 0,
      items: [],
    }));
    const packages = customProducts.map((product) => ({
      code: String(product.codigo),
      name: `EMBALAGEM COMPOSTA - ${product.nome}`,
      unit: "UN",
      factor: 1,
      total: 0,
      items: [],
    }));
    return { products, packages };
  }, [customProducts]);
  if (!source.products.length)
    return (
      <section className="card technical-card">
        <div className="technical-top">
          <div>
            <small>NOVA EMPRESA</small>
            <h2>Cadastre um produto fabricado</h2>
            <p>
              As matérias-primas e embalagens já ficam disponíveis para
              composição. Cadastre ao menos um produto fabricado para criar sua
              ficha técnica.
            </p>
          </div>
        </div>
      </section>
    );
  return <TechnicalSheetsContent source={source} />;
}
function TechnicalSheetsContent({
  source,
}: {
  source: { products: ExcelSheet[]; packages: ExcelSheet[] };
}) {
  const [tab, setTab] = useState<"product" | "package">("product");
  const [productCode, setProductCode] = useState(
    source.products[0]?.code || "871",
  );
  const [materials] = useDurableState<CatalogItem[]>(
    "catalog-raw-materials-v2",
    isPrimaryCompany() ? primaryCatalogs.materials : [],
  );
  const [packages] = useDurableState<CatalogItem[]>(
    "catalog-packaging-v2",
    isPrimaryCompany() ? primaryCatalogs.packages : [],
  );
  const selectedProduct =
    source.products.find((x) => x.code === productCode) || source.products[0];
  const linkedPackage =
    source.packages.find(
      (x) => normalize(x.name) === normalize(selectedProduct.name),
    ) ||
    source.packages.find((x) => x.code === selectedProduct.code) ||
    source.packages[0];
  const selected = tab === "product" ? selectedProduct : linkedPackage;
  const packageSheetCode = `MP-FIC-${String(Math.max(1, source.packages.indexOf(linkedPackage) + 1)).padStart(3, "0")}`;
  const nextPackageSheetCode = `MP-FIC-${String(source.packages.length + 1).padStart(3, "0")}`;
  const packageSheetsCatalog = useMemo<CatalogItem[]>(
    () =>
      source.packages.map((sheet, index) => ({
        code: `MP-FIC-${String(index + 1).padStart(3, "0")}`,
        name: sheet.name,
        unit: sheet.unit || "UN",
        cost: sheet.total,
        ipi: 0,
        pisCofins: 0,
        icms: 0,
        freight: 0,
      })),
    [],
  );
  const storageKey = `technical-excel-v2-${tab}-${tab === "package" ? packageSheetCode : selected.code}`;
  const [rows, setRows, saveRows, saving] = useDurableState<SheetRow[]>(
    storageKey,
    mapped(selected, materials, packages),
  );
  const [loss, setLoss, saveLoss] = useDurableState<number>(
    `technical-loss-v3-${selectedProduct.code}`,
    3,
  );
  const [technicalCosts, setTechnicalCosts] = useDurableState<
    Record<string, number>
  >(TECHNICAL_COSTS_KEY, {});
  const [saved, setSaved] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [pendingType, setPendingType] = useState<SheetRow["type"] | null>(null),
    [pendingSearch, setPendingSearch] = useState(""),
    [pendingCode, setPendingCode] = useState(""),
    [pendingQty, setPendingQty] = useState(1),
    [pendingMessage, setPendingMessage] = useState("");
  useEffect(() => setSaved(false), [storageKey]);
  useEffect(() => {
    setRows((current) => {
      let changed = false;
      const repaired = current.map((row) => {
        let next =
          tab === "package" && row.type !== "Embalagem"
            ? ((changed = true), { ...row, type: "Embalagem" as const })
            : row;
        if (
          tab === "product" &&
          next.type === "Embalagem" &&
          !next.code.startsWith("MP-FIC-")
        ) {
          changed = true;
          return {
            ...next,
            code: packageSheetCode,
            description: linkedPackage.name,
            unit: linkedPackage.unit || "UN",
            cost: linkedPackage.total,
            ipi: 0,
            pisCofins: 0,
            icms: 0,
            freight: 0,
          };
        }
        if (next.code || !next.description.trim()) return next;
        const match = findCatalog(
          next.description,
          tab === "package" ? packages : catalogFor(next),
          next.cost,
        );
        if (!match) return next;
        changed = true;
        return {
          ...next,
          code: match.code,
          description: match.name,
          unit: match.unit,
          cost: match.cost,
        };
      });
      return changed ? repaired : current;
    });
  }, [rows, materials, packages, tab, packageSheetCode]);
  const total = useMemo(
    () => rows.reduce((sum, row) => sum + finalCost(row), 0),
    [rows],
  );
  const add = (type: SheetRow["type"]) => {
    setPendingType(type);
    setPendingSearch("");
    setPendingCode("");
    setPendingQty(1);
    setPendingMessage("");
  };
  const update = (
    index: number,
    field: keyof SheetRow,
    value: string | number,
  ) =>
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  const catalogFor = (row: SheetRow) =>
    tab === "package"
      ? packages
      : row.type === "Embalagem"
        ? packageSheetsCatalog
        : materials;
  const selectCatalog = (index: number, value: string, by: "code" | "name") => {
    const row = rows[index],
      catalog = catalogFor(row),
      match = catalog.find((item) =>
        by === "code"
          ? item.code.toLowerCase() === value.trim().toLowerCase()
          : normalize(item.name) === normalize(value),
      );
    if (!match) return;
    setRows((current) =>
      current.map((item, i) =>
        i === index
          ? {
              ...item,
              code: match.code,
              description: match.name,
              unit: match.unit,
              cost: match.cost,
              ipi: match.ipi ?? item.ipi,
              pisCofins: match.pisCofins ?? item.pisCofins,
              icms: match.icms ?? item.icms,
              freight: match.freight ?? item.freight,
            }
          : item,
      ),
    );
  };
  const saveComponent = async (index: number) => {
    if (!rows[index]?.code) return;
    const ok = await saveRows();
    setSaved(ok);
    if (ok) setEditingIndex(null);
  };
  const pendingCatalog =
    pendingType === "Matéria-prima"
      ? materials
      : tab === "package"
        ? packages
        : packageSheetsCatalog;
  const pendingOptions = pendingCatalog
    .filter((item) =>
      `${item.code} ${item.name}`
        .toLowerCase()
        .includes(pendingSearch.toLowerCase()),
    )
    .slice(0, 80);
  const pendingSelected = pendingCatalog.find(
    (item) => item.code === pendingCode,
  );
  const addSelectedComponent = () => {
    const match = pendingCatalog.find((item) => item.code === pendingCode);
    if (!match) {
      setPendingMessage("Selecione um componente da lista.");
      return;
    }
    const newRow: SheetRow = {
      code: match.code,
      type: pendingType || "Embalagem",
      description: match.name,
      qty: pendingQty,
      unit: match.unit,
      cost: match.cost,
      ipi: match.ipi || 0,
      pisCofins: match.pisCofins || 0,
      icms: match.icms || 0,
      freight: match.freight || 0,
      multiplier: selected.factor,
      final: 0,
    };
    setEditingIndex(rows.length);
    setRows((current) => [...current, newRow]);
    setPendingSearch("");
    setPendingCode("");
    setPendingQty(1);
    setPendingMessage(
      "Componente incluído. Você pode incluir outro ou salvar a ficha.",
    );
  };
  const save = async () => {
    const rowsOk = await saveRows(),
      lossOk = tab === "product" ? await saveLoss() : true;
    let costOk = true;
    if (tab === "product") {
      const next = {
        ...technicalCosts,
        [selectedProduct.code]: total * (1 + Math.max(0, loss) / 100),
      };
      setTechnicalCosts(next);
      costOk = await saveDurableValue(TECHNICAL_COSTS_KEY, next);
    }
    const ok = rowsOk && lossOk && costOk;
    setSaved(ok);
    if (ok) setTimeout(() => setSaved(false), 1600);
  };
  const changeTab = (next: "product" | "package") => setTab(next);
  return (
    <section className="technical-card card">
      <div className="technical-top">
        <div>
          <small>
            {source.products.length} FICHAS DE PRODUTOS ·{" "}
            {source.packages.length} FICHAS DE EMBALAGENS
          </small>
          <h2>
            Estruturas de produtos e<br />
            embalagens
          </h2>
        </div>
        <div className="sheet-new-actions">
          <button onClick={() => changeTab("product")}>Ficha de produto</button>
          <button onClick={() => changeTab("package")}>
            Ficha de embalagem
          </button>
        </div>
        <div className="sheet-picker">
          <input
            placeholder="Busque pelo seletor ao lado"
            disabled={tab === "package"}
          />
          <select
            value={tab === "product" ? productCode : packageSheetCode}
            disabled={tab === "package"}
            onChange={(e) => setProductCode(e.target.value)}
          >
            {tab === "product" ? (
              source.products.map((item, i) => (
                <option key={`${item.code}-${i}`} value={item.code}>
                  {item.code} — {item.name}
                </option>
              ))
            ) : (
              <option value={packageSheetCode}>
                {packageSheetCode} — {linkedPackage.name}
              </option>
            )}
          </select>
          {tab === "package" && (
            <small className="linked-sheet-note">
              Ficha vinculada automaticamente ao produto {selectedProduct.code}.
              Próximo código sugerido: {nextPackageSheetCode}
            </small>
          )}
        </div>
      </div>
      <div className="steps">
        <button
          className={tab === "product" ? "selected" : ""}
          onClick={() => changeTab("product")}
        >
          <b>1</b>
          <span>
            Estrutura do produto
            <small>Composição original da aba FICHA TÉCNICA</small>
          </span>
        </button>
        <i>→</i>
        <button
          className={tab === "package" ? "selected" : ""}
          onClick={() => changeTab("package")}
        >
          <b>2</b>
          <span>
            Ficha da embalagem
            <small>Composição original da aba FICHA TÉCNICA EMBALAGENS</small>
          </span>
        </button>
      </div>
      <div className="sheet-summary">
        <article>
          <small>
            {tab === "product"
              ? "CÓDIGO DO PRODUTO"
              : "CÓDIGO PRÓPRIO DA FICHA"}
          </small>
          <b>{tab === "product" ? selected.code : packageSheetCode}</b>
          <span>{selected.name}</span>
        </article>
        <article>
          <small>TIPO DE FICHA</small>
          <b>
            {tab === "product" ? "Produto fabricado" : "Embalagem composta"}
          </b>
          <span>
            {tab === "package"
              ? `Vinculada ao produto ${selectedProduct.code}`
              : `Unidade: ${selected.unit} · fator: ${number(selected.factor)}`}
          </span>
        </article>
        <article>
          <small>CUSTO TOTAL DA FICHA</small>
          <b>
            {money(
              tab === "product" ? total * (1 + Math.max(0, loss) / 100) : total,
            )}
          </b>
          <span>
            {tab === "product"
              ? `Componentes + ${number(loss)}% de perda`
              : `${rows.length} componentes vinculados`}
          </span>
        </article>
      </div>
      <div className="sheet-controls">
        <p>
          Fórmula de cada linha: quantidade × (valor unitário − IPI − PIS/Cofins
          − ICMS + frete unitário). A perda é aplicada somente após a soma das
          linhas.
        </p>
        {tab === "product" && (
          <label className="loss-field">
            Perda{" "}
            <span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={loss}
                onChange={(e) => setLoss(Number(e.target.value))}
              />
              <b>%</b>
            </span>
          </label>
        )}
        {tab === "product" && (
          <button
            className="outline-action"
            onClick={() => add("Matéria-prima")}
          >
            <PackagePlus size={15} /> Matéria-prima
          </button>
        )}
        <button className="outline-action" onClick={() => add("Embalagem")}>
          <PackagePlus size={15} /> Embalagem
        </button>
        <button className="save-action" disabled={saving} onClick={save}>
          {saved ? (
            <>
              <Check size={15} />
              Salvo
            </>
          ) : saving ? (
            "Salvando..."
          ) : (
            "Salvar alterações"
          )}
        </button>
      </div>
      {pendingType && (
        <div className="component-adder">
          <div className="component-adder-title">
            <div>
              <small>INCLUIR {pendingType.toUpperCase()}</small>
              <b>
                Informe ou selecione o código; a descrição será preenchida
                automaticamente
              </b>
            </div>
            <button onClick={() => setPendingType(null)}>×</button>
          </div>
          <div className="component-adder-fields code-only-adder">
            <label>
              Código sugerido ou informado
              <input
                list="pending-code-options"
                value={pendingSearch}
                onChange={(e) => {
                  const value = e.target.value.toUpperCase();
                  setPendingSearch(value);
                  const match = pendingCatalog.find(
                    (item) => item.code.toUpperCase() === value.trim(),
                  );
                  setPendingCode(match?.code || "");
                  setPendingMessage(
                    match ? "Código localizado no cadastro." : "",
                  );
                }}
                placeholder="Digite ou selecione o código..."
              />
              <small>O código pode ser substituído antes da inclusão.</small>
            </label>
            <datalist id="pending-code-options">
              {pendingOptions.map((item) => (
                <option key={item.code} value={item.code} />
              ))}
            </datalist>
            <label className="pending-description">
              Descrição complementar
              <input
                value={pendingSelected?.name || ""}
                readOnly
                placeholder="Preenchida após selecionar o código"
              />
            </label>
            <label>
              Quantidade
              <input
                className="quantity-editable"
                type="number"
                min="0"
                step="0.0001"
                value={pendingQty}
                onChange={(e) => setPendingQty(Number(e.target.value))}
              />
            </label>
            <button className="save-action" onClick={addSelectedComponent}>
              <PackagePlus size={15} /> Adicionar componente
            </button>
          </div>
          {pendingMessage && (
            <p className="component-adder-message">{pendingMessage}</p>
          )}
        </div>
      )}
      <datalist id="material-code-options">
        {materials.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </datalist>
      <datalist id="material-name-options">
        {materials.map((item) => (
          <option key={item.code} value={item.name}>
            {item.code}
          </option>
        ))}
      </datalist>
      <datalist id="package-code-options">
        {packages.map((item) => (
          <option key={item.code} value={item.code}>
            {item.name}
          </option>
        ))}
      </datalist>
      <datalist id="package-name-options">
        {packages.map((item) => (
          <option key={item.code} value={item.name}>
            {item.code}
          </option>
        ))}
      </datalist>
      <div className="technical-table">
        <table>
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Código</th>
              <th>Descrição vinculada</th>
              <th>Quantidade</th>
              <th>Unidade</th>
              <th>Custo compra</th>
              <th>IPI</th>
              <th>PIS/Cofins</th>
              <th>ICMS</th>
              <th>Frete</th>
              <th>Custo final</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const isEditing = editingIndex === index,
                catalog = catalogFor(row),
                currentMissing = !catalog.some(
                  (item) => item.code === row.code,
                );
              return (
                <tr
                  className={isEditing ? "component-editing" : ""}
                  key={`${row.description}-${index}`}
                >
                  <td>
                    <select value={row.type} disabled>
                      <option>Matéria-prima</option>
                      <option>Embalagem</option>
                    </select>
                  </td>
                  <td>
                    {isEditing ? (
                      <select
                        className="component-picker"
                        aria-label="Trocar componente pelo código"
                        value={row.code}
                        onChange={(e) =>
                          selectCatalog(index, e.target.value, "code")
                        }
                      >
                        <option value="">Selecione...</option>
                        {currentMissing && row.code && (
                          <option value={row.code}>
                            {row.code} — {row.description}
                          </option>
                        )}
                        {catalog.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.code} — {item.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input value={row.code} readOnly />
                    )}
                  </td>
                  <td>
                    {isEditing ? (
                      <select
                        className="component-picker description-picker"
                        aria-label="Trocar componente pela descrição"
                        value={row.description}
                        onChange={(e) =>
                          selectCatalog(index, e.target.value, "name")
                        }
                      >
                        <option value="">Selecione...</option>
                        {currentMissing && row.description && (
                          <option value={row.description}>
                            {row.description} — {row.code}
                          </option>
                        )}
                        {catalog.map((item) => (
                          <option key={item.code} value={item.name}>
                            {item.name} — {item.code}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input value={row.description} readOnly />
                    )}
                  </td>
                  <td>
                    <input
                      className={isEditing ? "quantity-editable" : ""}
                      type="number"
                      step="0.0001"
                      value={row.qty}
                      readOnly={!isEditing}
                      onChange={(e) =>
                        update(index, "qty", Number(e.target.value))
                      }
                    />
                  </td>
                  <td>
                    <input value={row.unit} readOnly />
                  </td>
                  <td>
                    <input value={number(row.cost)} readOnly />
                  </td>
                  <td>
                    <div className="sheet-input readonly percent-readonly">
                      <input value={number(row.ipi * 100)} readOnly />
                      <span>%</span>
                    </div>
                  </td>
                  <td>
                    <div className="sheet-input readonly percent-readonly">
                      <input value={number(row.pisCofins * 100)} readOnly />
                      <span>%</span>
                    </div>
                  </td>
                  <td>
                    <div className="sheet-input readonly percent-readonly">
                      <input value={number(row.icms * 100)} readOnly />
                      <span>%</span>
                    </div>
                  </td>
                  <td>
                    <input value={number(row.freight)} readOnly />
                  </td>
                  <td>
                    <strong>{money(finalCost(row))}</strong>
                  </td>
                  <td>
                    <div className="component-actions">
                      {isEditing ? (
                        <button
                          className="save-component"
                          disabled={!row.code}
                          onClick={() => saveComponent(index)}
                        >
                          Salvar
                        </button>
                      ) : (
                        <button
                          className="edit-component"
                          onClick={() => setEditingIndex(index)}
                        >
                          Alterar
                        </button>
                      )}
                      <button
                        className="delete-row"
                        title="Excluir componente"
                        onClick={() => {
                          setRows((current) =>
                            current.filter((_, i) => i !== index),
                          );
                          setEditingIndex(null);
                        }}
                      >
                        <Trash2 size={14} /> Excluir
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <th colSpan={10}>TOTAL RECALCULADO</th>
              <td colSpan={2}>{money(total)}</td>
            </tr>
            {tab === "product" && (
              <tr>
                <th colSpan={10}>
                  TOTAL COM {number(loss)}% DE PERDA DE PROCESSO
                </th>
                <td colSpan={2}>{money(total * (1 + loss / 100))}</td>
              </tr>
            )}
          </tfoot>
        </table>
      </div>
    </section>
  );
}
