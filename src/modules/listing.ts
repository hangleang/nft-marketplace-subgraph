import { BigInt } from "@graphprotocol/graph-ts";
import { ListingAddedListingStruct } from "../../generated/Marketplace/Marketplace";
import { Listing, Token } from "../../generated/schema";
import { UNKNOWN } from "../constants";
import { LISTING_TYPES } from '../constants/listings';

export function createListing(listingID: BigInt, token: Token, listingOutput: ListingAddedListingStruct, currentTimestamp: BigInt): void {
    const listing       = new Listing(listingID.toString());
    listing.token       = token.id;
    listing.owner       = listingOutput.tokenOwner.toHex();
    listing.listingType = listingOutput.listingType < LISTING_TYPES.length ? LISTING_TYPES[listingOutput.listingType] : UNKNOWN;

    listing.startTime               = listingOutput.startTime;
    listing.endTime                 = listingOutput.endTime;
    listing.quantity                = listingOutput.quantity;
    listing.availableQty            = listingOutput.quantity;
    listing.currency                = listingOutput.currency;
    listing.reservePricePerToken    = listingOutput.reservePricePerToken;
    listing.buyoutPricePerToken     = listingOutput.buyoutPricePerToken;

    listing.createdAt               = currentTimestamp;
    listing.updatedAt               = currentTimestamp;
    listing.save();
}