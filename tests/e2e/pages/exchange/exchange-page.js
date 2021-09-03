/* eslint-disable ui-testing/no-hard-wait */
/* eslint-disable cypress/no-unnecessary-waiting */
import Page from '../page';
import Header from './header';
import Notifications from './notifications';
import Onboard from './onboard';

export default class ExchangePage extends Page {
	constructor() {
		super();
		this.header = new Header();
		this.onboard = new Onboard();
		this.notifications = new Notifications();
	}

	getCurrencyAmount() {
		return cy.findByTestId('left-side').findByTestId('currency-amount');
	}

	getSubmitOrderBtn() {
		return cy.findByTestId('submit-order');
	}

	visit(pair) {
		if (pair) {
			cy.visit(`/exchange/${pair}`);
		} else {
			cy.visit('/exchange');
		}
	}

	connectBrowserWallet() {
		const connectWalletButton = this.header.getConnectWalletBtn();
		connectWalletButton.click();
		const onboardBrowserWalletButton = this.onboard.getBrowserWalletBtn();
		onboardBrowserWalletButton.click();
	}

	waitUntilLoggedIn() {
		cy.waitUntil(() => {
			const walletButton = this.header.getWalletButton();
			return walletButton.should('exist');
		});
		// waiting for wallet button is not enough in rare cases to be logged in
		cy.wait(2000);
	}

	getLoggedInWalletAddress() {
		const walletButton = this.header.getWalletButton();
		return walletButton.invoke('text');
	}

	waitForTransactionSuccess() {
		cy.waitUntil(
			() => {
				const txSuccessNotification = this.notifications.getTransactionSuccessNotification();
				return txSuccessNotification.should('exist');
			},
			{
				timeout: 60000,
			}
		);
	}

	getTransactionId() {
		let txUrl;
		cy.window().then((win) => {
			cy.stub(win, 'open')
				.as('windowOpen')
				.callsFake((url) => {
					txUrl = url;
				});
		});

		this.notifications.getTransactionSuccessNotification().click();
		cy.get('@windowOpen').should('be.called');

		const getTxIdFromUrl = () => {
			const txId = txUrl.split('tx/')[1];
			return txId;
		};

		return cy.wrap({ txId: getTxIdFromUrl }).invoke('txId');
	}

	interceptSynthetixRates() {
		cy.intercept('https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix-rates').as(
			'synthetixRates'
		);
	}

	waitForSynthetixRates() {
		cy.wait('@synthetixRates').then((interception) => {
			assert.isNotNull(interception.response.body, 'synthetixRates has data');
		});
	}
}
