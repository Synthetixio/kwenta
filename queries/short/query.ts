import { gql } from 'graphql-request';

export const shortsQuery = gql`
	query shorts($account: String!) {
		shorts(first: 100, where: { account: $account }, orderBy: id, orderDirection: desc) {
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
			accruedInterestLastUpdateTimestamp
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
				blockNumber
			}
			collateralChanges {
				id
				isDeposit
				amount
				collateralAfter
				timestamp
				blockNumber
			}
			loanChanges {
				id
				amount
				isRepayment
				loanAfter
				timestamp
				blockNumber
			}
		}
	}
`;

export const shortContractQuery = gql`
	query shortContracts($id: String!) {
		shortContracts(first: 1, where: { id: $id }) {
			id
			issueFeeRate
			canOpenLoans
			minCratio
			minCollateral
			maxLoansPerAccount
			interactionDelay
			manager
			contractUpdates {
				id
				field
				value
				timestamp
				blockNumber
			}
		}
	}
`;

export const ratesAtBlockQuery = gql`
	query latestRates($synth: String!, blockNumber: Number!) {
		latestRates(first: 1, block: { number: $blockNumber } where: { id: $synth }) {
			id
			rate
		}
	}
`;
