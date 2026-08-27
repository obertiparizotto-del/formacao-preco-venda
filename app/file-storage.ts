export async function storeCompanyFile(file:File,category="importacoes"){
  const form=new FormData();
  form.set("file",file);form.set("category",category);form.set("companyId",localStorage.getItem("pricing-active-company")||"santo-brilho");
  const response=await fetch("/api/files",{method:"POST",body:form});
  return response.ok;
}
