import { FC, useState, useEffect, useMemo, createContext, useContext, ReactNode } from 'react';
import BigNumber from 'bignumber.js';
import { useRecoilValue } from 'recoil';
import Connector from 'containers/Connector';
import { networkState, isL2State, walletAddressState } from 'store/wallet';
import { makeContract as makeL2WETHContract } from 'contracts/L2WETH';
import { toBigNumber } from 'utils/formatters/number';

type ContextTypes = {
	balance: BigNumber;
	showGetL2WETHPromptIfNone: () => boolean;
	showGetWETHPrompt: boolean;
	closeGetWETHPrompt: () => void;
};
const Context = createContext<ContextTypes | null>(null);

type L2GasProviderProps = { children: ReactNode };
export const L2GasProvider: FC<L2GasProviderProps> = ({ children }) => {
	const { provider } = Connector.useContainer();
	const isL2 = useRecoilValue(isL2State);
	const address = useRecoilValue(walletAddressState);
	const network = useRecoilValue(networkState);
	const [showGetWETHPrompt, setShowGetWETHPrompt] = useState<boolean>(false);

	const [balance, setBalance] = useState(toBigNumber(0));

	const wETHContract = useMemo(() => {
		const networkName = network!?.name;
		if (!(isL2 && networkName && provider)) {
			return null;
		}
		return makeL2WETHContract(networkName, provider)!;
	}, [isL2, network, provider]);

	const showGetL2WETHPromptIfNone = () => {
		const show = !!wETHContract && balance.isZero();
		setShowGetWETHPrompt(show);
		return show;
	};

	const closeGetWETHPrompt = () => {
		setShowGetWETHPrompt(false);
	};

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
				if (isMounted) setBalance(toBigNumber(balance).div(1e18));
			} catch (e) {
				console.error(e);
			}
		};

		const subscribe = () => {
			const transferEvent = wETHContract.filters.Transfer();
			const onBalanceChange = async (from: string, to: string) => {
				if (from === address || to === address) {
					if (isMounted) setBalance(await wETHContract.balanceOf(address));
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

	return (
		<Context.Provider
			value={{
				balance,
				showGetL2WETHPromptIfNone,
				showGetWETHPrompt,
				closeGetWETHPrompt,
			}}
		>
			{children}
		</Context.Provider>
	);
};

export const useL2Gas = (): ContextTypes => {
	const context = useContext(Context);
	if (!context) {
		throw new Error('Missing L2Gas context');
	}
	return context;
};
