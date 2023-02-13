import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Marketplace } from "../../generated/schema";
import { ZERO_DECIMAL } from "../constants";

const DEFAULT_ID = "nft-marketplace"

export function createOrLoadMarketplace(currentTimestamp: BigInt): Marketplace {
	let marketplace = Marketplace.load(DEFAULT_ID);

	if (marketplace == null) {
		marketplace = new Marketplace(DEFAULT_ID);
		marketplace.version = 1;

		// initialize statistic
		marketplace.cumulativeTradeVolumeETH = ZERO_DECIMAL;
		marketplace.marketplaceRevenueETH = ZERO_DECIMAL;
		marketplace.creatorRevenueETH = ZERO_DECIMAL;
		marketplace.totalRevenueETH = ZERO_DECIMAL;
	
		// stamping the creation
		marketplace.createdAt = currentTimestamp;
		marketplace.updatedAt = currentTimestamp;
		marketplace.save();
	}

	return marketplace;
}

export function increaseMarketplaceVersion(currentTimestamp: BigInt): void {
  let marketplace = Marketplace.load(DEFAULT_ID);

	if (marketplace != null) {
		marketplace.version += 1;
		marketplace.updatedAt = currentTimestamp
		marketplace.save()
	}
}
