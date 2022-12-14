import { ethereum, Bytes } from '@graphprotocol/graph-ts'

/// from openzeppelin-subgraph
export function supportsInterface(contract: ethereum.SmartContract, interfaceId: String, expected: boolean = true): boolean {
	let result = ethereum.call(new ethereum.SmartContractCall(
		contract._name,      // '',
		contract._address,   // address,
		'supportsInterface', // '',
		'supportsInterface(bytes4):(bool)',
		[ethereum.Value.fromFixedBytes(Bytes.fromHexString(interfaceId.toString()) as Bytes)]
	))

	return result != null && (result as Array<ethereum.Value>)[0].toBoolean() == expected
}
