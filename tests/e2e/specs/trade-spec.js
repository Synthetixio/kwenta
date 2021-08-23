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
			exchange.interceptSynthetixRates();
			exchange.visit(`${testedAsset}-sUSD`);
			exchange.waitForSynthetixRates();
			exchange.connectBrowserWallet();
			exchange.acceptMetamaskAccessRequest();
			exchange.waitUntilLoggedIn();
		});
		it(`should exchange with success`, () => {
			exchange.getCurrencyAmount().type('1');
			exchange.getSubmitOrderBtn().click();
			exchange.confirmMetamaskTransaction();
			exchange.waitForTransactionSuccess();
			exchange.getTransactionUrl().then((url) => {
				const txId = url.split('tx/')[1];
				exchange.etherscanWaitForTxSuccess(txId);
				expect(txId).to.have.lengthOf(66);
			});
		});
	});
});
