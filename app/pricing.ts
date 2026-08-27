type PriceableProduct = {codigo:string|number;precoCalculado:number;precoPraticado:number;custo:number;lucro?:number;margem?:number};
export type ActiveGgfRates={ggf:number;admin:number;date?:string;rateRecordId?:string;appliedAt?:string};
type FullyPriceable=PriceableProduct&{tipo?:string;pis?:number;cofins?:number;irCs?:number;icms?:number;frete?:number;comissao?:number;verbas?:number;lucroMeta?:number;inadimplencia?:number;ggf?:number;despesas?:number;monophase?:boolean;st?:boolean};

export type TaxTreatment={monophase?:boolean;st?:boolean};

export function withTaxTreatment<T extends FullyPriceable>(product:T,treatment:TaxTreatment):T{
  const monophase=Boolean(treatment.monophase),st=Boolean(treatment.st);
  return {...product,monophase,st,pis:monophase?0:((product.pis??0)>0?product.pis:.0065),cofins:monophase?0:((product.cofins??0)>0?product.cofins:.03),icms:st?0:((product.icms??0)>0?product.icms:.12)};
}

// Referências validadas na formação de preço e na tabela comercial vigente.
const validatedCalculatedPrices:Record<string,number>={"871":4.38};

export function withCanonicalPrice<T extends PriceableProduct>(product:T):T{
  const precoCalculado=validatedCalculatedPrices[String(product.codigo)]??product.precoCalculado;
  const lucro=product.precoPraticado-product.custo;
  const margem=product.precoPraticado?lucro/product.precoPraticado:0;
  return {...product,precoCalculado,lucro,margem};
}

export function withActiveGgfRates<T extends FullyPriceable>(product:T,rates:ActiveGgfRates):T{
  const admin=Math.max(0,rates.admin||0)/100,ggf=product.tipo==="IND"?Math.max(0,rates.ggf||0)/100:0;
  const other=(product.pis||0)+(product.cofins||0)+(product.irCs||0)+(product.icms||0)+(product.frete||0)+(product.comissao||0)+(product.verbas||0)+(product.lucroMeta||0)+(product.inadimplencia||0);
  const denominator=1-other-admin-ggf,precoCalculado=denominator>0?product.custo/denominator:0;
  const deductions=product.precoPraticado*(other+admin+ggf-(product.lucroMeta||0)),lucro=product.precoPraticado-product.custo-deductions,margem=product.precoPraticado?lucro/product.precoPraticado:0;
  return {...product,precoCalculado,lucro,margem,ggf,despesas:admin};
}
