import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { MobileNavigation } from './mobile-navigation';

describe('mobile navigation', () => {
  it('keeps Trabajos active on execution and report routes and opens More without navigating away', () => {
    const onMore = vi.fn();
    render(
      <MemoryRouter initialEntries={['/works/work-1/report?tenantId=a']}>
        <MobileNavigation open={false} onMore={onMore} />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Trabajos' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(screen.getByRole('link', { name: 'Resumen' })).not.toHaveAttribute(
      'aria-current'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Más opciones' }));
    expect(onMore).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: 'Trabajos' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });
});
