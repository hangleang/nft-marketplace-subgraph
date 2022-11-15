import {
  AuctionClosed,
  Initialized,
  ListingAdded,
  ListingRemoved,
  ListingUpdated,
  Marketplace,
  NewOffer,
  NewSale,
  Upgraded
} from "../generated/Marketplace/Marketplace"
import { createActivity } from "./modules/activity";
import { createListing } from "./modules/listing";
import { createMarketplace, increaseMarketplaceVersion } from "./modules/marketplace"

import * as activities from './constants/activities';
import { createOrUpdateTokenBalance, generateTokenUID } from "./modules/token";
import { Listing, Offer, Sale, Token } from "../generated/schema";
import { AUCTION, LISTING_TYPES } from "./constants/listings";
import { generateUID } from "./utils";
import { ZERO_BIGINT } from "./constants";
import { updateCollectionStats, updateCollectionStatsList } from "./modules/collection";
import { Address, Bytes } from "@graphprotocol/graph-ts";

export function handleAuctionClosed(event: AuctionClosed): void {
  // init local vars from event params
  const currentBlock = event.block;
  const listingID = event.params.listingId.toString();
  const isCancelled = event.params.cancelled;
  const closer = event.params.closer;

  // load/check listing by listingID
  const listing = Listing.load(listingID);
  if (listing) {
    listing.isCancelled = isCancelled;
    listing.closedAt = currentBlock.timestamp;
    listing.save();

    // load/check token by tokenUID
    const token = Token.load(listing.token);
    if (!token) return;

    // update collection stats listed amount
    updateCollectionStatsList(Address.fromString(token.collection), listing.availableQty, false);

    // create close auction activity entity
    createActivity(activities.CLOSE_AUCTION, currentBlock, event.transaction, token, null, closer, null);
  }
}

export function handleInitialized(event: Initialized): void {
  createMarketplace(event.block.timestamp);
}

export function handleListingAdded(event: ListingAdded): void {
  // init local vars from event params
  const currentBlock = event.block;
  const collection = event.params.assetContract;
  const lister = event.params.lister;
  const listingID = event.params.listingId;
  const listing = event.params.listing;
  const tokenUID = generateTokenUID(collection, listing.tokenId);

  // load/check token by tokenUID
  const token = Token.load(tokenUID);
  if (!token) return;

  // create listing entity from given params, also update token balance if auction listing
  createListing(listingID, tokenUID, listing, currentBlock.timestamp);
  if (LISTING_TYPES[listing.listingType] == AUCTION) {
    createOrUpdateTokenBalance(tokenUID, lister, listing.quantity, false);
  }

  // increase collection stats listed amount
  updateCollectionStatsList(collection, listing.quantity, true);

  // create list activity entity
  createActivity(activities.LIST, currentBlock, event.transaction, token, null, lister, null, listing.quantity, listing.currency, listing.buyoutPricePerToken);
}

export function handleListingRemoved(event: ListingRemoved): void {
  // init local vars from event params
  const currentBlock = event.block;
  const listingID = event.params.listingId;
  const owner = event.params.listingCreator;

  // load/check listing by listingID
  const listing = Listing.load(listingID.toString());
  if (!listing) return;
  if (listing.listingType == AUCTION) {
    createOrUpdateTokenBalance(listing.token, owner, listing.quantity, true);
  }

  // load/check token by tokenUID
  const token = Token.load(listing.token);
  if (!token) return;

  listing.removedAt = currentBlock.timestamp;
  listing.save();

  // decrease collection stats listed amount
  updateCollectionStatsList(Address.fromString(token.collection), listing.quantity, false);

  // create list activity entity
  createActivity(activities.UNLIST, currentBlock, event.transaction, token, null, owner, null, listing.quantity, listing.currency, listing.buyoutPricePerToken);
}

