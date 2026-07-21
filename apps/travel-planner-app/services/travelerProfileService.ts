import { getAuthHeaders } from '@/lib/auth';
const BASE='/api/traveler-profile';
async function response<T>(r:Response):Promise<T>{if(r.status===204)return undefined as T;if(!r.ok){const b=await r.json().catch(()=>null);throw new Error(Array.isArray(b?.message)?b.message[0]:b?.message||`Error ${r.status}`)}return r.json()}
async function request<T>(path:string,init?:RequestInit){return response<T>(await fetch(`${BASE}${path}`,{...init,cache:'no-store',credentials:'include',headers:{...getAuthHeaders(),...(init?.body?{'Content-Type':'application/json'}:{}),...init?.headers}}))}
export type DocumentType='identity'|'passport'|'visa'|'immigration_permit'|'driver_license'|'international_driver_permit'|'vaccination'|'prescription'|'medical_certificate'|'travel_insurance'|'assistance_certificate'|'accommodation'|'other';
export interface TravelDocument{id:string;type:DocumentType;displayName:string;issuingCountry?:string;documentNumber?:string;maskedNumber?:string;issuedAt?:string;expiresAt?:string;holderName?:string;notes?:string;favorite:boolean;status:'valid'|'expiring'|'expired'|'no_date';fileIds:string[]}
export interface Summary{completion:number;valid:number;expiring:number;expired:number;alerts:{type:string;message:string}[]}
export interface TravelerProfile{personal:Record<string,string>;medical:Record<string,string>;privacy:Record<string,unknown>;summary:Summary}
export interface TravelerResource{id:string;kind:'insurance'|'emergency_contact'|'important_address'|'medication'|'reminder';name:string;data:Record<string,string|boolean>;favorite:boolean;priority:number}
export type ChecklistStatus='pending'|'in_progress'|'completed'|'not_applicable';
export interface TripDocumentChecklistItem{id:string;tripId:string;label:string;status:ChecklistStatus;suggested:boolean;position:number}
export const getProfile=()=>request<TravelerProfile>('');
export const updateProfile=(data:Partial<TravelerProfile>)=>request<TravelerProfile>('',{method:'PATCH',body:JSON.stringify(data)});
export const getDocuments=()=>request<TravelDocument[]>('/documents');
export const createDocument=(data:Partial<TravelDocument>)=>request<TravelDocument>('/documents',{method:'POST',body:JSON.stringify(data)});
export const updateDocument=(id:string,data:Partial<TravelDocument>)=>request<TravelDocument>(`/documents/${id}`,{method:'PATCH',body:JSON.stringify(data)});
export const deleteDocument=(id:string)=>request<void>(`/documents/${id}`,{method:'DELETE'});
export const getResources=()=>request<TravelerResource[]>('/resources');
export const createResource=(data:Partial<TravelerResource>)=>request<TravelerResource>('/resources',{method:'POST',body:JSON.stringify(data)});
export const deleteResource=(id:string)=>request<void>(`/resources/${id}`,{method:'DELETE'});
export const getTripDocuments=(tripId:string)=>request<TravelDocument[]>(`/trips/${tripId}/documents`);
export const linkDocumentToTrip=(tripId:string,documentId:string)=>request<{id:string;tripId:string;documentId:string}>(`/trips/${tripId}/documents`,{method:'POST',body:JSON.stringify({documentId})});
export const unlinkDocumentFromTrip=(tripId:string,documentId:string)=>request<void>(`/trips/${tripId}/documents/${documentId}`,{method:'DELETE'});
export const getTripDocumentChecklist=(tripId:string)=>request<TripDocumentChecklistItem[]>(`/trips/${tripId}/checklist`);
export const createTripChecklistItem=(tripId:string,label:string,position:number)=>request<TripDocumentChecklistItem>(`/trips/${tripId}/checklist`,{method:'POST',body:JSON.stringify({label,position})});
export const updateTripChecklistItem=(tripId:string,id:string,data:Partial<Pick<TripDocumentChecklistItem,'label'|'status'|'position'>>)=>request<TripDocumentChecklistItem>(`/trips/${tripId}/checklist/${id}`,{method:'PATCH',body:JSON.stringify(data)});
export async function uploadDocumentFile(documentId:string,file:File){const form=new FormData();form.append('file',file);form.append('application','travel-planner-app');form.append('ownerType','traveler-document');form.append('ownerId',documentId);form.append('metadata',JSON.stringify({category:'traveler-document'}));return response<{id:string}>(await fetch('/api/storage/files',{method:'POST',credentials:'include',headers:getAuthHeaders(),body:form}))}

export interface DocumentFileContent {
  blob: Blob;
  fileName: string;
  mimeType: string;
}

export async function getDocumentFileContent(fileId:string):Promise<DocumentFileContent>{
  const result=await fetch(`/api/storage/files/${fileId}/content`,{
    cache:'no-store',
    credentials:'include',
    headers:getAuthHeaders(),
  });
  if(!result.ok){
    const body=await result.json().catch(()=>null) as {message?:string}|null;
    throw new Error(body?.message||`No se pudo abrir el archivo (${result.status})`);
  }
  const disposition=result.headers.get('content-disposition')||'';
  const encodedName=disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const quotedName=disposition.match(/filename="([^"]+)"/i)?.[1];
  return {
    blob:await result.blob(),
    fileName:encodedName?decodeURIComponent(encodedName):quotedName||'documento',
    mimeType:result.headers.get('content-type')||'application/octet-stream',
  };
}
