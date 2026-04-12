export class SetAdvertisementStatusCommand {
  public readonly id: string;
  public readonly isActive: boolean;
  public readonly updatedBy?: string;

  constructor(id: string, isActive: boolean, updatedBy?: string) {
    this.id = id;
    this.isActive = isActive;
    this.updatedBy = updatedBy;
  }
}
