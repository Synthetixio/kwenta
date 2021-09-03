import ExchangePage from '../pages/exchange/exchange-page';

const exchange = new ExchangePage();
const testedAsset = 'sETH';

describe('Trades tests', () => {
	context(`Trade sUSD => ${testedAsset}`, () => {
		before(() => {
			exchange.snxExchangerSettle(testedAsset).then((settleTxId) => {
				if (settleTxId) {
					exchange.etherscanWaitForTxSuccess(settleTxId);
				}
			});
			exchange.snxCheckWaitingPeriod(testedAsset);
			exchange.visit(`${testedAsset}-sUSD`);
			exchange.connectBrowserWallet();
			exchange.acceptMetamaskAccessRequest();
			exchange.waitUntilLoggedIn();
		});
		it(`should exchange with success`, () => {
			exchange.getCurrencyAmount().type('1');
			exchange.getSubmitOrderBtn().click();
			exchange.confirmMetamaskTransaction();
			exchange.waitForTransactionSuccess();
			exchange.getTransactionId().then((txId) => {
				exchange.etherscanWaitForTxSuccess(txId);
				expect(txId).to.have.lengthOf(66);
			});
		});
	});
});
