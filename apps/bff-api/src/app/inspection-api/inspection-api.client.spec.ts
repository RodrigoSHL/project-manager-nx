import { ServiceUnavailableException } from '@nestjs/common';
import { InspectionApiClient } from './inspection-api.client';

describe('InspectionApiClient', () => {
  let fetchMock: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    process.env.INSPECTION_API_URL = 'http://inspection-api.test/api';
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    delete process.env.INSPECTION_API_URL;
  });

  it('forwards a tenant-scoped asset request', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify([{ id: 'asset-1' }]), { status: 200 })
    );
    const client = new InspectionApiClient();

    await expect(client.listAssets('tenant-1', 'site-1')).resolves.toEqual([
      { id: 'asset-1' },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://inspection-api.test/api/tenants/tenant-1/sites/site-1/assets'
    );
  });

  it('reports when inspection-api is unavailable', async () => {
    fetchMock.mockRejectedValue(new Error('connection refused'));
    const client = new InspectionApiClient();

    await expect(client.listTenants()).rejects.toBeInstanceOf(
      ServiceUnavailableException
    );
  });

  it('forwards asset mutations as JSON', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 'asset-1' }), { status: 200 })
    );
    const client = new InspectionApiClient();
    const payload = {
      code: 'TR-NEW',
      name: 'Transformador nuevo',
      type: 'POWER_TRANSFORMER',
      parentId: null,
      status: 'ACTIVE' as const,
      description: null,
    };

    await client.createAsset('tenant-1', 'site-1', payload);

    expect(fetchMock).toHaveBeenCalledWith(
      'http://inspection-api.test/api/tenants/tenant-1/sites/site-1/assets',
      {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      }
    );
  });
});
