"use client";

import { useMemo, useState } from "react";
import {
  Building2,
  KeyRound,
  Plus,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { saveDurableValue, useDurableState } from "./use-durable-state";

type Company = {
  id: string;
  code: string;
  name: string;
  cnpj: string;
  active: boolean;
};
type User = {
  id: string;
  name: string;
  login: string;
  password: string;
  role: "Administrador" | "Usuário da empresa";
  companyIds: string[];
  active: boolean;
};
const initialCompanies: Company[] = [
  {
    id: "santo-brilho",
    code: "400",
    name: "SANTO BRILHO",
    cnpj: "",
    active: true,
  },
];
async function passwordHash(value: string) {
  const bytes = new TextEncoder().encode(value),
    digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export default function AdminPortal() {
  const [companies, setCompanies] = useDurableState<Company[]>(
      "system-companies-v1",
      initialCompanies,
    ),
    [users, setUsers] = useDurableState<User[]>("system-users-v1", []),
    [tab, setTab] = useState<"companies" | "users">("companies"),
    [message, setMessage] = useState("");
  const [companyDraft, setCompanyDraft] = useState({
      code: "",
      name: "",
      cnpj: "",
    }),
    [userDraft, setUserDraft] = useState({
      name: "",
      login: "",
      password: "",
      role: "Usuário da empresa" as User["role"],
      companyId: "santo-brilho",
    });
  const toast = (text: string) => {
    setMessage(text);
    setTimeout(() => setMessage(""), 2200);
  };
  const addCompany = async () => {
    if (!companyDraft.code.trim() || !companyDraft.name.trim())
      return toast("Informe o código e a razão social.");
    const next = [
      ...companies,
      {
        id: `company-${Date.now()}`,
        code: companyDraft.code.trim(),
        name: companyDraft.name.trim().toUpperCase(),
        cnpj: companyDraft.cnpj.trim(),
        active: true,
      },
    ];
    setCompanies(next);
    await saveDurableValue("system-companies-v1", next);
    setCompanyDraft({ code: "", name: "", cnpj: "" });
    toast("Empresa incluída e liberada para vinculação.");
  };
  const addUser = async () => {
    if (
      !userDraft.name.trim() ||
      !userDraft.login.trim() ||
      userDraft.password.length < 6
    )
      return toast("Informe nome, login e senha com pelo menos 6 caracteres.");
    const password = await passwordHash(userDraft.password),
      next = [
        ...users,
        {
          id: `user-${Date.now()}`,
          name: userDraft.name.trim(),
          login: userDraft.login.trim().toLowerCase(),
          password,
          role: userDraft.role,
          companyIds:
            userDraft.role === "Administrador"
              ? companies.map((c) => c.id)
              : [userDraft.companyId],
          active: true,
        },
      ];
    setUsers(next);
    await saveDurableValue("system-users-v1", next);
    setUserDraft({ ...userDraft, name: "", login: "", password: "" });
    toast("Usuário criado com acesso restrito às empresas selecionadas.");
  };
  const selectCompany = (company: Company) => {
    localStorage.setItem("pricing-active-company", company.id);
    localStorage.setItem(
      "pricing-active-company-label",
      `${company.code} — ${company.name}`,
    );
    location.assign(`/?empresa=${encodeURIComponent(company.id)}`);
  };
  return (
    <div className="admin-portal">
      {message && <div className="settings-toast">{message}</div>}
      <header className="portal-header">
        <div className="portal-brand">
          <div className="brand-mark">P</div>
          <div>
            <strong>Parsecon</strong>
            <span>Portal de precificação</span>
          </div>
        </div>
        <div className="portal-account">
          <span>Oberti Parizotto · Administrador geral</span>
          <a href="/signout-with-chatgpt?return_to=/">Encerrar sessão</a>
        </div>
      </header>
      <main className="portal-content">
        <section className="settings-intro">
          <div>
            <small>ÁREA ADMINISTRATIVA</small>
            <h1>Selecione a empresa para continuar</h1>
            <p>
              Cadastros de empresas, usuários e permissões ficam separados do
              ambiente operacional. Ao entrar, serão carregados somente os dados
              da empresa escolhida.
            </p>
          </div>
          <ShieldCheck size={42} />
        </section>
        <section className="portal-company-grid">
          {companies
            .filter((company) => company.active)
            .map((company) => (
              <article key={company.id}>
                <div className="portal-company-icon">
                  <Building2 />
                </div>
                <div>
                  <small>EMPRESA AUTORIZADA</small>
                  <h2>{company.name}</h2>
                  <p>
                    {company.code} · {company.cnpj || "CNPJ não informado"}
                  </p>
                </div>
                <button onClick={() => selectCompany(company)}>
                  Entrar na empresa
                </button>
              </article>
            ))}
        </section>
        <div className="settings-tabs">
          <button
            className={tab === "companies" ? "active" : ""}
            onClick={() => setTab("companies")}
          >
            <Building2 />
            Empresas
          </button>
          <button
            className={tab === "users" ? "active" : ""}
            onClick={() => setTab("users")}
          >
            <UserRound />
            Usuários e senhas
          </button>
        </div>
        {tab === "companies" ? (
          <>
            <section className="settings-form">
              <h3>Nova empresa</h3>
              <label>
                Código
                <input
                  value={companyDraft.code}
                  onChange={(e) =>
                    setCompanyDraft({ ...companyDraft, code: e.target.value })
                  }
                />
              </label>
              <label className="wide">
                Razão social
                <input
                  value={companyDraft.name}
                  onChange={(e) =>
                    setCompanyDraft({ ...companyDraft, name: e.target.value })
                  }
                />
              </label>
              <label>
                CNPJ
                <input
                  value={companyDraft.cnpj}
                  onChange={(e) =>
                    setCompanyDraft({ ...companyDraft, cnpj: e.target.value })
                  }
                />
              </label>
              <button onClick={addCompany}>
                <Plus />
                Incluir empresa
              </button>
            </section>
            <section className="settings-list">
              <header>
                <h3>Empresas cadastradas</h3>
                <span>{companies.length} registros</span>
              </header>
              {companies.map((company) => (
                <article key={company.id}>
                  <div>
                    <b>
                      {company.code} — {company.name}
                    </b>
                    <span>{company.cnpj || "CNPJ não informado"}</span>
                  </div>
                  <em>{company.active ? "Ativa" : "Inativa"}</em>
                  <button onClick={() => selectCompany(company)}>
                    Usar esta empresa
                  </button>
                </article>
              ))}
            </section>
          </>
        ) : (
          <>
            <section className="settings-form user-form">
              <h3>Novo usuário</h3>
              <label>
                Nome
                <input
                  value={userDraft.name}
                  onChange={(e) =>
                    setUserDraft({ ...userDraft, name: e.target.value })
                  }
                />
              </label>
              <label>
                Login
                <input
                  value={userDraft.login}
                  onChange={(e) =>
                    setUserDraft({ ...userDraft, login: e.target.value })
                  }
                />
              </label>
              <label>
                Senha
                <input
                  type="password"
                  value={userDraft.password}
                  onChange={(e) =>
                    setUserDraft({ ...userDraft, password: e.target.value })
                  }
                />
              </label>
              <label>
                Perfil
                <select
                  value={userDraft.role}
                  onChange={(e) =>
                    setUserDraft({
                      ...userDraft,
                      role: e.target.value as User["role"],
                    })
                  }
                >
                  <option>Usuário da empresa</option>
                  <option>Administrador</option>
                </select>
              </label>
              <label>
                Empresa
                <select
                  disabled={userDraft.role === "Administrador"}
                  value={userDraft.companyId}
                  onChange={(e) =>
                    setUserDraft({ ...userDraft, companyId: e.target.value })
                  }
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <button onClick={addUser}>
                <KeyRound />
                Criar acesso
              </button>
            </section>
            <section className="settings-list">
              <header>
                <h3>Usuários cadastrados</h3>
                <span>{users.length} acessos</span>
              </header>
              {users.length ? (
                users.map((user) => (
                  <article key={user.id}>
                    <div>
                      <b>{user.name}</b>
                      <span>
                        {user.login} · {user.role}
                      </span>
                    </div>
                    <em>{user.active ? "Ativo" : "Bloqueado"}</em>
                    <button
                      onClick={async () => {
                        const next = users.map((item) =>
                          item.id === user.id
                            ? { ...item, active: !item.active }
                            : item,
                        );
                        setUsers(next);
                        await saveDurableValue("system-users-v1", next);
                      }}
                    >
                      {user.active ? "Bloquear" : "Ativar"}
                    </button>
                  </article>
                ))
              ) : (
                <div className="settings-empty">
                  Nenhum usuário criado. Cadastre o primeiro administrador e
                  depois os usuários de cada empresa.
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export function ActiveCompanyLabel() {
  return useMemo(
    () =>
      typeof window !== "undefined"
        ? localStorage.getItem("pricing-active-company-label") ||
          "400 — SANTO BRILHO"
        : "400 — SANTO BRILHO",
    [],
  );
}
