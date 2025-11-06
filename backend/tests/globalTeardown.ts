export default async function globalTeardown() {
  // Restore original database URL
  if ((global as any).__ORIGINAL_DB_URL__) {
    process.env.DATABASE_URL = (global as any).__ORIGINAL_DB_URL__;
  }
  
  console.log('Test database teardown complete');
}