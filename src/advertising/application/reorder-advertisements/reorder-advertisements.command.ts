export class ReorderAdvertisementsCommand {
  public readonly items: { id: string; sortOrder: number }[];
  public readonly updatedBy?: string;

  constructor(items: { id: string; sortOrder: number }[], updatedBy?: string) {
    this.items = items;
    this.updatedBy = updatedBy;
  }
}