export function handleListingUpdated(event: ListingUpdated): void {
  // init local vars from event params
  const currentBlock = event.block;
  const listingID = event.params.listingId;
  const owner = event.params.listingCreator;
  const listingStruct = Marketplace.bind(event.address).listings(listingID);
  
  // load/check listing by listingID
  const listing = Listing.load(listingID.toString());
  if (!listing) return;

  // load/check token by tokenUID
  const token = Token.load(listing.token);
  if (!token) return;

  const updatedQty = listingStruct.getQuantity();
  const prevQty = listing.quantity;
  if (updatedQty != prevQty) {
    const isAddUp = updatedQty > prevQty;
    const qtyDiff = updatedQty.minus(prevQty).abs();

    // update collection stats listed amount
    const collectionAddress = Address.fromString(token.collection);
    updateCollectionStatsList(collectionAddress, qtyDiff, isAddUp);

    if (listing.listingType == AUCTION) {
      createOrUpdateTokenBalance(listing.token, owner, qtyDiff, isAddUp);
    }
  }
  
  listing.startTime = listingStruct.getStartTime();
  listing.endTime = listingStruct.getEndTime();
  listing.quantity = updatedQty;
  listing.availableQty = updatedQty;
  listing.currency = listingStruct.getCurrency();
  listing.reservePricePerToken = listingStruct.getReservePricePerToken();
  listing.buyoutPricePerToken = listingStruct.getBuyoutPricePerToken();
  listing.updatedAt = currentBlock.timestamp;
  listing.save();  

  // create update listing activity entity
  createActivity(activities.UPDATE_LISTING, currentBlock, event.transaction, token, null, owner, null, listing.quantity, listing.currency, listing.buyoutPricePerToken);
}

export function handleNewOffer(event: NewOffer): void {
  // init local vars from event params
  const currentBlock = event.block;
  const tx = event.transaction;
  const listingID = event.params.listingId.toString();
  const offeror = event.params.offeror;
  const quantity = event.params.quantityWanted;
  const currency = event.params.currency;
  const offerAmount = event.params.totalOfferAmount;
  const expiredTimestamp = event.params.expiredTimestamp;

  // load/check listing by listingID
  const listing = Listing.load(listingID);
  if (!listing) return;

  // load/check token by tokenUID
  const token = Token.load(listing.token);
  if (!token) return;

  // init offer entity by tx hash
  const offerUID = generateUID([listingID, offeror.toHex()]);
  const offer = new Offer(offerUID);
  offer.listing = listingID;
  offer.offeror = offeror.toHex();
  offer.quantity = quantity;
  offer.currency = currency;
  offer.offerAmount = offerAmount;
  offer.expiredTimestamp = expiredTimestamp;
  offer.txHash = tx.hash;
  offer.timestamp = currentBlock.timestamp;
  offer.save();

  // create update listing activity entity
  createActivity(activities.MAKE_OFFER, currentBlock, tx, token, null, offeror, null, quantity, currency, offerAmount);
}

export function handleNewSale(event: NewSale): void {
  // init local vars from event params
  const currentBlock = event.block;
  const tx = event.transaction;
  const collection = event.params.assetContract;
  const listingID = event.params.listingId.toString();
  const seller = event.params.lister;
  const buyer = event.params.buyer;
  const quantity = event.params.quantityBought;
  const totalPaid = event.params.totalPricePaid;

  // load/check listing by listingID
  const listing = Listing.load(listingID);
  if (!listing) return;

  // load/check token by tokenUID
  const token = Token.load(listing.token);
  if (!token) return;

  // get currency address which's used to make offer or buyout for the listing
  let currency: Bytes;
  const offerUID = generateUID([listingID, buyer.toHex()]);
  const offer = Offer.load(offerUID);
  if (offer) {
    currency = offer.currency;
  } else {
    currency = listing.currency;
  }

  // init offer entity by tx hash
  const sale = new Sale(tx.hash.toHex());
  sale.listing = listingID;
  sale.seller = seller.toHex();
  sale.buyer = buyer.toHex();
  sale.quantityBought = quantity;
  sale.totalPaid = totalPaid;
  sale.txHash = tx.hash;
  sale.timestamp = currentBlock.timestamp;
  sale.save();

  // update quantity in the listing after partial sold
  listing.availableQty = listing.availableQty.minus(quantity);
  if (listing.availableQty == ZERO_BIGINT) {
    listing.soldAt = currentBlock.timestamp;
  }
  listing.save();

  // update stats
  updateCollectionStats(collection, quantity, totalPaid);

  // create update listing activity entity
  createActivity(activities.SOLD, currentBlock, tx, token, null, seller, buyer, quantity, currency, totalPaid);
}

export function handleUpgraded(event: Upgraded): void {
  increaseMarketplaceVersion(event.block.timestamp);
}
