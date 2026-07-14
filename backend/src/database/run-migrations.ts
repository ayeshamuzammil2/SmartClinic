import { AppDataSource } from './data-source';

AppDataSource.initialize()
  .then(async (ds) => {
    const applied = await ds.runMigrations();
    console.log(`Migrations applied: ${applied.map((m) => m.name).join(', ') || 'none (up to date)'}`);
    await ds.destroy();
  })
  .catch((err) => {
    console.error('Migration failed', err);
    process.exit(1);
  });
