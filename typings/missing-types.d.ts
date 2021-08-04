declare module 'synthetix-data';
declare module '@synthetixio/providers';
declare module '@synthetixio/optimism-networks';
declare module 'moment-business-time';
declare module '@synthetixio/wei' {
	export declare const WEI_PRECISION = 18;
	export declare type WeiSource = Wei | number | string | BigNumber | Big;
	/**
	 * A numeric value in Wei. This enables arithmetic to be performed on Wei types without needing
	 * to convert them to a decimal value in-between.
	 *
	 * @warning ALL Arithmetic and Comparison operations assume non-Wei values if they are passed any
	 * source material which is not an instance of `Wei`. If you have a Number/string/BN/Big which is
	 * already in Wei and you would like to operate with it correctly, you must first construct a new
	 * Wei value from it using `new Wei(numberinwei, true)` which is NOT the default behavior,
	 * even for BN types.
	 */
	export default class Wei {
		static is(w: unknown): w is Wei;
		static min(a: Wei, ...args: Wei[]): Wei;
		static max(a: Wei, ...args: Wei[]): Wei;
		static avg(a: Wei, ...args: Wei[]): Wei;
		/** Value */
		private readonly v;
		/** Decimals (usually WEI_PRECISION) */
		private readonly p;
		get z(): BigNumber;
		/**
		 * Create a (lazy as possible) clone of the source. For some types this means no memory copy will
		 * need to happen while for others it will. This should only be used for converting RHS parameters
		 * which are needed in a known form. Should probably only be used by the `Wei.from` function.
		 *
		 * @param n Source material
		 * @param p The number of decimal places to scale by. If you are working with Ether or Synth, leave this as default
		 * @param isWei if false or unspecfiied, automatically scale any value to `p` places. If n is a BigNumber, this is ignored.
		 */
		constructor(n: WeiSource, p?: number, isWei?: boolean);
		/**
		 * Creates a new version of the Wei object with a new precision
		 * Note: if p is less than the current p, precision may be lost.
		 * @param p new decimal places precision
		 * @returns new Wei value with specified decimal places
		 */
		scale(p: number): Wei;
		/**
		 * Write the value as a string.
		 *
		 * @param asWei If true, then returns the scaled integer value, otherwise converts to a floating point value
		 * @param dp Decimal places to use when not printing as Wei
		 * @returns The value as a string
		 * @memberof Wei
		 */
		toString(dp?: number, asWei?: boolean): string;
		/** The unscaled value as a string. */
		get str(): string;
		/**
		 * Write the value in Wei as a padded string which can be used for sorting.
		 * Will convert it to base64 to reduce the string length and make comparisons less costly.
		 *
		 * @returns Resulting string which can be used to sort multiple wei numbers.
		 * @memberof Wei
		 */
		toSortable(): string;
		/**
		 * Convert the value of this to a BN type. This will always return the value as a scaled Wei
		 * integer. If you wish to convert it, simply take the result and divide by `Z`
		 *
		 * @returns The value (in Wei) as a BigNumber
		 * @memberof Wei
		 */
		toBN(): BigNumber;
		/** The scaled value as a BN */
		get bn(): BigNumber;
		/**
		 * Convert the value of this to a Big type.
		 *
		 * @param asWei If true, then returns the scaled integer value, otherwise converts to a floating point value.
		 * @returns The value as a Big type (either in Wei or not)
		 * @memberof Wei
		 */
		toBig(asWei?: boolean): Big;
		/** The unscaled value as a Big */
		get big(): Big;
		/**
		 * Convert the value to a JS number type.
		 *
		 * @param {boolean} [asWei=false] By default will convert to a floating point which should preserve accuracy of the most significant digits. Otherwise try to represent as an integer Wei value.
		 * @returns {number} The value as a number type (or as close as it can represent).
		 * @memberof Wei
		 */
		toNumber(asWei?: boolean): number;
		/** The unscaled value as a number */
		get num(): number;
		neg(): Wei;
		abs(): Wei;
		div(other: WeiSource): Wei;
		sub(other: WeiSource): Wei;
		add(other: WeiSource): Wei;
		mul(other: WeiSource): Wei;
		pow(p: number): Wei;
		inv(): Wei;
		cmp(other: WeiSource): number;
		eq(other: WeiSource): boolean;
		/**
		 * Fuzzy equality comparison. If passing a number, assumes it is not in Wei, so 1e-18 == 1 wei.
		 *
		 * @param other Value to compare against
		 * @param fuzz Tolerance for equality
		 * @returns True if other is within `fuzz` tolerance of this value.
		 * @memberof Wei
		 */
		feq(other: WeiSource, fuzz: WeiSource): boolean;
		gt(other: WeiSource): boolean;
		gte(other: WeiSource): boolean;
		lt(other: WeiSource): boolean;
		lte(other: WeiSource): boolean;
	}
	/** convenience function for not writing `new Wei(s)` every time. */
	export declare function wei(s: WeiSource, p?: number, isWei?: boolean): Wei;
}
