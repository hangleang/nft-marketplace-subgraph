import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";

export const MARKETPLACE_NAME: string = "WTF Marketplace";
export const MARKETPLACE_SLUG: string = "wtf-marketplace";
export const ZERO_BIGINT: BigInt = BigInt.zero();
export const ZERO_DECIMAL: BigDecimal = BigDecimal.zero();
export const HUNDRED_DECIMAL = BigInt.fromI32(100).toBigDecimal();
export const MAX_DECIMAL: BigDecimal = BigInt.fromI32(i32.MAX_VALUE).toBigDecimal();
export const ONE_BIGINT: BigInt = BigInt.fromU32(1);
export const NULL_ADDRESS: Address = Address.zero();
export const UNKNOWN: string = "UNKNOWN";
export const SECONDS_PER_DAY = 24 * 60 * 60;
export const MANTISSA_FACTOR = BigInt.fromI32(10)
  .pow(18 as u8)
  .toBigDecimal();