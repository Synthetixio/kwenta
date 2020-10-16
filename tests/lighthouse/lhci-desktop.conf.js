module.exports = {
	ci: {
		collect: {
			numberOfRuns: 3,
			settings: {
				configPath: 'tests/lighthouse/desktop.conf.js',
				plugins: ['lighthouse-plugin-field-performance', 'lighthouse-plugin-social-sharing'],
				chromeFlags:
					'--headless --no-sandbox --ignore-certificate-errors --disable-gpu --incognito --disable-dev-shm-usage',
			},
			url: [`${process.env.BASE_URL}`, `${process.env.BASE_URL}/exchange`],
		},
		assert: {
			preset: 'lighthouse:no-pwa',
			assertMatrix: [
				{
					matchingUrlPattern: '.*',
					assertions: {
						'categories:accessibility': ['warn', { minScore: 0.9 }],
					},
				},
				{
					matchingUrlPattern: 'https://[^/]+/exchange',
					assertions: {
						'categories:accessibility': ['warn', { minScore: 0.9 }],
					},
				},
			],
		},
		upload: {
			target: 'filesystem',
			githubToken: process.env.GH_TOKEN,
			githubStatusContextSuffix: '-kwenta',
			outputDir: 'lighthouse-desktop-report',
		},
	},
};
