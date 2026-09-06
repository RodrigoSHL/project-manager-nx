import type { Tenant } from '../features/assets/models';

type CatalogTenantSelectorProps = {
  tenants: Tenant[];
  tenantId: string;
  onChange: (tenantId: string) => void;
};

export function CatalogTenantSelector({
  tenants,
  tenantId,
  onChange,
}: CatalogTenantSelectorProps) {
  return (
    <label className="block max-w-md text-sm font-medium text-slate-700">
      Tenant / Empresa
      <select
        value={tenantId}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      >
        {tenants.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name}
          </option>
        ))}
      </select>
    </label>
  );
}
