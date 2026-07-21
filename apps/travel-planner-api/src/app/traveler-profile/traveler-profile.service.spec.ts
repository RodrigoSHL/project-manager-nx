import { BadRequestException } from '@nestjs/common';
import { TravelerProfileService } from './traveler-profile.service';

describe('TravelerProfileService security and expiry rules',()=>{
  const service=new TravelerProfileService({} as never,{} as never,{} as never,{} as never,{} as never,{} as never);
  it('masks document numbers and keeps only the final four characters',()=>{expect((service as any).mask('AB 12345678')).toBe('•••• •••• 5678');});
  it('classifies expired, near-expiry and undated documents',()=>{expect((service as any).status(null)).toBe('no_date');expect((service as any).status('2000-01-01')).toBe('expired');const soon=new Date(Date.now()+10*86400000).toISOString().slice(0,10);expect((service as any).status(soon)).toBe('expiring');});
  it('rejects an expiration before issue date',()=>{expect(()=> (service as any).validateDates('2030-01-02','2030-01-01')).toThrow(BadRequestException);});
});

describe('TravelerProfileService trip checklist',()=>{
  const rows=[{id:'item-1',label:'Pasaporte vigente'}];
  const find=jest.fn().mockResolvedValue(rows);
  const findOneBy=jest.fn();
  const save=jest.fn();
  const create=jest.fn((value)=>value);
  const repository={find,findOneBy,save,create};
  const query=jest.fn().mockResolvedValue(undefined);
  const manager={query,getRepository:jest.fn(()=>repository),transaction:jest.fn((callback)=>callback(manager))};
  const checklist={manager};
  const trips={findOne:jest.fn().mockResolvedValue({id:'trip-1'})};
  const service=new TravelerProfileService({} as never,{} as never,{} as never,{} as never,checklist as never,trips as never);

  beforeEach(()=>jest.clearAllMocks());

  it('serializes initialization by user and trip before listing items',async()=>{
    await expect(service.getChecklist('user-1','trip-1')).resolves.toBe(rows);
    expect(query).toHaveBeenCalledWith('SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',['user-1:trip-1']);
    expect(find).toHaveBeenCalledWith({where:{userId:'user-1',tripId:'trip-1'},order:{position:'ASC',createdAt:'ASC'}});
  });

  it('returns an existing custom item instead of duplicating it',async()=>{
    const existing={id:'item-2',label:'Celular'};
    findOneBy.mockResolvedValue(existing);
    await expect(service.addChecklist('user-1','trip-1',{label:'  Celular  '})).resolves.toBe(existing);
    expect(findOneBy).toHaveBeenCalledWith({userId:'user-1',tripId:'trip-1',label:'Celular'});
    expect(save).not.toHaveBeenCalled();
  });
});
