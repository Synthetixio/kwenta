/* eslint-disable cypress/no-unnecessary-waiting */
/* eslint-disable ui-testing/no-hard-wait */

export default class Page {
	getTitle() {
		return cy.title();
	}

	getMetamaskWalletAddress() {
		return cy.fetchMetamaskWalletAddress();
	}

	acceptMetamaskAccessRequest() {
		cy.acceptMetamaskAccess();
	}

	confirmMetamaskTransaction() {
		cy.confirmMetamaskTransaction();
	}

	snxExchangerSettle(asset) {
		return cy.snxExchangerSettle(asset);
	}

	snxCheckWaitingPeriod(asset) {
		cy.snxCheckWaitingPeriod(asset);
	}

	etherscanWaitForTxSuccess(txid) {
		return cy.etherscanWaitForTxSuccess(txid);
	}
}
