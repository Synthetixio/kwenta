import { gql } from 'graphql-request';

export const query = gql`
	query getShorts($account: String!) {
		shorts(account: $account) {
			id
			contractData {
				issueFeeRate
				canOpenLoans
				minCratio
				minCollateral
				maxLoansPerAccount
				interactionDelay
				manager
			}
			txHash
			account
			collateralLocked
			collateralLockedAmount
			synthBorrowed
			synthBorrowedAmount
			isOpen
			createdAt
			closedAt
			liquidations {
				id
				liquidator
				isClosed
				liquidatedAmount
				liquidatedCollateral
				timestamp
			}
			collateralChanges {
				id
				isDeposit
				amount
				collateralAfter
				timestamp
			}
			loanChanges {
				id
				amount
				isRepayment
				loanAfter
				timestamp
			}
		}
	}
`;
