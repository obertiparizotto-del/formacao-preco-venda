export const DISPLAY_DECIMALS_KEY="display-decimal-places-v1";

let displayDigits=2;

export function normalizeDisplayDigits(value:number){
  return Math.max(0,Math.min(6,Math.trunc(Number.isFinite(value)?value:2)));
}

export function setDisplayDigits(value:number){
  displayDigits=normalizeDisplayDigits(value);
}

export function getDisplayDigits(){return displayDigits}

export function money(value:number,_legacyDigits?:number){
  return value.toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:displayDigits,maximumFractionDigits:displayDigits});
}

export function decimal(value:number,_legacyDigits?:number){
  return value.toLocaleString("pt-BR",{minimumFractionDigits:displayDigits,maximumFractionDigits:displayDigits});
}

export function percent(value:number,_legacyDigits?:number){return `${decimal(value)}%`}
export function fractionPercent(value:number){return percent(value*100)}
export function csvNumber(value:number){return value.toFixed(displayDigits).replace(".",",")}
