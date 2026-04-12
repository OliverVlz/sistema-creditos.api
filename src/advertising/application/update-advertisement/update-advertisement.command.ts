import { UpdateAdvertisementDto } from '../../infrastructure/dto/update-advertisement.dto';

export class UpdateAdvertisementCommand {
  public readonly id: string;
  public readonly title?: string;
  public readonly targetUrl?: string;
  public readonly isRedirectEnabled?: boolean;
  public readonly isActive?: boolean;
  public readonly sortOrder?: number;
  public readonly startsAt?: Date;
  public readonly endsAt?: Date;
  public readonly image?: Express.Multer.File;
  public readonly updatedBy?: string;

  constructor(
    id: string,
    payload: UpdateAdvertisementDto,
    image?: Express.Multer.File,
    updatedBy?: string,
  ) {
    this.id = id;
    this.title = payload.title;
    this.targetUrl = payload.targetUrl;
    this.isRedirectEnabled = payload.isRedirectEnabled;
    this.isActive = payload.isActive;
    this.sortOrder = payload.sortOrder;
    this.startsAt = payload.startsAt;
    this.endsAt = payload.endsAt;
    this.image = image;
    this.updatedBy = updatedBy;
  }
}
