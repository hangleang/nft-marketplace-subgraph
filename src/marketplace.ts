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
import { Listing, Offer, Sale } from "../generated/schema";
import { createActivity, createOrLoadOffer } from "./modules/activity";
import { createListing } from "./modules/listing";
import { createOrLoadMarketplace, increaseMarketplaceVersion } from "./modules/marketplace"
import { createOrLoadAccount } from "./modules/account";
// import { createOrLoadToken } from "./modules/token";
import { createOrLoadCollection, updateCollectionStats, updateCollectionStatsList } from "./modules/collection";

import * as activities from './constants/activities';
import { ZERO_BIGINT } from "./constants";
import { Address, Bytes, store } from "@graphprotocol/graph-ts";
import { generateUID } from "./utils";

export function handleInitialized(event: Initialized): void {
  createOrLoadMarketplace(event.block.timestamp);
}

export function handleUpgraded(event: Upgraded): void {
  increaseMarketplaceVersion(event.block.timestamp);
}

export function handleAuctionClosed(event: AuctionClosed): void {
  // init local vars from event params
  const listingId     = event.params.listingId.toString()
  const closerAddress = event.params.closer

  // load/check listing by listingID
  const listing       = Listing.load(listingId)
  if (listing != null) {
    createOrLoadAccount(closerAddress)

    // const token       = Token.load(listing.token)
    // if (token != null) {
      // update collection stats listed amount
      updateCollectionStatsList(Address.fromString(listing.collection), listing.availableQty, false)
      
      // create close auction activity entity
      createActivity(activities.CLOSE_AUCTION, event, listing, closerAddress, null, listing.availableQty)

      // remove listing entity from store
      store.remove('Listing', listingId)
    // }
  }
}

export function handleListingAdded(event: ListingAdded): void {
  // init local vars from event params
  const currentBlock      = event.block;
  const collectionAddress = event.params.assetContract;
  const listerAddress     = event.params.lister;
  const listingID         = event.params.listingId;
  const listing           = event.params.listing;

  const collection        = createOrLoadCollection(collectionAddress, currentBlock.timestamp)
  if (collection != null) {
    createOrLoadAccount(listerAddress)
    // const token           = createOrLoadToken(collection, listing.tokenId, currentBlock.timestamp)

    // create listing entity from given params, also update token balance if auction listing
    const listingEntity = createListing(listingID, collection, listing.tokenId, listing, currentBlock.timestamp);
  
    // increase collection stats listed amount
    updateCollectionStatsList(collectionAddress, listing.quantity, true);
  
    // create list activity entity
    createActivity(activities.LIST, event, listingEntity, listerAddress, null, listing.quantity, listing.currency, listing.buyoutPricePerToken.toBigDecimal());
  }
}

export function handleListingRemoved(event: ListingRemoved): void {
  // init local vars from event params
  const listingId     = event.params.listingId.toString();
  const ownerAddress  = event.params.listingCreator;
  
  // load/check listing by listingID
  const listing = Listing.load(listingId);
  if (listing != null) {
    createOrLoadAccount(ownerAddress)

    // const token = Token.load(listing.token);
    // if (token != null) {
      // decrease collection stats listed amount
      updateCollectionStatsList(Address.fromString(listing.collection), listing.availableQty, false);

      // create list activity entity
      createActivity(activities.UNLIST, event, listing, ownerAddress, null, listing.availableQty);

      // remove listing entity from store
      store.remove('Listing', listingId)
    // }
  }
}

