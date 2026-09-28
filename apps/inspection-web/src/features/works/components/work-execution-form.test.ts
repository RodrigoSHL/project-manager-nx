import { describe, expect, it } from 'vitest';
import type { WorkFormItemSnapshot, WorkTemplateSnapshot } from '../models';
import { groupSnapshotBySection } from './work-execution-form';

const ROOT_ASSET_ID = 'asset-root';

function item(
  id: string,
  order: number,
  assetId: string,
  assetOrder: number,
  assetName: string
): WorkFormItemSnapshot {
  return {
    id,
    formItemId: `template-${id}`,
    assetId,
    assetCodeSnapshot: assetId.toUpperCase(),
    assetNameSnapshot: assetName,
    assetOrder,
    assetDepth: assetId === ROOT_ASSET_ID ? 0 : 1,
    type: 'CONCEPT',
    order,
    required: true,
    concept: {
      id: `concept-${id}`,
      code: id.toUpperCase(),
      name: id,
      type: 'ANALOG',
      unit: 'm/s',
      options: [],
    },
  };
}

describe('groupSnapshotBySection', () => {
  it('keeps descendant measurements inside their template section', () => {
    const snapshot: WorkTemplateSnapshot = {
      workId: 'work-1',
      tenantId: 'tenant-1',
      formTemplateId: 'template-1',
      formTemplateVersion: 1,
      name: 'Mantención mensual presurizado',
      sections: [
        {
          id: 'after',
          title: 'Registro después de la mantención',
          order: 4,
          items: [
            item(
              'anemometro-despues-posicion-2',
              9,
              'position-2',
              2,
              'Posición 2'
            ),
            item(
              'anemometro-despues-posicion-1',
              9,
              'position-1',
              1,
              'Posición 1'
            ),
          ],
        },
        {
          id: 'before',
          title: 'Registro antes de la mantención',
          order: 2,
          items: [
            item('datos-placa', 1, ROOT_ASSET_ID, 0, 'Presurizado'),
            item(
              'anemometro-antes-posicion-2',
              9,
              'position-2',
              2,
              'Posición 2'
            ),
            item(
              'anemometro-antes-posicion-1',
              9,
              'position-1',
              1,
              'Posición 1'
            ),
          ],
        },
      ],
    };

    const sections = groupSnapshotBySection(snapshot, ROOT_ASSET_ID);

    expect(sections.map((section) => section.id)).toEqual(['before', 'after']);
    expect(
      sections[0].assetGroups.map((group) => ({
        asset: group.assetName,
        items: group.items.map((entry) => entry.id),
      }))
    ).toEqual([
      { asset: 'Presurizado', items: ['datos-placa'] },
      {
        asset: 'Posición 1',
        items: ['anemometro-antes-posicion-1'],
      },
      {
        asset: 'Posición 2',
        items: ['anemometro-antes-posicion-2'],
      },
    ]);
    expect(
      sections[1].assetGroups.map((group) => ({
        asset: group.assetName,
        items: group.items.map((entry) => entry.id),
      }))
    ).toEqual([
      {
        asset: 'Posición 1',
        items: ['anemometro-despues-posicion-1'],
      },
      {
        asset: 'Posición 2',
        items: ['anemometro-despues-posicion-2'],
      },
    ]);
  });
});
