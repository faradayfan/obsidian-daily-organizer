module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src'],
	testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
	moduleFileExtensions: ['ts', 'js', 'json'],
	collectCoverageFrom: [
		'src/**/*.ts',
		'!src/**/*.d.ts',
		'!src/**/*.test.ts',
		'!src/**/*.spec.ts',
	],
	coverageDirectory: 'coverage',
	coverageReporters: ['text', 'lcov', 'html'],
	moduleNameMapper: {
		'^obsidian$': '<rootDir>/src/__mocks__/obsidian.ts',
	},
	transform: {
		'^.+\\.ts$': ['ts-jest', {
			tsconfig: {
				moduleResolution: 'node',
				esModuleInterop: true,
				allowSyntheticDefaultImports: true,
			}
		}]
	},
};
