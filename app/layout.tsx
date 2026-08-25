import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"Formação do Preço de Venda – Parsecon",description:"Painel editável para formação, simulação e análise de preços de venda.",icons:{icon:"/favicon.svg",shortcut:"/favicon.svg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="pt-BR"><body>{children}</body></html>}
