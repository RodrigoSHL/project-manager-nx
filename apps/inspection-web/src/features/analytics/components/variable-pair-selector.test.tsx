import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VariablePairSelector } from './variable-pair-selector';

const assets = [
  {
    id: 'r1',
    tenantId: 'a',
    siteId: 'north',
    name: 'Radiador R1',
    code: 'R1',
    assetTypeId: 'radiator',
    parentId: null,
    status: 'ACTIVE' as const,
  },
];
const concepts = [
  { id: 'temp', name: 'Temperatura', unit: '°C', measurementCount: 2 },
];

describe('mobile variable selection', () => {
  it('requires a complete pair and commits both choices together', () => {
    const onChange = vi.fn();
    render(
      <VariablePairSelector
        label="Variable A"
        value={{ assetId: '', conceptId: '' }}
        assets={assets}
        concepts={concepts}
        disabled={false}
        loading={false}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Elegir Variable A' }));
    const dialog = within(screen.getByRole('dialog'));
    expect(
      dialog.getByRole('button', { name: 'Guardar selección' })
    ).toBeDisabled();
    fireEvent.change(dialog.getByLabelText('Activo'), {
      target: { value: 'r1' },
    });
    expect(
      dialog.getByRole('button', { name: 'Guardar selección' })
    ).toBeDisabled();
    fireEvent.change(dialog.getByLabelText('Medición'), {
      target: { value: 'temp' },
    });
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(dialog.getByRole('button', { name: 'Guardar selección' }));
    expect(onChange).toHaveBeenCalledWith({ assetId: 'r1', conceptId: 'temp' });
  });
  it('discards edits on close and allows explicitly clearing an existing pair', () => {
    const onChange = vi.fn();
    render(
      <VariablePairSelector
        label="Variable B"
        value={{ assetId: 'r1', conceptId: 'temp' }}
        assets={assets}
        concepts={concepts}
        disabled={false}
        loading={false}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar Variable B' }));
    let dialog = within(screen.getByRole('dialog'));
    fireEvent.click(dialog.getByRole('button', { name: 'Limpiar' }));
    fireEvent.click(dialog.getByRole('button', { name: 'Cerrar Variable B' }));
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar Variable B' }));
    dialog = within(screen.getByRole('dialog'));
    expect(dialog.getByLabelText('Medición')).toHaveValue('temp');
    fireEvent.click(dialog.getByRole('button', { name: 'Limpiar' }));
    fireEvent.click(dialog.getByRole('button', { name: 'Guardar selección' }));
    expect(onChange).toHaveBeenCalledWith({ assetId: '', conceptId: '' });
  });
});
