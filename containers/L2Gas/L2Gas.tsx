import { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import { createContainer } from 'unstated-next';
import { useRecoilValue } from 'recoil';
import Connector from 'containers/Connector';
import { networkState, isL2State, walletAddressState } from 'store/wallet';
import { Network } from '@synthetixio/contracts-interface';
import { makeContract as makeL2WETHContract } from 'contracts/L2WETH';
import { toBigNumber } from 'utils/formatters/number';

const MakeContainer = () => {
	const { provider } = Connector.useContainer();
	const isL2 = useRecoilValue(isL2State);
	const address = useRecoilValue(walletAddressState);
	const network = useRecoilValue(networkState);

	const [balance, setBalance] = useState(toBigNumber(0));

	const wETHContract = useMemo(() => {
		const networkName = network!?.name;
		if (!(isL2 && networkName && networkName !== Network['Kovan-Ovm'] && provider)) {
			return null;
		}
		return makeL2WETHContract(networkName, provider)!;
	}, [isL2, network, provider]);

	const hasNoBalance = useMemo(() => !!wETHContract && balance.isZero(), [wETHContract, balance]);

	useEffect(() => {
		if (!(wETHContract && address)) return;

		let isMounted = true;
		const unsubs = [
			() => {
				isMounted = false;
			},
		];

		const loadBalance = async () => {
			try {
				const balance = await wETHContract.balanceOf(address);
				if (isMounted) setBalance(toBigNumber(ethers.utils.formatEther(balance)));
			} catch (e) {
				console.error(e);
			}
		};

		const subscribe = () => {
			const transferEvent = wETHContract.filters.Transfer();
			const onBalanceChange = async (from: string, to: string) => {
				if (from === address || to === address) {
					loadBalance();
				}
			};

			wETHContract.on(transferEvent, onBalanceChange);
			unsubs.push(() => {
				wETHContract.off(transferEvent, onBalanceChange);
			});
		};

		loadBalance();
		subscribe();

		return () => {
			unsubs.forEach((unsub) => unsub());
		};
	}, [wETHContract, address]);

	return {
		gas: balance,
		hasNone: hasNoBalance,
	};
};

const Container = createContainer(MakeContainer);

export default Container;
