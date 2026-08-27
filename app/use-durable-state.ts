"use client";

import { Dispatch, SetStateAction, useCallback, useEffect, useRef, useState } from "react";

function activeCompany(){return typeof window!=="undefined"?(localStorage.getItem("pricing-active-company")||"santo-brilho"):"santo-brilho"}
function scopedKey(key:string){return key}
function headers(){return{"content-type":"application/json","x-company-id":activeCompany()}}

export function useDurableState<T>(key:string,initial:T):[T,Dispatch<SetStateAction<T>>,()=>Promise<boolean>,boolean]{
  const resolvedKey=scopedKey(key);
  const [value,setValue]=useState<T>(initial),[saving,setSaving]=useState(false);
  const loaded=useRef(false);
  useEffect(()=>{let active=true;loaded.current=false;setValue(initial);fetch(`/api/state?key=${encodeURIComponent(resolvedKey)}`,{headers:{"x-company-id":activeCompany()}}).then(r=>r.ok?r.json():null).then(data=>{if(active&&data?.value!==null&&data?.value!==undefined)setValue(data.value as T)}).finally(()=>{loaded.current=true});return()=>{active=false}},[resolvedKey]);
  useEffect(()=>{const sync=(event:Event)=>{const detail=(event as CustomEvent<{key:string;value:T}>).detail;if(detail?.key===resolvedKey)setValue(detail.value)};window.addEventListener("durable-state-change",sync);return()=>window.removeEventListener("durable-state-change",sync)},[resolvedKey]);
  const save=useCallback(async()=>{if(!loaded.current)return false;setSaving(true);try{const response=await fetch("/api/state",{method:"PUT",headers:headers(),body:JSON.stringify({key:resolvedKey,value})});return response.ok}finally{setSaving(false)}},[resolvedKey,value]);
  return [value,setValue,save,saving];
}

export async function saveDurableValue(key:string,value:unknown){
  const resolvedKey=scopedKey(key),response=await fetch("/api/state",{method:"PUT",headers:headers(),body:JSON.stringify({key:resolvedKey,value})});
  if(response.ok&&typeof window!=="undefined")window.dispatchEvent(new CustomEvent("durable-state-change",{detail:{key:resolvedKey,value}}));
  return response.ok;
}
