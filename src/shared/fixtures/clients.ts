export interface ClientFixture {
  id: string;
  bsn: string;
  initials: string;
  familyName: string;
  type: string;
  scopes?: string[];
}

export const standardScopes = [
  'BWBR0015703:read',
  'BWBR0015703:write',
  'BWBR0015703:payout',
  'BWBR0015703:correspondence',
  'BWBR0003850:read',
];

// Gebaseerd op rvig testdata bsn's
export const clients: ClientFixture[] = [
  {
    id: 'client-1',
    bsn: '999971803',
    initials: 'E.',
    familyName: 'van de Kamp',
    type: 'Beschermingsbewind',
  },
  {
    id: 'client-2',
    bsn: '999971773',
    initials: 'D.',
    familyName: 'Çağla',
    type: 'Beschermingsbewind',
  },
  {
    id: 'client-3',
    bsn: '999971785',
    initials: 'S.',
    familyName: 'van \'t Hul',
    type: 'Beschermingsbewind',
  },
  {
    id: 'client-4',
    bsn: '999971797',
    initials: 'P.',
    familyName: 'Hendriks',
    type: 'Beschermingsbewind',
  },
  {
    id: 'client-5',
    bsn: '999999333',
    initials: 'N.',
    familyName: 'Boeddhoe',
    type: 'Beschermingsbewind',
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
