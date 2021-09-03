//
import Page from '../page';
export default class Notifications extends Page {
	getTransactionSuccessNotification() {
		return cy.findByTestId('notification-success', { timeout: 60000 });
	}
	getTransactionPendingNotification() {
		return cy.findByTestId('notification-pending', { timeout: 60000 });
	}
	getTransactionErrorNotification() {
		return cy.findByTestId('notification-error', { timeout: 60000 });
	}
}
