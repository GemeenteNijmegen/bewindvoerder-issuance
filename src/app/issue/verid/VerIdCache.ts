import { DeleteCommand, DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ICacheManager } from '@ver-id/node-client';

const PREFIX = 'verid:';
const TTL_SECONDS = 600;

/**
 * De Ver.ID SDK verwacht een cache met partition key pk, onze sessions table heeft sessionid.
 * Deze adapter gebruikt dezelfde tabel, met een prefix zodat het niet botst met echte sessies.
 */
export class VerIdCache implements ICacheManager {
  constructor(private readonly client: DynamoDBDocumentClient, private readonly tableName: string) {}

  async save(key: string, value: string): Promise<void> {
    const ttl = Math.floor(Date.now() / 1000) + TTL_SECONDS;
    await this.client.send(new PutCommand({
      TableName: this.tableName,
      Item: { sessionid: PREFIX + key, value, ttl },
    }));
  }

  async get(key: string): Promise<string | null> {
    const result = await this.client.send(new GetCommand({
      TableName: this.tableName,
      Key: { sessionid: PREFIX + key },
    }));
    return (result.Item?.value as string) ?? null;
  }

  async remove(key: string): Promise<void> {
    await this.client.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { sessionid: PREFIX + key },
    }));
  }
}
