module.exports = {
	globals: {
		// we must specify a custom tsconfig for tests because we need the typescript transform
		// to transform jsx into js rather than leaving it jsx such as the next build requires.  you
		// can see this setting in tsconfig.jest.json -> "jsx": "react"
		'ts-jest': {
			tsConfig: 'tsconfig.jest.json',
		},
	},
	setupFilesAfterEnv: ['./jest.setup.js'],
    testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
	roots: ['<rootDir>'],
	modulePaths: ['node_modules', '<rootDir>'],
	moduleDirectories: ['node_modules', '.'],
	moduleNameMapper: {
		'\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
			'identity-obj-proxy',
		'\\.(css|less)$': 'identity-obj-proxy',
	},
	transform: {
		'^.+\\.(js|jsx|ts|tsx)$': '<rootDir>/node_modules/babel-jest',
		'\\.(css|less|scss|sass)$': 'identity-obj-proxy',
	},
};
