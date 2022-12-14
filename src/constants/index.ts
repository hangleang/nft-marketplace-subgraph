import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export const ZERO_BIGINT: BigInt = BigInt.zero();
export const ZERO_DECIMAL: BigDecimal = BigDecimal.zero();
export const ONE_BIGINT: BigInt = BigInt.fromU32(1);
export const NULL_ADDRESS: Address = Address.zero();
export const STATS_POSTFIX: string = "stats";