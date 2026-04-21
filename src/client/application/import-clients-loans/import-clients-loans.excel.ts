import * as XLSX from 'xlsx';

export const CLIENT_LOAN_IMPORT_COLUMNS = [
  'email',
  'password',
  'firstName',
  'lastName',
  'documentNumber',
  'phoneNumber',
  'birthDate',
  'address',
  'employmentStatus',
  'organizationName',
  'loanTypeName',
  'amountRequested',
  'termMonths',
] as const;

export type ClientLoanImportColumn =
  (typeof CLIENT_LOAN_IMPORT_COLUMNS)[number];

export type ClientLoanImportRow = Record<
  ClientLoanImportColumn,
  string | number | Date
>;

const HEADER_ALIASES: Record<ClientLoanImportColumn, string[]> = {
  email: ['email', 'correo', 'correoelectronico', 'e-mail'],
  password: ['password', 'contrasena', 'clave'],
  firstName: ['firstname', 'nombre', 'nombres', 'primernombre'],
  lastName: ['lastname', 'apellido', 'apellidos'],
  documentNumber: ['documentnumber', 'documento', 'numerodocumento'],
  phoneNumber: ['phonenumber', 'telefono', 'celular', 'numerotelefono'],
  birthDate: ['birthdate', 'fechanacimiento', 'fecha_nacimiento'],
  address: ['address', 'direccion', 'domicilio'],
  employmentStatus: ['employmentstatus', 'estadoempleo', 'estadolaboral'],
  organizationName: ['organizationname', 'organizacion', 'nombreorganizacion'],
  loanTypeName: ['loantypename', 'tipoprestamo', 'prestamo'],
  amountRequested: ['amountrequested', 'montosolicitado', 'monto'],
  termMonths: ['termmonths', 'plazomeses', 'plazo'],
};

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s_-]/g, '');
}

function buildSourceMap(row: Record<string, string | number | Date>) {
  const sourceMap = new Map<string, string | number | Date>();

  Object.entries(row).forEach(([key, value]) => {
    sourceMap.set(normalizeHeader(key), value);
  });

  return sourceMap;
}

export function buildClientsLoansTemplateBuffer(): Buffer {
  const data: Array<Array<string | number>> = [
    [...CLIENT_LOAN_IMPORT_COLUMNS],
    [
      'cliente1@correo.com',
      'Pass1234',
      'Juan',
      'Perez',
      '12345678',
      '3001234567',
      '01-05-1990',
      'Calle 25 #12 - 27 of 403',
      'ACTIVO',
      'Policia Nacional',
      'Libranza',
      2500000,
      24,
    ],
    [
      'cliente1@correo.com',
      'Pass1234',
      'Juan',
      'Perez',
      '12345678',
      '3001234567',
      '',
      'Calle 25 #12 - 27 of 403',
      '',
      '',
      'Libre Inversion',
      1800000,
      18,
    ],
  ];

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'plantilla');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

export function parseClientsLoansWorkbook(
  fileBuffer: Buffer,
): ClientLoanImportRow[] {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    return [];
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, string | number | Date>>(
    sheet,
    {
      defval: '',
      raw: true,
      dateNF: 'dd-mm-yyyy',
    },
  );

  return rows.map(row => {
    const normalized = {} as ClientLoanImportRow;
    const sourceMap = buildSourceMap(row);

    CLIENT_LOAN_IMPORT_COLUMNS.forEach(column => {
      const alias = HEADER_ALIASES[column].find(candidate =>
        sourceMap.has(normalizeHeader(candidate)),
      );
      const value = alias ? sourceMap.get(normalizeHeader(alias)) : row[column];
      normalized[column] = value === undefined || value === null ? '' : value;
    });

    return normalized;
  });
}
