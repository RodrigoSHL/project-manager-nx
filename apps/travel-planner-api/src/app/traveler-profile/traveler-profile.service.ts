import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TripsService } from '../trips/trips.service';
import { CreateChecklistItemDto, CreateTravelDocumentDto, CreateTravelerResourceDto, ListDocumentsDto, UpdateChecklistItemDto, UpdateTravelDocumentDto, UpdateTravelerProfileDto, UpdateTravelerResourceDto } from './dto/traveler-profile.dto';
import { ChecklistStatus, TripDocument, TripDocumentChecklist } from './entities/trip-document.entity';
import { TravelDocument } from './entities/travel-document.entity';
import { TravelerProfile } from './entities/traveler-profile.entity';
import { TravelerResource, TravelerResourceKind } from './entities/traveler-resource.entity';

const CHECKLIST = ['Pasaporte vigente','Documento de identidad','Seguro de viaje','Visa o autorización','Contactos de emergencia','Dirección del primer alojamiento','Copias de respaldo disponibles'];

@Injectable()
export class TravelerProfileService {
  constructor(
    @InjectRepository(TravelerProfile) private profiles: Repository<TravelerProfile>,
    @InjectRepository(TravelDocument) private documents: Repository<TravelDocument>,
    @InjectRepository(TravelerResource) private resources: Repository<TravelerResource>,
    @InjectRepository(TripDocument) private tripDocuments: Repository<TripDocument>,
    @InjectRepository(TripDocumentChecklist) private checklist: Repository<TripDocumentChecklist>,
    private trips: TripsService,
  ) {}

  async getProfile(userId: string) {
    let profile = await this.profiles.findOneBy({ userId });
    if (!profile) profile = await this.profiles.save(this.profiles.create({ userId, personal: {}, medical: {}, privacy: {} }));
    const [documents, resources] = await Promise.all([this.documents.find({ where:{userId}, order:{updatedAt:'DESC'} }), this.resources.find({ where:{userId}, order:{priority:'DESC',updatedAt:'DESC'} })]);
    return { ...profile, summary: this.summary(documents, resources) };
  }

  async updateProfile(userId: string, dto: UpdateTravelerProfileDto) {
    const current = await this.getProfile(userId);
    const profile = await this.profiles.findOneByOrFail({ userId });
    profile.personal = dto.personal ? {...profile.personal,...dto.personal} : profile.personal;
    profile.medical = dto.medical ? {...profile.medical,...dto.medical} : profile.medical;
    profile.privacy = dto.privacy ? {...profile.privacy,...dto.privacy} : profile.privacy;
    await this.profiles.save(profile);
    return { ...profile, summary: current.summary };
  }

  async listDocuments(userId:string, query:ListDocumentsDto) {
    const qb=this.documents.createQueryBuilder('d').addSelect('d.documentNumber').where('d.userId=:userId',{userId});
    if(query.type)qb.andWhere('d.type=:type',{type:query.type}); if(query.favorite!==undefined)qb.andWhere('d.favorite=:favorite',{favorite:query.favorite}); if(query.search)qb.andWhere('d.displayName ILIKE :search',{search:`%${query.search.replace(/[%_]/g,'')}%`});
    const rows=await qb.orderBy('d.favorite','DESC').addOrderBy('d.updatedAt','DESC').getMany();
    return rows.map(d=>this.presentDocument(d,query.status)).filter(Boolean);
  }
  async getDocument(userId:string,id:string) { return this.presentDocument(await this.ownedDocument(userId,id)); }
  async createDocument(userId:string,dto:CreateTravelDocumentDto) { this.validateDates(dto.issuedAt,dto.expiresAt); return this.presentDocument(await this.documents.save(this.documents.create({...dto,userId}))); }
  async updateDocument(userId:string,id:string,dto:UpdateTravelDocumentDto) { const row=await this.ownedDocument(userId,id); this.validateDates(dto.issuedAt ?? row.issuedAt,dto.expiresAt ?? row.expiresAt); Object.assign(row,dto); return this.presentDocument(await this.documents.save(row)); }
  async deleteDocument(userId:string,id:string) { const row=await this.ownedDocument(userId,id); await this.documents.softRemove(row); }
  async revealNumber(userId:string,id:string,confirm:boolean) { if(!confirm) throw new BadRequestException('Explicit confirmation is required'); const row=await this.documents.createQueryBuilder('d').addSelect('d.documentNumber').where('d.id=:id AND d.userId=:userId',{id,userId}).getOne(); if(!row) throw new NotFoundException('Document not found'); return { documentNumber: row.documentNumber }; }

