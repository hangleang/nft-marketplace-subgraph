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
import { Listing, Token } from "../generated/schema";
import { createActivity } from "./modules/activity";
import { createWTFListing } from "./modules/listing";
import { createMarketplace, increaseMarketplaceVersion, loadMarketplace } from "./modules/marketplace"
import { createOrLoadAccount } from "./modules/account";
import { createOrLoadCollection } from "./modules/collection";
import { createOrLoadToken } from "./modules/token";
import { createOffer, loadOffer } from "./modules/offer";

import * as activities from './constants/activities';
import { ZERO_BIGINT } from "./constants";
import { Address, Bytes, store } from "@graphprotocol/graph-ts";
import { generateUID } from "./utils";

export function handleInitialized(event: Initialized): void {
  createMarketplace(event.address, "WTF Marketplace", "wtf-marketplace", event.params.version.toString(), event.block.timestamp);
}

export function handleUpgraded(event: Upgraded): void {
  increaseMarketplaceVersion(event.address, event.block.timestamp);
}

export function handleListingAdded(event: ListingAdded): void {
  // init local vars from event params
  const currentBlock      = event.block;
  const collectionAddress = event.params.assetContract;
  const listerAddress     = event.params.lister;
  const listingID         = event.params.listingId;
  const listing           = event.params.listing;

  // explicit create entities in case not exists
  createOrLoadAccount(listerAddress)
  const collection        = createOrLoadCollection(collectionAddress, currentBlock.timestamp)
  const token             = createOrLoadToken(collection, listing.tokenId)

  // load/check marketplace by contract address
  const marketplace       = loadMarketplace(event.address);
  if (marketplace != null) {
    // create listing entity from given params, also update token balance if auction listing
    createWTFListing(marketplace, listingID, token, listing, currentBlock.timestamp);
  
    // increase collection stats listed amount
    // updateCollectionStatsList(collectionAddress, listing.quantity, true);
  
    // create list activity entity
    createActivity(marketplace, activities.LIST, event, token, listerAddress, event.address, listing.quantity, listing.currency, listing.buyoutPricePerToken.toBigDecimal());
  }
}

export function handleListingRemoved(event: ListingRemoved): void {
  // init local vars from event params
  const listingId     = event.params.listingId.toString();
  const ownerAddress  = event.params.listingCreator;
  createOrLoadAccount(ownerAddress)

  // load/check marketplace by contract address
  const marketplace   = loadMarketplace(event.address);
  if (marketplace != null) {
    const id          = generateUID([marketplace.id, listingId.toString()])

    // load/check listing by ID
    const listing     = Listing.load(id);
    if (listing != null) {

      // load/check token by ID
      const token     = Token.load(listing.token);
      if (token != null) {
        // decrease collection stats listed amount
        // updateCollectionStatsList(Address.fromString(listing.collection), listing.availableQty, false);

        // create list activity entity
        createActivity(marketplace, activities.UNLIST, event, token, ownerAddress, event.address, listing.availableQty);

        // remove listing entity from store
        store.remove('Listing', id)
      }
    }
  }
}

export function handleListingUpdated(event: ListingUpdated): void {
  // init local vars from event params
  const currentBlock        = event.block
  const listingId           = event.params.listingId
  const ownerAddress        = event.params.listingCreator
  createOrLoadAccount(ownerAddress)

  // load/check marketplace by contract address
  const marketplace   = loadMarketplace(event.address);
  if (marketplace != null) {
    const id          = generateUID([marketplace.id, listingId.toString()])

    // load/check listing by ID
    const listing     = Listing.load(id);
    if (listing != null) {
      const try_listingMapping  = Marketplace.bind(event.address).try_listings(listingId)
      
      if (!try_listingMapping.reverted) {
        const listingMapping    = try_listingMapping.value

        // load/check token by ID
        const token     = Token.load(listing.token);
        if (token != null) {
          const updatedQty = listingMapping.getQuantity();
          // const prevQty = listing.quantity;

          // if (updatedQty != prevQty) {
          //   const isAddUp = updatedQty > prevQty;
          //   const qtyDiff = updatedQty.minus(prevQty).abs();
            
          //   // update collection stats listed amount
          //   // updateCollectionStatsList(Address.fromString(listing.collection), qtyDiff, isAddUp);
          // }
          
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
          createActivity(marketplace, activities.UPDATE_LISTING, event, token, ownerAddress, event.address, listing.quantity, listing.currency, listing.buyoutPricePerToken.toBigDecimal());
        }
      }
    }
  }
}

