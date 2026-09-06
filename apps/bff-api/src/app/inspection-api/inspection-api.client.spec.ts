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

  it('forwards catalog and effective work type requests', async () => {
    fetchMock.mockImplementation(async () =>
      Promise.resolve(
        new Response(JSON.stringify([{ id: 'catalog-item-1' }]), {
          status: 200,
        })
      )
    );
    const client = new InspectionApiClient();

    await client.listAssetTypes('tenant-1');
    await client.listWorkTypes('tenant-1');
    await client.listEffectiveWorkTypes('tenant-1', 'site-1', 'asset-1');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://inspection-api.test/api/tenants/tenant-1/asset-types'
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://inspection-api.test/api/tenants/tenant-1/work-types'
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://inspection-api.test/api/tenants/tenant-1/sites/site-1/assets/asset-1/work-types'
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
      assetTypeId: 'asset-type-1',
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
