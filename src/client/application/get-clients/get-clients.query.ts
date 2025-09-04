export class GetClientsQuery {
  readonly terms?: string;
  readonly page?: number;
  readonly limit?: number;
  // Legacy cursor support (mantener compatibilidad)
  readonly cursor?: string;
  readonly size?: number;

  constructor(params: GetClientsQuery) {
    Object.assign(this, params);
  }
}
