import workbook from "./data/technical-sheets.json";

export const TECHNICAL_COSTS_KEY="technical-product-costs-with-loss-v1";

type TechnicalProduct={code:string;name:string;total:number;items:unknown[]};
const products=(workbook as {products:TechnicalProduct[]}).products;
const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-zA-Z0-9]/g,"").toLowerCase();

export function initialTechnicalCost(code:string|number,name:string,lossPercent=3){
  const sameCode=products.filter(item=>String(item.code).toUpperCase()===String(code).toUpperCase());
  const sheet=sameCode.find(item=>normalize(item.name)===normalize(name))||sameCode.find(item=>item.items.length>0)||products.find(item=>normalize(item.name)===normalize(name));
  if(!sheet||!(sheet.total>0))return undefined;
  return sheet.total*(1+Math.max(0,lossPercent)/100);
}
