import { BadRequestException } from '@nestjs/common';
import { TravelerProfileService } from './traveler-profile.service';

describe('TravelerProfileService security and expiry rules',()=>{
  const service=new TravelerProfileService({} as never,{} as never,{} as never,{} as never,{} as never,{} as never);
  it('masks document numbers and keeps only the final four characters',()=>{expect((service as any).mask('AB 12345678')).toBe('•••• •••• 5678');});
  it('classifies expired, near-expiry and undated documents',()=>{expect((service as any).status(null)).toBe('no_date');expect((service as any).status('2000-01-01')).toBe('expired');const soon=new Date(Date.now()+10*86400000).toISOString().slice(0,10);expect((service as any).status(soon)).toBe('expiring');});
  it('rejects an expiration before issue date',()=>{expect(()=> (service as any).validateDates('2030-01-02','2030-01-01')).toThrow(BadRequestException);});
});
