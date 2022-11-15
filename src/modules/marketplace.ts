import { BigInt } from "@graphprotocol/graph-ts";
import { Marketplace } from "../../generated/schema";

export const DEFAULT_ID = 'all'

export function createMarketplace(currentTimestamp: BigInt): Marketplace {
    const marketplace = new Marketplace(DEFAULT_ID);
    marketplace.version = 1;
    marketplace.createdAt = currentTimestamp;
    marketplace.updatedAt = currentTimestamp;
    marketplace.save();
    return marketplace;
}

export function createOrLoadMarketplace(currentTimestamp: BigInt): Marketplace {
    let marketplace = Marketplace.load(DEFAULT_ID);

    if (!marketplace) {
        marketplace = createMarketplace(currentTimestamp);
    }

    return marketplace;
}

export function increaseMarketplaceVersion(currentTimestamp: BigInt): void {
    let marketplace = createOrLoadMarketplace(currentTimestamp);

    marketplace.version += 1;
    marketplace.updatedAt = currentTimestamp;
    marketplace.save();
}