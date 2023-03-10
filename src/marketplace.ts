import {
  Marketplace,
  AuctionClosed as AuctionClosedEvent,
  Initialized as InitializedEvent,
  ListingAdded as ListingAddedEvent,
  ListingRemoved as ListingRemovedEvent,
  ListingUpdated as ListingUpdatedEvent,
  NewOffer as NewOfferEvent,
  NewSale as NewSaleEvent,
  PlatformFeeInfoUpdated as PlatformFeeInfoUpdatedEvent,
  Upgraded as UpgradedEvent,
  AuctionBuffersUpdated as AuctionBuffersUpdatedEvent
} from "../generated/Marketplace/Marketplace"
import { Listing, Token } from "../generated/schema";
import { createActivity } from "./modules/activity";
import { createListing } from "./modules/listing";
import { createOrLoadMarketplace, getOrCreateMarketplaceDailySnapshot, increaseMarketplaceVersion } from "./modules/marketplace"
import { createOrLoadAccount } from "./modules/account";
import { createOrLoadCollection, getOrCreateCollectionDailySnapshot } from "./modules/collection";
import { createOrLoadToken } from "./modules/token";
import { createOffer, loadOffer } from "./modules/offer";

import * as activities from './constants/activities';
import { MANTISSA_FACTOR, HUNDRED_DECIMAL, ZERO_BIGINT } from "./constants";
import { Address, Bytes } from "@graphprotocol/graph-ts";
import { getMax, getMin, safeDivDecimal } from "./utils";

export function handleInitialized(event: InitializedEvent): void {
  // bind marketplace contract
  const marketplaceContract = Marketplace.bind(event.address);
  const try_bidBufferBps    = marketplaceContract.try_bidBufferBps();
  const try_timeBuffer      = marketplaceContract.try_timeBuffer();

  const marketplace = createOrLoadMarketplace(event.address, event.block.timestamp);
  if (!try_bidBufferBps.reverted && !try_timeBuffer.reverted) {
    marketplace.bidBuffer  = safeDivDecimal(try_bidBufferBps.value, HUNDRED_DECIMAL)
    marketplace.timeBuffer = try_timeBuffer.value;
    marketplace.save()
  }
}

export function handleUpgraded(event: UpgradedEvent): void {
  increaseMarketplaceVersion(event.address, event.block.timestamp);
}

export function handlePlatformFeeInfoUpdated(event: PlatformFeeInfoUpdatedEvent): void {
  const plaformFee = safeDivDecimal(event.params.platformFeeBps, HUNDRED_DECIMAL)

  const marketplace 			= createOrLoadMarketplace(event.address, event.block.timestamp);
	marketplace.platformFee = plaformFee;
	marketplace.updatedAt 	= event.block.timestamp;
	marketplace.save()
}

export function handleAuctionBuffersUpdated(event: AuctionBuffersUpdatedEvent): void {
  const bidBuffer = safeDivDecimal(event.params.bidBufferBps, HUNDRED_DECIMAL)

  const marketplace       = createOrLoadMarketplace(event.address, event.block.timestamp);
  marketplace.bidBuffer   = bidBuffer;
  marketplace.timeBuffer  = event.params.timeBuffer;
  marketplace.save()
}

export function handleListingAdded(event: ListingAddedEvent): void {
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

  // create listing entity from given params, also update token balance if auction listing
  createListing(listingID, token, listing, currentBlock.timestamp);

  // create list activity entity
  createActivity(activities.LIST, event, token, listerAddress, event.address, listing.quantity, listing.currency, listing.buyoutPricePerToken.toBigDecimal());
}

export function handleListingRemoved(event: ListingRemovedEvent): void {
  // init local vars from event params
  const currentTimestamp = event.block.timestamp;
  const listingId     = event.params.listingId;
  const ownerAddress  = event.params.listingCreator;
  createOrLoadAccount(ownerAddress)

  const listing     = Listing.load(listingId.toString());
  if (listing != null) {

    // load/check token by ID
    const token     = Token.load(listing.token);
    if (token != null) {
      // create list activity entity
      createActivity(activities.UNLIST, event, token, ownerAddress, event.address, listing.availableQty);

      // soft-delete the listing entity
      listing.availableQty  = ZERO_BIGINT
      listing.closedAt      = currentTimestamp
      listing.updatedAt     = currentTimestamp
      listing.save()
    }
  }
}

