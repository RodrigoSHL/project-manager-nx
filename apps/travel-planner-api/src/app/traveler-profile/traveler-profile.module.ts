import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripsModule } from '../trips/trips.module';
import { TripDocument, TripDocumentChecklist } from './entities/trip-document.entity';
import { TravelDocument } from './entities/travel-document.entity';
import { TravelerProfile } from './entities/traveler-profile.entity';
import { TravelerResource } from './entities/traveler-resource.entity';
import { TravelerProfileController } from './traveler-profile.controller';
import { TravelerProfileService } from './traveler-profile.service';

@Module({imports:[TypeOrmModule.forFeature([TravelerProfile,TravelDocument,TravelerResource,TripDocument,TripDocumentChecklist]),TripsModule],controllers:[TravelerProfileController],providers:[TravelerProfileService]})
export class TravelerProfileModule{}
