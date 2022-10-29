export const getRandomCurrency = (): string => {
	// NOTE: This can be fixed once `@types/node` is updated.
	// `.supportedValuesOf` is actually an available method in Intl (at least on Node.js v18.x AFAICT).
	// @ts-expect-error -- The `Intl` module's typings are not up-to-date.
	const currencies = Intl.supportedValuesOf('currency');
	return currencies[Math.floor(Math.random() * currencies.length)];
};
