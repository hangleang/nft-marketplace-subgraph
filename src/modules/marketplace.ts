import { BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Marketplace, MarketplaceDailySnapshot } from "../../generated/schema";
import { SECONDS_PER_DAY, ZERO_BIGINT, ZERO_DECIMAL } from "../constants";

const DEFAULT_ID = "nft-marketplace"

export function createOrLoadMarketplace(currentTimestamp: BigInt): Marketplace {
	let marketplace = Marketplace.load(DEFAULT_ID);

	if (marketplace == null) {
		marketplace = new Marketplace(DEFAULT_ID);
		marketplace.version 		= 1;
		marketplace.platformFee = ZERO_DECIMAL;
		marketplace.bidBuffer 	= ZERO_DECIMAL;
		marketplace.timeBuffer 	= ZERO_BIGINT;

		// initialize statistic
		marketplace.cumulativeTradeVolumeETH = ZERO_DECIMAL;
		marketplace.marketplaceRevenueETH = ZERO_DECIMAL;
		marketplace.creatorRevenueETH = ZERO_DECIMAL;
		marketplace.totalRevenueETH = ZERO_DECIMAL;
	
		// stamping the creation
		marketplace.createdAt 	= currentTimestamp;
		marketplace.updatedAt 	= currentTimestamp;
		marketplace.save();
	}

	return marketplace;
}

export function increaseMarketplaceVersion(currentTimestamp: BigInt): void {
  let marketplace = Marketplace.load(DEFAULT_ID);

	if (marketplace != null) {
		marketplace.version 	+= 1;
		marketplace.updatedAt = currentTimestamp
		marketplace.save()
	}
}

export function getOrCreateMarketplaceDailySnapshot(
	marketplace: Marketplace,
  timestamp: BigInt
): MarketplaceDailySnapshot {
  const snapshotID = (timestamp.toI32() / SECONDS_PER_DAY).toString();
  let snapshot = MarketplaceDailySnapshot.load(snapshotID);
  if (!snapshot) {
    snapshot = new MarketplaceDailySnapshot(snapshotID);
    snapshot.marketplace = marketplace.id;
    snapshot.blockNumber = ZERO_BIGINT;
    snapshot.timestamp = ZERO_BIGINT;
    snapshot.cumulativeTradeVolumeETH = ZERO_DECIMAL;
    snapshot.marketplaceRevenueETH = ZERO_DECIMAL;
    snapshot.creatorRevenueETH = ZERO_DECIMAL;
    snapshot.totalRevenueETH = ZERO_DECIMAL;
    snapshot.save();
  }
  return snapshot;
}