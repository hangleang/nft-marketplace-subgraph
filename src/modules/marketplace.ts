import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Marketplace } from "../../generated/schema";
import { ZERO_DECIMAL } from "../constants";

export function createMarketplace(protocolAddress: Address, name: string, slug: string, version: string, currentTimestamp: BigInt): void {
	const marketplace = new Marketplace(protocolAddress.toString());
	marketplace.name 		= name;
	marketplace.slug 		= slug;
	marketplace.version = version;

	// initialize statistic
	marketplace.cumulativeTradeVolumeETH = ZERO_DECIMAL;
	marketplace.cumulativeTradeVolumeUSD = ZERO_DECIMAL;
	marketplace.marketplaceRevenueETH = ZERO_DECIMAL;
	marketplace.marketplaceRevenueUSD = ZERO_DECIMAL;
	marketplace.creatorRevenueETH = ZERO_DECIMAL;
	marketplace.creatorRevenueUSD = ZERO_DECIMAL;
	marketplace.totalRevenueETH = ZERO_DECIMAL;
	marketplace.totalRevenueUSD = ZERO_DECIMAL;

	// stamping the creation
	marketplace.createdAt = currentTimestamp;
	marketplace.updatedAt = currentTimestamp;
	marketplace.save();
}

export function loadMarketplace(protocolAddress: Address): Marketplace | null {
	return Marketplace.load(protocolAddress.toString());
}

export function increaseMarketplaceVersion(protocolAddress: Address, currentTimestamp: BigInt): void {
  let marketplace = Marketplace.load(protocolAddress.toString());

	if (marketplace != null) {
		const version 				= parseInt(marketplace.version) + 1
		marketplace.version 	= version.toString()
		marketplace.updatedAt = currentTimestamp
		marketplace.save()
	}
}
