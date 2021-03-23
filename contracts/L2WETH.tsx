import { ethers } from 'ethers';

export const ADDRESSES: Record<string, string> = {
	'mainnet-ovm': '0x4200000000000000000000000000000000000006',
	'kovan-ovm': '0x4200000000000000000000000000000000000006',
};

export function makeContract(
	network: string,
	signer: ethers.Signer | ethers.providers.Provider
): ethers.Contract | null {
	const address = ADDRESSES[network];
	return !(address && signer) ? null : new ethers.Contract(address, ABI, signer);
}

export const ABI = [
	{
		constant: true,
		inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
		name: 'balanceOf',
		outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
		payable: false,
		stateMutability: 'view',
		type: 'function',
	},
];
