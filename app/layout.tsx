import type { Metadata } from "next";
import "./globals.css";
import "./cadastros.css";
import "./operacoes.css";
import "./produtos.css";
import "./produtos-readable.css";
import "./produtos-tax-highlight.css";
import "./ficha-ajustes.css";
import "./simulacao.css";
import "./ggf.css";
import "./price-simulator.css";
import "./commercial-table.css";
import "./analysis-charts.css";
import "./reports.css";
import "./settings.css";
export const metadata:Metadata={title:"Formação do Preço de Venda – Parsecon",description:"Painel editável para formação, simulação e análise de preços de venda.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body>{children}</body></html>}
