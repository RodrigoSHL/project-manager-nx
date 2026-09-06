import { useState } from 'react';
import { assetCatalogApi, type AssetMutationInput } from './asset-catalog-api';
import { useAssetCatalog } from './use-asset-catalog';

export function useAssetAdministration() {
  const catalog = useAssetCatalog();
  const [isMutating, setIsMutating] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);

  async function createAsset(input: AssetMutationInput) {
    if (!catalog.tenantId || !catalog.siteId) return;
    setIsMutating(true);
    setMutationError(null);
    try {
      const createdAsset = await assetCatalogApi.createAsset(
        catalog.tenantId,
        catalog.siteId,
        input
      );
      catalog.refreshAssets();
      return createdAsset;
    } catch (error) {
      setMutationError(errorMessage(error));
      throw error;
    } finally {
      setIsMutating(false);
    }
  }

  async function updateAsset(assetId: string, input: AssetMutationInput) {
    if (!catalog.tenantId || !catalog.siteId) return;
    setIsMutating(true);
    setMutationError(null);
    try {
      const updatedAsset = await assetCatalogApi.updateAsset(
        catalog.tenantId,
        catalog.siteId,
        assetId,
        input
      );
      catalog.refreshAssets();
      return updatedAsset;
    } catch (error) {
      setMutationError(errorMessage(error));
      throw error;
    } finally {
      setIsMutating(false);
    }
  }

  async function deleteAsset(assetId: string) {
    if (!catalog.tenantId || !catalog.siteId) return;
    setIsMutating(true);
    setMutationError(null);
    try {
      const result = await assetCatalogApi.deleteAsset(
        catalog.tenantId,
        catalog.siteId,
        assetId
      );
      catalog.refreshAssets();
      return result;
    } catch (error) {
      setMutationError(errorMessage(error));
      throw error;
    } finally {
      setIsMutating(false);
    }
  }

  return {
    ...catalog,
    createAsset,
    deleteAsset,
    isMutating,
    mutationError,
    updateAsset,
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'No fue posible completar la operación.';
}
