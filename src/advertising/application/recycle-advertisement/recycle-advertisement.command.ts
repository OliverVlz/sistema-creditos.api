export class RecycleAdvertisementCommand {
  public readonly id: string;
  public readonly historyId: string;
  public readonly updatedBy?: string;

  constructor(id: string, historyId: string, updatedBy?: string) {
    this.id = id;
    this.historyId = historyId;
    this.updatedBy = updatedBy;
  }
}
