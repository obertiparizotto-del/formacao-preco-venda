export function activeCompanyId(){return typeof window!=="undefined"?(localStorage.getItem("pricing-active-company")||"santo-brilho"):"santo-brilho"}
export function isPrimaryCompany(){return activeCompanyId()==="santo-brilho"}
