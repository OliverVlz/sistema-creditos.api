import { CreateAdvertisementDto } from '../../infrastructure/dto/create-advertisement.dto';

export class CreateAdvertisementCommand {
  public readonly title: string;
  public readonly targetUrl?: string;
  public readonly isRedirectEnabled: boolean;
  public readonly isActive: boolean;
  public readonly sortOrder: number;
  public readonly startsAt?: Date;
  public readonly endsAt?: Date;
  public readonly image: Express.Multer.File;
  public readonly createdBy?: string;

  constructor(
    payload: CreateAdvertisementDto,
    image: Express.Multer.File,
    createdBy?: string,
  ) {
    this.title = payload.title;
    this.targetUrl = payload.targetUrl;
    this.isRedirectEnabled = payload.isRedirectEnabled;
    this.isActive = payload.isActive;
    this.sortOrder = payload.sortOrder;
    this.startsAt = payload.startsAt;
    this.endsAt = payload.endsAt;
    this.image = image;
    this.createdBy = createdBy;
  }
}
