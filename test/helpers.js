/**
 * generates a random hex string with given length
 * @param length text string length
 */
const getRandomHex = (length = 40) => {
	let text = "";
	const possible = "abcdef0123456789";
	for (let i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}

	return text;
};

/**
 * generates a sequence of random Ethereum addresses
 * @example
 * const gen = getRandomEthereumAddress();
 * console.log(ethereumAddressGen.next().value); //0x90dab67ffff1ffffffffffffffffffffffffffff
 * console.log(ethereumAddressGen.next().value); //0x90dab67ffff2ffffffffffffffffffffffffffff
 * console.log(ethereumAddressGen.next().value); //0x90dab67ffff3ffffffffffffffffffffffffffff  ... and so on
 */
function * getRandomEthereumAddress (skip = false) {
	const oneTimeRandNumbers = getRandomHex(7);
	let i = 0;

	while (true) {
		if (!skip) {
			i++;
		}
		yield `0x${oneTimeRandNumbers}ffff${i.toString(10).padEnd(29, "f")}`;
	}
}

module.exports = {
	getRandomEthereumAddress,
	getRandomHex
};
