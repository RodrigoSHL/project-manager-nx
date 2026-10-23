import {
  ImportData,
  importSchema,
  UserProfile,
  DailyLog,
} from '@project-manager/macrofit-contracts';

// Compatibility reader only. Active personal records are never written to browser storage.
export function accountKey(userId: string, key: string) {
  return `macrofit:${encodeURIComponent(userId)}:${key}`;
}
function localRecords(userId: string) {
  const prefix = `macrofit:${encodeURIComponent(userId)}:`;
  const owner = localStorage.getItem('macrofit_legacy_owner');
  return Object.keys(localStorage)
    .flatMap((key) => {
      const name = key.startsWith(prefix)
        ? key.slice(prefix.length)
        : !owner || owner === userId
        ? key
        : '';
      return /^(macrofit_(profile|goals|custom_foods|custom_templates)|macrofit_log_\d{4}-\d{2}-\d{2})$/.test(
        name
      )
        ? [{ key, name, value: localStorage.getItem(key)! }]
        : [];
    })
    .sort(
      (a, b) =>
        Number(a.key.startsWith(prefix)) - Number(b.key.startsWith(prefix))
    );
}
export function canImportLegacy(userId: string) {
  try {
    return localRecords(userId).length > 0;
  } catch {
    return false;
  }
}
export function readLegacyData(userId: string): {
  data: ImportData;
  originals: Map<string, string>;
} {
  const originals = new Map<string, string>();
  const records = new Map<string, unknown>();
  for (const record of localRecords(userId)) {
    originals.set(record.key, record.value);
    records.set(record.name, JSON.parse(record.value));
  }
  const profile = records.get('macrofit_profile') as
    | Partial<UserProfile>
    | undefined;
  const goals = records.get('macrofit_goals');
  const demoProfile =
    profile?.name === 'Paciente MEDS' &&
    profile.age === 28 &&
    profile.gender === 'male' &&
    profile.weightKg === 75 &&
    profile.heightCm === 175 &&
    profile.activityLevel === 'moderate' &&
    profile.goal === 'meds_pauta';
  const data = importSchema.parse({
    // The previous default profile was fictional and must never become a real profile.
    ...(profile && goals && !demoProfile
      ? { settings: { profile, goals } }
      : {}),
    foods: records.get('macrofit_custom_foods') ?? [],
    templates: records.get('macrofit_custom_templates') ?? [],
    logs: [...records]
      .filter(([key]) => key.startsWith('macrofit_log_'))
      .map(([, value]) => {
        const log = value as DailyLog;
        const hasExamples = log.meals.some((meal) =>
          meal.id.startsWith('seed-')
        );
        return {
          ...log,
          meals: log.meals.filter((meal) => !meal.id.startsWith('seed-')),
          waterIntakeMl: hasExamples ? 0 : log.waterIntakeMl,
        };
      }),
  });
  return { data, originals };
}
