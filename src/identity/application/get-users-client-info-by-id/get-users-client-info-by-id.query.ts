/**
 * Query para obtener la información de cliente por id
 * Usado por admin, advisor o el propio cliente
 */
export class GetUsersClientInfoByIdQuery {
  readonly userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }
}
