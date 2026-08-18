const seedMigrationPattern = /(?:^|_)(?:seed|catalog)(?:_|$)/i;

export function shouldRunMigration(version: string, runSeedData: boolean): boolean {
  return runSeedData || !seedMigrationPattern.test(version);
}
