import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DashboardFilters } from './dashboard-filters';
import type { DashboardFilterValues } from '../dashboard-filters';

const filters: DashboardFilterValues = {
  period: 'custom',
  from: '2026-01-01',
  to: '2026-02-01',
  siteId: 'north',
  workTypeId: 'visual',
  assetTypeId: 'transformer',
};
function mount(selectedFilters: DashboardFilterValues = filters) {
  const callbacks = {
    onChange: vi.fn(),
    onTenantChange: vi.fn(),
    onApply: vi.fn(),
  };
  render(
    <DashboardFilters
      filters={selectedFilters}
      tenantId="company-a"
      tenants={[
        { id: 'company-a', name: 'Empresa A' },
        { id: 'company-b', name: 'Empresa B' },
      ]}
      sites={[
        {
          id: 'north',
          tenantId: 'company-a',
          name: 'Norte',
          code: 'N',
          type: 'MINE',
          active: true,
        },
      ]}
      workTypes={[
        {
          id: 'visual',
          tenantId: 'company-a',
          name: 'Visual',
          code: 'V',
          active: true,
        },
      ]}
      assetTypes={[
        {
          id: 'transformer',
          tenantId: 'company-a',
          name: 'Transformador',
          code: 'T',
          active: true,
        },
      ]}
      loadingOptions={false}
      optionsError={null}
      {...callbacks}
    />
  );
  return callbacks;
}
function openFilters() {
  fireEvent.click(screen.getByRole('button', { name: /^Filtros/ }));
  return within(screen.getByRole('dialog', { name: 'Filtros del resumen' }));
}

describe('dashboard mobile filters', () => {
  it('can recover from an incomplete custom date supplied by a local report', () => {
    mount({ period: 'custom', from: '', to: '2026-02-01' });
    const dialog = openFilters();
    expect(
      dialog.getByRole('button', { name: 'Aplicar filtros' })
    ).toBeDisabled();
    fireEvent.change(dialog.getByLabelText('Desde'), {
      target: { value: '2026-01-01' },
    });
    expect(
      dialog.getByRole('button', { name: 'Aplicar filtros' })
    ).toBeEnabled();
  });
  it('keeps edits provisional and discards them when the panel closes', () => {
    const callbacks = mount();
    let dialog = openFilters();
    fireEvent.change(dialog.getByLabelText('Faena'), { target: { value: '' } });
    expect(callbacks.onChange).not.toHaveBeenCalled();
    expect(callbacks.onApply).not.toHaveBeenCalled();
    fireEvent.click(dialog.getByRole('button', { name: 'Cerrar filtros' }));
    dialog = openFilters();
    expect(dialog.getByLabelText('Faena')).toHaveValue('north');
    fireEvent.change(dialog.getByLabelText('Faena'), { target: { value: '' } });
    fireEvent.click(dialog.getByRole('button', { name: 'Aplicar filtros' }));
    expect(callbacks.onApply).toHaveBeenCalledWith('company-a', {
      ...filters,
      siteId: '',
    });
  });

  it('resets the draft without changing the applied company or filters until Apply', () => {
    const callbacks = mount();
    const dialog = openFilters();
    fireEvent.click(dialog.getByRole('button', { name: 'Restablecer' }));
    expect(dialog.getByLabelText('Período')).toHaveValue('6m');
    expect(dialog.getByLabelText('Faena')).toHaveValue('');
    expect(callbacks.onApply).not.toHaveBeenCalled();
    fireEvent.click(dialog.getByRole('button', { name: 'Aplicar filtros' }));
    expect(callbacks.onApply).toHaveBeenCalledWith(
      'company-a',
      expect.objectContaining({
        period: '6m',
      })
    );
    const applied = callbacks.onApply.mock.calls[0][1];
    expect(applied.siteId).toBeUndefined();
    expect(applied.workTypeId).toBeUndefined();
    expect(applied.assetTypeId).toBeUndefined();
  });

  it('clears catalog selections when changing company and hides the old options', () => {
    const callbacks = mount();
    const dialog = openFilters();
    fireEvent.change(dialog.getByLabelText('Empresa'), {
      target: { value: 'company-b' },
    });
    expect(dialog.getByLabelText('Faena')).toBeDisabled();
    expect(
      dialog.queryByRole('option', { name: 'Norte' })
    ).not.toBeInTheDocument();
    expect(callbacks.onTenantChange).not.toHaveBeenCalled();
    fireEvent.click(dialog.getByRole('button', { name: 'Aplicar filtros' }));
    expect(callbacks.onApply).toHaveBeenCalledWith('company-b', {
      ...filters,
      siteId: '',
      workTypeId: '',
      assetTypeId: '',
    });
  });

  it('prevents applying an empty or reversed custom date range', () => {
    mount();
    const dialog = openFilters();
    fireEvent.change(dialog.getByLabelText('Desde'), {
      target: { value: '2026-03-01' },
    });
    expect(
      dialog.getByRole('button', { name: 'Aplicar filtros' })
    ).toBeDisabled();
    fireEvent.change(dialog.getByLabelText('Desde'), { target: { value: '' } });
    expect(
      dialog.getByRole('button', { name: 'Aplicar filtros' })
    ).toBeDisabled();
  });
});
