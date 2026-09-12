import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{js,jsx}'],
    environment: 'node',
    // The API tests own a SQLite file, so keep test files serialized. The forks
    // pool tears the process environment down while better-sqlite3 statements
    // are still being finalized (SIGABRT in Statement::~Statement), so run in
    // worker threads instead.
    fileParallelism: false,
    pool: 'threads',
  },
});
