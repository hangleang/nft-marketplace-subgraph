import { BigInt } from "@graphprotocol/graph-ts";
import { ListingAddedListingStruct } from "../../generated/Marketplace/Marketplace";
import { Listing } from "../../generated/schema";

import { LISTING_TYPES } from '../constants/listings';

export function createListing(listingID: BigInt, tokenUID: string, listingOutput: ListingAddedListingStruct, currentTimestamp: BigInt): void {
    const listing = new Listing(listingID.toString());
    listing.token = tokenUID;
    listing.owner = listingOutput.tokenOwner.toHex();
    listing.listingType = LISTING_TYPES[listingOutput.listingType];

    listing.startTime = listingOutput.startTime;
    listing.endTime = listingOutput.endTime;
    listing.quantity = listingOutput.quantity;
    listing.availableQty = listingOutput.quantity;
    listing.currency = listingOutput.currency;
    listing.reservePricePerToken = listingOutput.reservePricePerToken;
    listing.buyoutPricePerToken = listingOutput.buyoutPricePerToken;

    listing.createdAt = currentTimestamp;
    listing.updatedAt = currentTimestamp;
    listing.save();
}