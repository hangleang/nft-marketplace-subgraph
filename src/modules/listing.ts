import { BigInt } from "@graphprotocol/graph-ts";
import { ListingAddedListingStruct } from "../../generated/Marketplace/Marketplace";
import { Collection, Listing } from "../../generated/schema";

import { LISTING_TYPES } from '../constants/listings';

export function createListing(listingID: BigInt, collection: Collection, tokenId: BigInt, listingOutput: ListingAddedListingStruct, currentTimestamp: BigInt): Listing {
    const listing = new Listing(listingID.toString());
    listing.collection = collection.id;
    listing.tokenId = tokenId;
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

    return listing;
}