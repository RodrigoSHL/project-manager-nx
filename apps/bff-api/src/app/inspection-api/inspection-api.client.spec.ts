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

  it('forwards catalog associations and asset overrides', async () => {
    fetchMock.mockImplementation(async () =>
      Promise.resolve(
        new Response(JSON.stringify({ saved: true }), { status: 200 })
      )
    );
    const client = new InspectionApiClient();

    await client.associateAssetTypeWorkType(
      'tenant-1',
      'asset-type-1',
      'work-type-1'
    );
    await client.disassociateAssetTypeWorkType(
      'tenant-1',
      'asset-type-1',
      'work-type-1'
    );
    await client.setAssetWorkTypeOverride(
      'tenant-1',
      'site-1',
      'asset-1',
      'work-type-1',
      false
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://inspection-api.test/api/tenants/tenant-1/asset-types/asset-type-1/work-types/work-type-1',
      { method: 'PUT' }
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://inspection-api.test/api/tenants/tenant-1/asset-types/asset-type-1/work-types/work-type-1',
      { method: 'DELETE' }
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://inspection-api.test/api/tenants/tenant-1/sites/site-1/assets/asset-1/work-type-configurations/work-type-1',
      {
        method: 'PUT',
        body: JSON.stringify({ enabled: false }),
        headers: { 'Content-Type': 'application/json' },
      }
    );
  });

  it('forwards concept catalog requests and associations', async () => {
    fetchMock.mockImplementation(async () =>
      Promise.resolve(
        new Response(JSON.stringify({ saved: true }), { status: 200 })
      )
    );
    const client = new InspectionApiClient();

    await client.listConcepts('tenant-1');
    await client.listAssetTypeConcepts('tenant-1');
    await client.associateAssetTypeConcept(
      'tenant-1',
      'asset-type-1',
      'concept-1'
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://inspection-api.test/api/tenants/tenant-1/concepts'
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://inspection-api.test/api/tenants/tenant-1/asset-type-concepts'
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://inspection-api.test/api/tenants/tenant-1/asset-types/asset-type-1/concepts/concept-1',
      { method: 'PUT' }
    );
  });

  it('forwards form template mutations and ordering as JSON', async () => {
    fetchMock.mockImplementation(async () =>
      Promise.resolve(
        new Response(JSON.stringify({ saved: true }), { status: 200 })
      )
    );
    const client = new InspectionApiClient();

    await client.listFormTemplates('tenant-1');
    await client.createFormTemplate('tenant-1', 'work-type-1', {
      name: 'Formulario preventivo',
      active: true,
    });
    await client.reorderFormSections('tenant-1', 'template-1', [
      'section-2',
      'section-1',
    ]);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://inspection-api.test/api/tenants/tenant-1/form-templates'
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://inspection-api.test/api/tenants/tenant-1/work-types/work-type-1/form-template',
      {
        method: 'POST',
        body: JSON.stringify({
          name: 'Formulario preventivo',
          active: true,
        }),
        headers: { 'Content-Type': 'application/json' },
      }
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://inspection-api.test/api/tenants/tenant-1/form-templates/template-1/section-order',
      {
        method: 'PUT',
        body: JSON.stringify({ orderedIds: ['section-2', 'section-1'] }),
        headers: { 'Content-Type': 'application/json' },
      }
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

  it('forwards work creation and responses to inspection-api', async () => {
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ saved: true }), { status: 200 })
    );
    const client = new InspectionApiClient();
    const work = {
      workTypeId: 'work-type-1',
      title: 'Inspección visual T1',
      executionDate: '2026-09-10',
      responsible: 'Juan Pérez',
      status: 'DRAFT' as const,
    };
    const responses = {
      responses: [{ formItemId: 'item-1', valueNumber: 71 }],
      taskCompletions: [{ formItemId: 'task-1', completed: true }],
      annotations: [{ formItemId: 'item-1', comment: 'Temperatura estable.' }],
    };

    await client.createWork('tenant-1', 'site-1', 'asset-1', work);
    await client.saveWorkResponses('tenant-1', 'work-1', responses);

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://inspection-api.test/api/tenants/tenant-1/sites/site-1/assets/asset-1/works',
      {
        method: 'POST',
        body: JSON.stringify(work),
        headers: { 'Content-Type': 'application/json' },
      }
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://inspection-api.test/api/tenants/tenant-1/works/work-1/responses',
      {
        method: 'PUT',
        body: JSON.stringify(responses),
        headers: { 'Content-Type': 'application/json' },
      }
    );
  });

  it('forwards platform tenant administration to inspection-api', async () => {
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ saved: true }), { status: 200 })
    );
    const client = new InspectionApiClient();
    const tenant = {
      code: 'MINERA_NUEVA',
      name: 'Minera Nueva',
      active: true,
    };

    await client.listPlatformTenants();
    await client.createPlatformTenant(tenant);
    await client.updatePlatformTenant('tenant-1', { active: false });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://inspection-api.test/api/platform/tenants'
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://inspection-api.test/api/platform/tenants',
      {
        method: 'POST',
        body: JSON.stringify(tenant),
        headers: { 'Content-Type': 'application/json' },
      }
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://inspection-api.test/api/platform/tenants/tenant-1',
      {
        method: 'PATCH',
        body: JSON.stringify({ active: false }),
        headers: { 'Content-Type': 'application/json' },
      }
    );
  });

  it('forwards tenant access checks and membership changes', async () => {
    fetchMock.mockImplementation(
      async () => new Response(JSON.stringify({ saved: true }), { status: 200 })
    );
    const client = new InspectionApiClient();

    await client.listAccessibleTenants('user-1');
    await client.hasTenantAccess('user-1', 'tenant-1');
    await client.grantTenantAccess('tenant-1', 'user-1');

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      'http://inspection-api.test/api/access/users/user-1/tenants'
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://inspection-api.test/api/access/users/user-1/tenants/tenant-1'
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      'http://inspection-api.test/api/platform/tenants/tenant-1/memberships/user-1',
      { method: 'PUT' }
    );
  });
});
