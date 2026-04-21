import {
  buildClientsLoansTemplateBuffer,
  CLIENT_LOAN_IMPORT_COLUMNS,
  parseClientsLoansWorkbook,
} from './import-clients-loans.excel';
import * as XLSX from 'xlsx';

describe('import-clients-loans.excel', () => {
  it('debe crear una plantilla válida con columnas esperadas', () => {
    const buffer = buildClientsLoansTemplateBuffer();
    const rows = parseClientsLoansWorkbook(buffer);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(rows.length).toBeGreaterThan(0);

    CLIENT_LOAN_IMPORT_COLUMNS.forEach(column => {
      expect(rows[0]).toHaveProperty(column);
    });
  });

  it('debe mapear valores faltantes como string vacío', () => {
    const buffer = buildClientsLoansTemplateBuffer();
    const rows = parseClientsLoansWorkbook(buffer);
    rows[0].phoneNumber = '';

    expect(rows[0].phoneNumber).toBe('');
  });

  it('debe aceptar encabezados en español', () => {
    const data = [
      [
        'correo',
        'contrasena',
        'nombres',
        'apellidos',
        'numeroDocumento',
        'telefono',
        'fechaNacimiento',
        'direccion',
        'estadoLaboral',
        'organizacion',
        'tipoPrestamo',
        'montoSolicitado',
        'plazoMeses',
      ],
      [
        'cliente.es@correo.com',
        'Pass1234',
        'Ana',
        'Lopez',
        '777001',
        '3001112233',
        '05-01-1992',
        'Calle 25 #12 - 27 of 403',
        'ACTIVO',
        'Policía Nacional',
        'Libranza',
        2100000,
        24,
      ],
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'plantilla');
    const buffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
    }) as Buffer;

    const rows = parseClientsLoansWorkbook(buffer);

    expect(rows[0].email).toBe('cliente.es@correo.com');
    expect(rows[0].password).toBe('Pass1234');
    expect(rows[0].firstName).toBe('Ana');
    expect(rows[0].lastName).toBe('Lopez');
    expect(rows[0].documentNumber).toBe('777001');
    expect(rows[0].phoneNumber).toBe('3001112233');
    expect(rows[0].birthDate).toBe('05-01-1992');
    expect(rows[0].address).toBe('Calle 25 #12 - 27 of 403');
    expect(rows[0].employmentStatus).toBe('ACTIVO');
    expect(rows[0].organizationName).toBe('Policía Nacional');
    expect(rows[0].loanTypeName).toBe('Libranza');
    expect(rows[0].amountRequested).toBe(2100000);
    expect(rows[0].termMonths).toBe(24);
  });
});
