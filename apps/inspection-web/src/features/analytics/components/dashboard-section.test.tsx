import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DashboardSection } from './dashboard-section';

describe('mobile analysis sections', () => {
  it('defers rendering analysis until expanded and preserves its context', () => {
    render(
      <DashboardSection
        title="Actividad"
        state={{ data: [5], loading: false, error: null }}
        isEmpty={(data) => !data.length}
      >
        {(data) => <p>{data[0]} trabajos del período</p>}
      </DashboardSection>
    );
    expect(
      screen.queryByText('5 trabajos del período')
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Actividad' }));
    expect(screen.getByText('5 trabajos del período')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Actividad' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  it('keeps an error indicator visible while the details are collapsed', () => {
    render(
      <DashboardSection
        title="Actividad"
        state={{ data: null, loading: false, error: 'No fue posible cargar' }}
        isEmpty={() => true}
      >
        {() => <p>Datos</p>}
      </DashboardSection>
    );
    expect(screen.getByText('No disponible')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Actividad No disponible' })
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'No fue posible cargar'
    );
  });
});
