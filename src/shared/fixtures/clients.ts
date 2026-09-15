export interface ClientFixture {
  id: string;
  bsn: string;
  initials: string;
  familyName: string;
  type: 'curatele' | 'bewindvoering' | 'mentorschap' | 'vrijwillig';
  scopes?: string[];
  /** ISO 8601 format */
  dateOfBirth?: string;
}


export const standardScopes = [
  'SCHULDENBEWIND:read',
  'SCHULDENBEWIND:write',
];

// Gebaseerd op rvig testdata bsn's
export const clients: ClientFixture[] = [
  {
    id: 'client-1',
    bsn: '999971803',
    initials: 'E.',
    familyName: 'van de Kamp',
    type: 'bewindvoering',
    dateOfBirth: '1981-01-01',
  },
  {
    id: 'client-2',
    bsn: '999971773',
    initials: 'D.',
    familyName: 'Çağla',
    type: 'curatele',
    dateOfBirth: '1980-12-15',
  },
  {
    id: 'client-3',
    bsn: '999971785',
    initials: 'S.',
    familyName: 'van \'t Hul',
    type: 'mentorschap',
    dateOfBirth: '1971-02-12',
  },
  {
    id: 'client-4',
    bsn: '999971797',
    initials: 'P.',
    familyName: 'Hendriks',
    type: 'curatele',
    dateOfBirth: '1981-08-20',
  },
  {
    id: 'client-5',
    bsn: '999999333',
    initials: 'N.',
    familyName: 'Boeddhoe',
    type: 'vrijwillig',
    dateOfBirth: '1990-03-20',
  },
];

export interface RepresentedClient extends ClientFixture {
  representativeName: string;
}

export function representedClients(organisationName: string): RepresentedClient[] {
  return clients.map((client) => ({ ...client, representativeName: organisationName }));
}

export function findClientById(id: string): ClientFixture | undefined {
  return clients.find((client) => client.id === id);
}
