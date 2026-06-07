/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: '.',
    testMatch: ['<rootDir>/tests/integration/**/*.test.ts'],
    setupFiles: ['<rootDir>/tests/setup-env.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    transform: {
        '^.+\\.ts$': ['ts-jest', { isolatedModules: true }],
    },
    testTimeout: 30000,
    maxWorkers: 1,
};