  listResources(userId:string,kind?:TravelerResourceKind) { return this.resources.find({where:kind?{userId,kind}:{userId},order:{priority:'DESC',updatedAt:'DESC'}}); }
  createResource(userId:string,dto:CreateTravelerResourceDto) { return this.resources.save(this.resources.create({...dto,userId})); }
  async updateResource(userId:string,id:string,dto:UpdateTravelerResourceDto) { const row=await this.ownedResource(userId,id); Object.assign(row,dto); return this.resources.save(row); }
  async deleteResource(userId:string,id:string) { await this.resources.softRemove(await this.ownedResource(userId,id)); }

  async linkDocument(userId:string,tripId:string,documentId:string) { await this.trips.findOne(userId,tripId); await this.ownedDocument(userId,documentId); const existing=await this.tripDocuments.findOneBy({userId,tripId,documentId}); return existing ?? this.tripDocuments.save(this.tripDocuments.create({userId,tripId,documentId})); }
  async unlinkDocument(userId:string,tripId:string,documentId:string) { await this.trips.findOne(userId,tripId); const row=await this.tripDocuments.findOneBy({userId,tripId,documentId}); if(row) await this.tripDocuments.remove(row); }
  async documentsForTrip(userId:string,tripId:string) { await this.trips.findOne(userId,tripId); const links=await this.tripDocuments.findBy({userId,tripId}); return Promise.all(links.map(link=>this.getDocument(userId,link.documentId))); }

  async getChecklist(userId:string,tripId:string) { await this.trips.findOne(userId,tripId); let rows=await this.checklist.find({where:{userId,tripId},order:{position:'ASC'}}); if(!rows.length) rows=await this.checklist.save(CHECKLIST.map((label,position)=>this.checklist.create({userId,tripId,label,position,suggested:true,status:ChecklistStatus.PENDING}))); return rows; }
  async addChecklist(userId:string,tripId:string,dto:CreateChecklistItemDto) { await this.trips.findOne(userId,tripId); return this.checklist.save(this.checklist.create({...dto,userId,tripId,suggested:false})); }
  async updateChecklist(userId:string,tripId:string,id:string,dto:UpdateChecklistItemDto) { await this.trips.findOne(userId,tripId); const row=await this.checklist.findOneBy({id,userId,tripId}); if(!row) throw new NotFoundException('Checklist item not found'); Object.assign(row,dto); return this.checklist.save(row); }

  async dashboard(userId:string) { const [documents,resources]=await Promise.all([this.documents.findBy({userId}),this.resources.findBy({userId})]); return this.summary(documents,resources); }
  private summary(documents:TravelDocument[],resources:TravelerResource[]) { const statuses=documents.map(d=>this.status(d.expiresAt)); const fields=6; return { completion:Math.min(100,Math.round(((documents.length?3:0)+(resources.some(r=>r.kind===TravelerResourceKind.EMERGENCY_CONTACT)?2:0)+(resources.some(r=>r.kind===TravelerResourceKind.INSURANCE)?1:0))/fields*100)), valid:statuses.filter(s=>s==='valid').length, expiring:statuses.filter(s=>s==='expiring').length, expired:statuses.filter(s=>s==='expired').length, alerts:[...documents.filter(d=>['expiring','expired'].includes(this.status(d.expiresAt))).map(d=>({type:this.status(d.expiresAt),message:`${d.displayName} ${this.status(d.expiresAt)==='expired'?'está vencido':'vence pronto'}`})),...(!resources.some(r=>r.kind===TravelerResourceKind.EMERGENCY_CONTACT)?[{type:'recommended',message:'Agrega un contacto de emergencia'}]:[])] }; }
  private status(expiresAt:string|null) { if(!expiresAt)return 'no_date'; const days=(new Date(`${expiresAt}T12:00:00Z`).getTime()-Date.now())/86400000; return days<0?'expired':days<=180?'expiring':'valid'; }
  private presentDocument(row:TravelDocument,statusFilter?:string): any { const status=this.status(row.expiresAt); if(statusFilter&&status!==statusFilter)return null; return {...row,documentNumber:undefined,maskedNumber:this.mask(row.documentNumber),status}; }
  private mask(value:string|null) { if(!value)return null; const clean=value.replace(/\s/g,''); return `•••• •••• ${clean.slice(-4)}`; }
  private validateDates(start?:string|null,end?:string|null) { if(start&&end&&start>end) throw new BadRequestException('Expiration date must be after issue date'); }
  private async ownedDocument(userId:string,id:string) { const row=await this.documents.createQueryBuilder('d').addSelect('d.documentNumber').where('d.id=:id AND d.userId=:userId',{id,userId}).getOne(); if(!row) throw new NotFoundException('Document not found'); return row; }
  private async ownedResource(userId:string,id:string) { const row=await this.resources.findOneBy({id,userId}); if(!row) throw new NotFoundException('Resource not found'); return row; }
}
