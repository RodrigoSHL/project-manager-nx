import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WorkExecutionForm } from './work-execution-form';
import type {
  ConceptResponse,
  Work,
  WorkItemValue,
  WorkTemplateSnapshot,
} from '../models';

vi.mock('../../offline/offline-context', () => ({
  useOffline: () => ({ mode: 'LOCAL', refresh: async () => {} }),
}));
vi.mock('../../../repositories/local-photo-repository', () => ({
  localPhotoRepository: { list: async () => [] },
  localPhotoAsWorkPhoto: vi.fn(),
}));

const work: Work = {
  id: 'work-1',
  tenantId: 'tenant-1',
  siteId: 'site-1',
  assetId: 'asset-1',
  workTypeId: 'type-1',
  formTemplateId: 'template-1',
  formTemplateVersion: 1,
  title: 'Revisión',
  executionDate: '2026-09-01',
  responsible: 'Operador',
  status: 'IN_PROGRESS',
  createdAt: '',
  updatedAt: '',
};
const snapshot: WorkTemplateSnapshot = {
  workId: work.id,
  tenantId: work.tenantId,
  formTemplateId: 'template-1',
  formTemplateVersion: 1,
  name: 'Revisión de filtros',
  sections: [
    {
      id: 'section-1',
      title: 'Mediciones',
      order: 1,
      items: [
        {
          id: 'filters',
          type: 'CONCEPT',
          order: 1,
          required: true,
          concept: {
            id: 'concept-1',
            code: 'FILTERS',
            name: 'Cantidad de filtros',
            type: 'ANALOG',
            options: [],
          },
        },
        {
          id: 'size',
          type: 'CONCEPT',
          order: 2,
          required: true,
          concept: {
            id: 'concept-2',
            code: 'SIZE',
            name: 'Medidas filtro',
            type: 'ANALOG',
            unit: 'cm',
            options: [],
          },
        },
      ],
    },
  ],
};
const saved: ConceptResponse = {
  id: 'response-1',
  tenantId: work.tenantId,
  workId: work.id,
  formItemId: 'filters',
  conceptId: 'concept-1',
  valueNumber: 5,
  measuredAt: '2026-09-12',
  measuredAtTime: '14:35:00',
  createdAt: '',
  updatedAt: '',
};

function preview(
  responses: ConceptResponse[] = [],
  status: Work['status'] = 'IN_PROGRESS'
) {
  const onSave = vi.fn(async (_values: Record<string, WorkItemValue>) => {});
  render(
    <WorkExecutionForm
      work={{ ...work, status }}
      snapshot={snapshot}
      responses={responses}
      taskCompletions={[]}
      annotations={[]}
      onSave={onSave}
      onStart={async () => {}}
      onFinish={async () => ({ ok: true })}
    />
  );
  return onSave;
}