export function handleListingUpdated(event: ListingUpdatedEvent): void {
  // init local vars from event params
  const currentBlock        = event.block
  const listingId           = event.params.listingId
  const ownerAddress        = event.params.listingCreator
  createOrLoadAccount(ownerAddress)

  // load/check listing by ID
  const listing     = Listing.load(listingId.toString());
  if (listing != null) {
    const try_listingMapping  = Marketplace.bind(event.address).try_listings(listingId)
    
    if (!try_listingMapping.reverted) {
      const listingMapping    = try_listingMapping.value

      // load/check token by ID
      const token     = Token.load(listing.token);
      if (token != null) {
        const updatedQty            = listingMapping.getQuantity();
        listing.startTime           = listingMapping.getStartTime();
        listing.endTime             = listingMapping.getEndTime();
        listing.quantity            = updatedQty;
        listing.availableQty        = updatedQty;
        listing.currency            = listingMapping.getCurrency();
        listing.reservePricePerToken = listingMapping.getReservePricePerToken();
        listing.buyoutPricePerToken = listingMapping.getBuyoutPricePerToken();
        listing.updatedAt           = currentBlock.timestamp;
        listing.save();  
      
        // create update listing activity entity
        createActivity(activities.UPDATE_LISTING, event, token, ownerAddress, event.address, listing.quantity, listing.currency, listing.buyoutPricePerToken.toBigDecimal());
      }
    }
  }
}

export function handleAuctionClosed(event: AuctionClosedEvent): void {
  // init local vars from event params
  const currentTimestamp = event.block.timestamp
  const listingId     = event.params.listingId
  const closerAddress = event.params.closer
  createOrLoadAccount(closerAddress)

  // load/check listing by ID
  const listing     = Listing.load(listingId.toString())
  if (listing != null) {

    // load/check token by ID
    const token     = Token.load(listing.token)
    if (token != null) {
      // create close auction activity entity
      createActivity(activities.CLOSE_AUCTION, event, token, closerAddress, event.address, listing.availableQty)

      listing.availableQty  = ZERO_BIGINT
      listing.updatedAt     = currentTimestamp
      listing.closedAt      = currentTimestamp
      listing.save()
    }
  }
}

export function handleNewOffer(event: NewOfferEvent): void {
  // init local vars from event params
  const listingId       = event.params.listingId;
  const offerorAddress  = event.params.offeror;
  const quantity        = event.params.quantityWanted;
  const currency        = event.params.currency;
  const offerAmount     = event.params.totalOfferAmount;
  const expiredTimestamp = event.params.expiredTimestamp;
  const offeror         = createOrLoadAccount(offerorAddress)

  // load/check listing by ID
  const listing     = Listing.load(listingId.toString());
  if (listing != null) {

    // load/check token by ID
    const token = Token.load(listing.token);
    if (token != null) {
      // create offer entity on the listing
      createOffer(listing, offeror, quantity, currency, offerAmount.toBigDecimal(), expiredTimestamp, event)
  
      // create make offer activity entity
      createActivity(activities.MAKE_OFFER, event, token, offerorAddress, Address.fromString(listing.owner), quantity, currency, safeDivDecimal(offerAmount, quantity.toBigDecimal()));
    }
  }
}

