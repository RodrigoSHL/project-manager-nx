import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { WorkListFilters } from './work-list-filters';

const values = {
  tenantId: 'a',
  siteId: 'north',
  assetId: 'asset-n',
  workTypeId: '',
  status: '',
};
function mount() {
  const onChange = vi.fn();
  render(
    <WorkListFilters
      values={values}
      tenants={[
        { id: 'a', name: 'Empresa A' },
        { id: 'b', name: 'Empresa B' },
      ]}
      sites={['north', 'south'].map((id) => ({
        id,
        name: id,
        tenantId: 'a',
        code: id,
        type: 'MINE' as const,
        active: true,
      }))}
      assets={['north', 'south'].map((siteId) => ({
        id: siteId === 'north' ? 'asset-n' : 'asset-s',
        siteId,
        tenantId: 'a',
        code: siteId,
        name: siteId,
        assetTypeId: 'type',
        parentId: null,
        status: 'ACTIVE' as const,
      }))}
      workTypes={[]}
      loading={false}
      onChange={onChange}
    />
  );
  fireEvent.click(screen.getByRole('button', { name: /^Filtros/ }));
  return { onChange, dialog: within(screen.getByRole('dialog')) };
}

describe('work list mobile filters', () => {
  it('clears the previous asset when changing site and applies the newly selected asset together', () => {
    const { onChange, dialog } = mount();
    fireEvent.change(dialog.getByLabelText('Faena'), {
      target: { value: 'south' },
    });
    expect(dialog.getByLabelText('Activo')).toHaveValue('');
    expect(
      dialog.queryByRole('option', { name: 'north · north' })
    ).not.toBeInTheDocument();
    fireEvent.change(dialog.getByLabelText('Activo'), {
      target: { value: 'asset-s' },
    });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(dialog.getByRole('button', { name: 'Aplicar filtros' }));
    expect(onChange).toHaveBeenCalledWith({
      ...values,
      siteId: 'south',
      assetId: 'asset-s',
    });
  });

  it('clears tenant-specific choices and does not expose the old catalogs in the new company draft', () => {
    const { onChange, dialog } = mount();
    fireEvent.change(dialog.getByLabelText('Empresa'), {
      target: { value: 'b' },
    });
    expect(dialog.getByLabelText('Activo')).toBeDisabled();
    expect(
      dialog.queryByRole('option', { name: 'north' })
    ).not.toBeInTheDocument();
    fireEvent.click(dialog.getByRole('button', { name: 'Aplicar filtros' }));
    expect(onChange).toHaveBeenCalledWith({
      tenantId: 'b',
      siteId: '',
      assetId: '',
      workTypeId: '',
      status: '',
    });
  });
});
