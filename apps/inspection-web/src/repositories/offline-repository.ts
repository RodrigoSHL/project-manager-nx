import { inspectionDb } from '../db/inspection-db';

export const offlineRepository = {
  listSites: () => inspectionDb.offlineSites.toArray(),
  async clear() {
    await inspectionDb.delete();
    await inspectionDb.open();
  },
  async getStats() {
    const [
      assets,
      works,
      templates,
      responses,
      localOnlyWorks,
      modifiedWorks,
      localOnlyResponses,
      modifiedResponses,
      localOnlyAnnotations,
      modifiedAnnotations,
      localOnlyTasks,
      modifiedTasks,
      files,
    ] = await Promise.all([
      inspectionDb.assets.count(),
      inspectionDb.works.count(),
      inspectionDb.formTemplates.count(),
      inspectionDb.conceptResponses.count(),
      inspectionDb.works
        .filter((item) => item.syncStatus === 'LOCAL_ONLY')
        .count(),
      inspectionDb.works
        .filter((item) => item.syncStatus === 'MODIFIED')
        .count(),
      inspectionDb.conceptResponses
        .filter((item) => item.syncStatus === 'LOCAL_ONLY')
        .count(),
      inspectionDb.conceptResponses
        .filter((item) => item.syncStatus === 'MODIFIED')
        .count(),
      inspectionDb.annotations
        .filter((item) => item.syncStatus === 'LOCAL_ONLY')
        .count(),
      inspectionDb.annotations
        .filter((item) => item.syncStatus === 'MODIFIED')
        .count(),
      inspectionDb.taskCompletions
        .filter((item) => item.syncStatus === 'LOCAL_ONLY')
        .count(),
      inspectionDb.taskCompletions
        .filter((item) => item.syncStatus === 'MODIFIED')
        .count(),
      inspectionDb.fileReferences.count(),
    ]);
    return {
      assets,
      works,
      templates,
      responses,
      localOnly:
        localOnlyWorks +
        localOnlyResponses +
        localOnlyAnnotations +
        localOnlyTasks,
      modified:
        modifiedWorks + modifiedResponses + modifiedAnnotations + modifiedTasks,
      files,
    };
  },
};