export function handleNewSale(event: NewSaleEvent): void {
  // init local vars from event params
  const currentTimestamp  = event.block.timestamp;
  const collectionAddress = event.params.assetContract;
  const listingId         = event.params.listingId;
  const sellerAddress     = event.params.lister;
  const buyerAddress      = event.params.buyer;
  const quantity          = event.params.quantityBought;
  const totalPaid         = event.params.totalPricePaid;

  createOrLoadAccount(sellerAddress)
  const buyer             = createOrLoadAccount(buyerAddress)
  const marketplace       = createOrLoadMarketplace(event.address, currentTimestamp)
  const collection        = createOrLoadCollection(collectionAddress, currentTimestamp)

  const volumeETH         = totalPaid.toBigDecimal().div(MANTISSA_FACTOR);
  const priceETH          = volumeETH.div(quantity.toBigDecimal());

  // load/check listing by ID
  const listing = Listing.load(listingId.toString());
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
        listing.closedAt = currentTimestamp;
      }
      listing.save();

      const deltaCreatorRevenueETH = volumeETH
        .times(token.royaltyFee)
        .div(HUNDRED_DECIMAL) 
      const deltaMarketplaceRevenueETH = volumeETH
        .times(marketplace.platformFee)
        .div(HUNDRED_DECIMAL)

      // update collection
      collection.creatorRevenueETH = collection.creatorRevenueETH.plus(
        deltaCreatorRevenueETH
      );
      collection.marketplaceRevenueETH = collection.marketplaceRevenueETH.plus(
        deltaMarketplaceRevenueETH
      );
      collection.cumulativeTradeVolumeETH = collection.cumulativeTradeVolumeETH.plus(volumeETH);
      collection.totalRevenueETH = collection.marketplaceRevenueETH.plus(collection.creatorRevenueETH);
      collection.save()

      // update marketplace
      marketplace.cumulativeTradeVolumeETH =
        marketplace.cumulativeTradeVolumeETH.plus(volumeETH);
      marketplace.marketplaceRevenueETH = marketplace.marketplaceRevenueETH.plus(
        deltaMarketplaceRevenueETH
      );
      marketplace.creatorRevenueETH = marketplace.creatorRevenueETH.plus(
        deltaCreatorRevenueETH
      );
      marketplace.totalRevenueETH = marketplace.marketplaceRevenueETH.plus(
        marketplace.creatorRevenueETH
      );
      marketplace.save();

      // take collection snapshot
      const collectionSnapshot = getOrCreateCollectionDailySnapshot(
        collection,
        currentTimestamp
      );
      collectionSnapshot.blockNumber = event.block.number;
      collectionSnapshot.timestamp = currentTimestamp;
      // collectionSnapshot.royaltyFee = collection.royaltyFee;
      collectionSnapshot.dailyMinSalePriceETH = getMin(
        collectionSnapshot.dailyMinSalePriceETH,
        priceETH
      );
      collectionSnapshot.dailyMaxSalePriceETH = getMax(
        collectionSnapshot.dailyMaxSalePriceETH,
        priceETH
      );
      collectionSnapshot.cumulativeTradeVolumeETH =
        collection.cumulativeTradeVolumeETH;
      collectionSnapshot.marketplaceRevenueETH = collection.marketplaceRevenueETH;
      collectionSnapshot.creatorRevenueETH = collection.creatorRevenueETH;
      collectionSnapshot.totalRevenueETH = collection.totalRevenueETH;
      // collectionSnapshot.tradeCount = collection.tradeCount;
      collectionSnapshot.dailyTradeVolumeETH =
        collectionSnapshot.dailyTradeVolumeETH.plus(totalPaid.toBigDecimal());
      // collectionSnapshot.dailyTradedItemCount += newDailyTradedItem;
      collectionSnapshot.save();

      // take marketplace snapshot
      const marketplaceSnapshot = getOrCreateMarketplaceDailySnapshot(
        marketplace,
        currentTimestamp
      );
      marketplaceSnapshot.blockNumber = event.block.number;
      marketplaceSnapshot.timestamp = currentTimestamp;
      marketplaceSnapshot.cumulativeTradeVolumeETH =
        marketplace.cumulativeTradeVolumeETH;
      marketplaceSnapshot.marketplaceRevenueETH = marketplace.marketplaceRevenueETH;
      marketplaceSnapshot.creatorRevenueETH = marketplace.creatorRevenueETH;
      marketplaceSnapshot.totalRevenueETH = marketplace.totalRevenueETH;
      marketplaceSnapshot.save();
    
      // create update listing activity entity
      createActivity(activities.SALE, event, token, sellerAddress, buyerAddress, quantity, currency, safeDivDecimal(totalPaid, quantity.toBigDecimal()));
    }
  }
}