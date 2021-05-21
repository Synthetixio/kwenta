module.exports = {
	setupFilesAfterEnv: ['./jest.setup.js'],
	testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
	roots: ['<rootDir>'],
	modulePaths: ['node_modules', '<rootDir>'],
	moduleDirectories: ['node_modules', '.'],
	moduleFileExtensions: ['ts', 'tsx', 'js'],
	transform: {
		'^.+\\.(js|jsx|ts|tsx)?$': 'ts-jest',
	},
	testMatch: ['**/*.(test|spec).(ts|tsx)'],
	globals: {
		'ts-jest': {
			babelConfig: true,
			tsconfig: 'jest.tsconfig.json',
		},
	},
	coveragePathIgnorePatterns: ['/node_modules/'],
	coverageReporters: ['json', 'lcov', 'text', 'text-summary'],
	moduleNameMapper: {
		'\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
			'<rootDir>/__mocks__/mocks.js',
		'\\.(css|less)$': '<rootDir>/__mocks__/mocks.js',
	},
};