describe('measurement date and time', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 14, 8, 0));
  });
  afterEach(() => vi.useRealTimers());

  it('collapses date fields and saves the current local moment at the first reading, rather than the work date or form-open time', async () => {
    const save = preview();
    expect(
      screen.queryByLabelText('Fecha de medición')
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Editar fecha y hora de Cantidad de filtros',
      })
    ).toHaveAttribute('aria-expanded', 'false');
    vi.setSystemTime(new Date(2026, 9, 14, 8, 15));
    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Cantidad de filtros' }),
      { target: { value: '6' } }
    );
    vi.setSystemTime(new Date(2026, 9, 14, 9, 0));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0]).toEqual({
      filters: {
        valueNumber: 6,
        measuredAt: '2026-10-14',
        measuredAtTime: '08:15',
      },
    });
  });

  it('refreshes defaults when opening an untouched reading on a later day without creating a response', async () => {
    const save = preview();
    vi.setSystemTime(new Date(2026, 9, 15, 0, 2));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Editar fecha y hora de Cantidad de filtros',
      })
    );
    expect(screen.getByLabelText('Fecha de medición')).toHaveValue(
      '2026-10-15'
    );
    expect(screen.getByLabelText('Hora de medición (opcional)')).toHaveValue(
      '00:02'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0]).toEqual({});
  });

  it('keeps a custom date and time when closing the editor and changing the reading again', async () => {
    const save = preview();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Editar fecha y hora de Cantidad de filtros',
      })
    );
    fireEvent.change(screen.getByLabelText('Fecha de medición'), {
      target: { value: '2026-10-13' },
    });
    fireEvent.change(screen.getByLabelText('Hora de medición (opcional)'), {
      target: { value: '07:03' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Ocultar fecha y hora de Cantidad de filtros',
      })
    );
    expect(
      screen.queryByLabelText('Fecha de medición')
    ).not.toBeInTheDocument();
    vi.setSystemTime(new Date(2026, 9, 14, 12, 0));
    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Cantidad de filtros' }),
      { target: { value: '8' } }
    );
    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Medidas filtro' }),
      { target: { value: '20' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0]).toEqual({
      filters: {
        measuredAt: '2026-10-13',
        measuredAtTime: '07:03',
        valueNumber: 8,
      },
      size: {
        measuredAt: '2026-10-14',
        measuredAtTime: '12:00',
        valueNumber: 20,
      },
    });
  });

  it('uses each reading local day independently when work continues across midnight', async () => {
    vi.setSystemTime(new Date(2026, 9, 14, 23, 58));
    const save = preview();
    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Cantidad de filtros' }),
      { target: { value: '5' } }
    );
    vi.setSystemTime(new Date(2026, 9, 15, 0, 2));
    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Medidas filtro' }),
      { target: { value: '20' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0]).toMatchObject({
      filters: { measuredAt: '2026-10-14', measuredAtTime: '23:58' },
      size: { measuredAt: '2026-10-15', measuredAtTime: '00:02' },
    });
  });

  it('preserves a saved historical moment when editing its reading', async () => {
    const save = preview([saved]);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Editar fecha y hora de Cantidad de filtros',
      })
    );
    expect(screen.getByLabelText('Fecha de medición')).toHaveValue(
      '2026-09-12'
    );
    expect(screen.getByLabelText('Hora de medición (opcional)')).toHaveValue(
      '14:35'
    );
    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Cantidad de filtros' }),
      { target: { value: '9' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0].filters).toMatchObject({
      valueNumber: 9,
      measuredAt: '2026-09-12',
      measuredAtTime: '14:35',
    });
  });

  it('does not invent an hour for a historical reading that has no recorded hour', async () => {
    const save = preview([{ ...saved, measuredAtTime: null }]);
    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Cantidad de filtros' }),
      { target: { value: '7' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0].filters).toMatchObject({
      measuredAt: '2026-09-12',
      measuredAtTime: null,
    });
  });

  it('allows explicitly removing the optional hour of a new reading', async () => {
    const save = preview();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Editar fecha y hora de Cantidad de filtros',
      })
    );
    fireEvent.change(screen.getByLabelText('Hora de medición (opcional)'), {
      target: { value: '' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Ocultar fecha y hora de Cantidad de filtros',
      })
    );
    fireEvent.change(
      screen.getByRole('spinbutton', { name: 'Cantidad de filtros' }),
      { target: { value: '3' } }
    );
    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0].filters).toMatchObject({
      measuredAt: '2026-10-14',
      measuredAtTime: null,
    });
  });

  it('keeps saved date fields read-only for a finished work', () => {
    preview([saved], 'FINISHED');
    expect(
      screen.getByRole('spinbutton', { name: 'Cantidad de filtros' })
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Ver fecha y hora de Cantidad de filtros',
      })
    );
    expect(screen.getByLabelText('Fecha de medición')).toBeDisabled();
    expect(screen.getByLabelText('Hora de medición (opcional)')).toBeDisabled();
    expect(screen.getByLabelText('Fecha de medición')).toHaveValue(
      '2026-09-12'
    );
    expect(
      screen.queryByRole('button', { name: 'Guardar borrador' })
    ).not.toBeInTheDocument();
  });

  it('does not stamp an unanswered measurement when only adding a comment', async () => {
    const save = preview();
    const measurement = screen.getByRole('group', {
      name: 'Cantidad de filtros *',
    });
    fireEvent.click(
      within(measurement).getByRole('button', {
        name: 'Comentario y fotografías',
      })
    );
    fireEvent.change(within(measurement).getByRole('textbox'), {
      target: { value: 'Comentario sin medición' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar borrador' }));
    await waitFor(() => expect(save).toHaveBeenCalledOnce());
    expect(save.mock.calls[0][0].filters).toEqual({
      comment: 'Comentario sin medición',
    });
    expect(save.mock.calls[0][0].size).toBeUndefined();
  });
});