export function handleListingUpdated(event: ListingUpdated): void {
  // init local vars from event params
  const currentBlock        = event.block
  const listingId           = event.params.listingId
  const ownerAddress        = event.params.listingCreator

  // load/check listing by listingID
  const listing = Listing.load(listingId.toString())
  if (listing != null) {
    createOrLoadAccount(ownerAddress)
    const try_listingMapping  = Marketplace.bind(event.address).try_listings(listingId)
    
    if (!try_listingMapping.reverted) {
      const listingMapping    = try_listingMapping.value

      // const token = Token.load(listing.token);
      // if (token != null) {
        const updatedQty = listingMapping.getQuantity();
        const prevQty = listing.quantity;

        if (updatedQty != prevQty) {
          const isAddUp = updatedQty > prevQty;
          const qtyDiff = updatedQty.minus(prevQty).abs();
          
          // update collection stats listed amount
          updateCollectionStatsList(Address.fromString(listing.collection), qtyDiff, isAddUp);
        }
        
        listing.startTime = listingMapping.getStartTime();
        listing.endTime = listingMapping.getEndTime();
        listing.quantity = updatedQty;
        listing.availableQty = updatedQty;
        listing.currency = listingMapping.getCurrency();
        listing.reservePricePerToken = listingMapping.getReservePricePerToken();
        listing.buyoutPricePerToken = listingMapping.getBuyoutPricePerToken();
        listing.updatedAt = currentBlock.timestamp;
        listing.save();  
      
        // create update listing activity entity
        createActivity(activities.UPDATE_LISTING, event, listing, ownerAddress, null, listing.quantity, listing.currency, listing.buyoutPricePerToken.toBigDecimal());
      // }
    }
  }
}

export function handleNewOffer(event: NewOffer): void {
  // init local vars from event params
  const currentBlock    = event.block;
  const tx              = event.transaction;
  const listingId       = event.params.listingId.toString();
  const offerorAddress  = event.params.offeror;
  const quantity        = event.params.quantityWanted;
  const currency        = event.params.currency;
  const offerAmount     = event.params.totalOfferAmount;
  const expiredTimestamp = event.params.expiredTimestamp;

  // load/check listing by listingID
  const listing         = Listing.load(listingId);
  if (listing != null) {
    const offeror       = createOrLoadAccount(offerorAddress)

    // const token = Token.load(listing.token);
    // if (token != null) {
      // init offer entity by tx hash
      const offer       = createOrLoadOffer(listing, offeror)
      offer.quantity    = quantity;
      offer.currency    = currency;
      offer.offerAmount = offerAmount;
      offer.expiredTimestamp = expiredTimestamp;
      offer.txHash      = tx.hash;
      offer.timestamp   = currentBlock.timestamp;
      offer.save();
  
      // create update listing activity entity
      createActivity(activities.MAKE_OFFER, event, listing, offerorAddress, null, quantity, currency, offerAmount.divDecimal(quantity.toBigDecimal()));
    // }
  }
}

export function handleNewSale(event: NewSale): void {
  // init local vars from event params
  const currentBlock      = event.block;
  const tx                = event.transaction;
  const collectionAddress = event.params.assetContract;
  const listingId         = event.params.listingId.toString();
  const sellerAddress     = event.params.lister;
  const buyerAddress      = event.params.buyer;
  const quantity          = event.params.quantityBought;
  const totalPaid         = event.params.totalPricePaid;

  const collection        = createOrLoadCollection(collectionAddress, currentBlock.timestamp)
  if (collection != null) {
    // load/check listing by listingID
    const listing = Listing.load(listingId);
    if (listing != null) {
      const seller        = createOrLoadAccount(sellerAddress)
      const buyer         = createOrLoadAccount(buyerAddress)

      // const token = Token.load(listing.token);
      // if (token != null) {
        // get currency address which's used to make offer or buyout for the listing
        let currency: Bytes;
        const offer = Offer.load(generateUID([listing.id, buyer.id]));
        if (offer != null) {
          currency = offer.currency;
        } else {
          currency = listing.currency;
        }
      
        // init sale entity by tx hash
        const id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
        const sale = new Sale(id);
        sale.listing = listing.id;
        sale.seller = seller.id;
        sale.buyer = buyer.id;
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
        updateCollectionStats(collectionAddress, quantity, totalPaid);
      
        // create update listing activity entity
        createActivity(activities.SALE, event, listing, sellerAddress, buyerAddress, quantity, currency, totalPaid.divDecimal(quantity.toBigDecimal()));
      // }
    }
  }
}