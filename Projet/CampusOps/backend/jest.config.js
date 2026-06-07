/** @type {import('jest').Config} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    rootDir: '.',
    testMatch: ['<rootDir>/src/**/*.test.ts', '<rootDir>/tests/unit/**/*.test.ts'],
    setupFiles: ['<rootDir>/tests/setup-env.ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    transform: {
        '^.+\\.ts$': ['ts-jest', { isolatedModules: true }],
    },
    clearMocks: true,
};