export function handleAuctionClosed(event: AuctionClosed): void {
  // init local vars from event params
  const listingId     = event.params.listingId
  const closerAddress = event.params.closer
  createOrLoadAccount(closerAddress)

  // load/check marketplace by contract address
  const marketplace   = loadMarketplace(event.address);
  if (marketplace != null) {
    const id          = generateUID([marketplace.id, listingId.toString()]);
    
    // load/check listing by ID
    const listing     = Listing.load(id)
    if (listing != null) {

      // load/check token by ID
      const token     = Token.load(listing.token)
      if (token != null) {
        // update collection stats listed amount
        // updateCollectionStatsList(Address.fromString(listing.collection), listing.availableQty, false)
        
        // create close auction activity entity
        createActivity(marketplace, activities.CLOSE_AUCTION, event, token, closerAddress, event.address, listing.availableQty)
  
        // remove listing entity from store
        store.remove('Listing', id)
      }
    }
  }
}

export function handleNewOffer(event: NewOffer): void {
  // init local vars from event params
  const listingId       = event.params.listingId;
  const offerorAddress  = event.params.offeror;
  const quantity        = event.params.quantityWanted;
  const currency        = event.params.currency;
  const offerAmount     = event.params.totalOfferAmount;
  const expiredTimestamp = event.params.expiredTimestamp;
  const offeror         = createOrLoadAccount(offerorAddress)

  // load/check marketplace by contract address
  const marketplace   = loadMarketplace(event.address);
  if (marketplace != null) {
    const id          = generateUID([marketplace.id, listingId.toString()]);

    // load/check listing by ID
    const listing     = Listing.load(id);
    if (listing != null) {

      // load/check token by ID
      const token = Token.load(listing.token);
      if (token != null) {
        // create offer entity on the listing
        createOffer(marketplace, listing, offeror, quantity, currency, offerAmount.toBigDecimal(), expiredTimestamp, event)
    
        // create make offer activity entity
        createActivity(marketplace, activities.MAKE_OFFER, event, token, offerorAddress, Address.fromString(listing.owner), quantity, currency, offerAmount.divDecimal(quantity.toBigDecimal()));
      }
    }
  }
}

export function handleNewSale(event: NewSale): void {
  // init local vars from event params
  const currentTimestamp      = event.block.timestamp;
  const collectionAddress = event.params.assetContract;
  const listingId         = event.params.listingId;
  const sellerAddress     = event.params.lister;
  const buyerAddress      = event.params.buyer;
  const quantity          = event.params.quantityBought;
  const totalPaid         = event.params.totalPricePaid;
  const buyer             = createOrLoadAccount(buyerAddress)

  createOrLoadAccount(sellerAddress)
  createOrLoadCollection(collectionAddress, currentTimestamp)

  // load/check marketplace by contract address
  const marketplace       = loadMarketplace(event.address);
  if (marketplace != null) {
    const id              = generateUID([marketplace.id, listingId.toString()])

    // load/check listing by ID
    const listing = Listing.load(id);
    if (listing != null) {

      // load/check token by ID
      const token = Token.load(listing.token);
      if (token != null) {
        // get currency accepted which's used to make offer or buyout for the listing
        let currency: Bytes;
        const offer = loadOffer(listing, buyer);
        if (offer != null) {
          currency = offer.currency;
        } else {
          currency = listing.currency;
        }
      
        // update quantity in the listing after partial sold
        listing.availableQty = listing.availableQty.minus(quantity);
        if (listing.availableQty == ZERO_BIGINT) {
          listing.soldAt = currentTimestamp;
        }
        listing.save();
      
        // update stats
        // updateCollectionStats(collectionAddress, quantity, totalPaid);
      
        // create update listing activity entity
        createActivity(marketplace, activities.SALE, event, token, sellerAddress, buyerAddress, quantity, currency, totalPaid.divDecimal(quantity.toBigDecimal()));
      }
    }
  }
}