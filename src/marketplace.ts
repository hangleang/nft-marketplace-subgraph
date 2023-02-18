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
import { IERC2981 } from '../generated/Marketplace/IERC2981'
import { Listing, Token } from "../generated/schema";
import { createActivity } from "./modules/activity";
import { createListing } from "./modules/listing";
import { createOrLoadMarketplace, increaseMarketplaceVersion } from "./modules/marketplace"
import { createOrLoadAccount } from "./modules/account";
import { createOrLoadCollection, getOrCreateCollectionDailySnapshot } from "./modules/collection";
import { createOrLoadToken } from "./modules/token";
import { createOffer, loadOffer } from "./modules/offer";

import * as activities from './constants/activities';
import { MANTISSA_FACTOR, HUNDRED_DECIMAL, ZERO_BIGINT, ZERO_DECIMAL } from "./constants";
import { Address, BigDecimal, Bytes, store } from "@graphprotocol/graph-ts";
import { getMax, getMin } from "./utils";

export function handleInitialized(event: Initialized): void {
  createOrLoadMarketplace(event.block.timestamp);
}

export function handleUpgraded(event: Upgraded): void {
  increaseMarketplaceVersion(event.block.timestamp);
}

export function handleListingAdded(event: ListingAdded): void {
  // init local vars from event params
  const currentBlock      = event.block;
  const collectionAddress = event.params.assetContract;
  const listerAddress     = event.params.lister;
  const listingID         = event.params.listingId;
  const listing           = event.params.listing;

  const priceETH          = listing.buyoutPricePerToken.toBigDecimal().div(MANTISSA_FACTOR)

  // explicit create entities in case not exists
  createOrLoadAccount(listerAddress)
  const collection        = createOrLoadCollection(collectionAddress, currentBlock.timestamp)
  const token             = createOrLoadToken(collection, listing.tokenId)

  // create listing entity from given params, also update token balance if auction listing
  createListing(listingID, token, listing, currentBlock.timestamp);

  // create list activity entity
  createActivity(activities.LIST, event, token, listerAddress, event.address, listing.quantity, listing.currency, priceETH);
}

export function handleListingRemoved(event: ListingRemoved): void {
  // init local vars from event params
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

      // remove listing entity from store
      store.remove('Listing', listingId.toString())
    }
  }
}

export function handleListingUpdated(event: ListingUpdated): void {
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
        const updatedQty = listingMapping.getQuantity();
        listing.startTime = listingMapping.getStartTime();
        listing.endTime = listingMapping.getEndTime();
        listing.quantity = updatedQty;
        listing.availableQty = updatedQty;
        listing.currency = listingMapping.getCurrency();
        listing.reservePricePerToken = listingMapping.getReservePricePerToken();
        listing.buyoutPricePerToken = listingMapping.getBuyoutPricePerToken();
        listing.updatedAt = currentBlock.timestamp;
        listing.save();  

        const priceETH = listing.buyoutPricePerToken.toBigDecimal().div(MANTISSA_FACTOR)
      
        // create update listing activity entity
        createActivity(activities.UPDATE_LISTING, event, token, ownerAddress, event.address, listing.quantity, listing.currency, priceETH);
      }
    }
  }
}

export function handleAuctionClosed(event: AuctionClosed): void {
  // init local vars from event params
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

      // remove listing entity from store
      store.remove('Listing', listingId.toString())
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

  const amountETH       = offerAmount.toBigDecimal().div(MANTISSA_FACTOR)
  const priceETH        = amountETH.div(quantity.toBigDecimal())

  // load/check listing by ID
  const listing     = Listing.load(listingId.toString());
  if (listing != null) {

    // load/check token by ID
    const token = Token.load(listing.token);
    if (token != null) {
      // create offer entity on the listing
      createOffer(listing, offeror, quantity, currency, offerAmount.toBigDecimal(), expiredTimestamp, event)
  
      // create make offer activity entity
      createActivity(activities.MAKE_OFFER, event, token, offerorAddress, Address.fromString(listing.owner), quantity, currency, priceETH);
    }
  }
}

export function handleNewSale(event: NewSale): void {
  // init local vars from event params
  const currentTimestamp  = event.block.timestamp;
  const collectionAddress = event.params.assetContract;
  const listingId         = event.params.listingId;
  const sellerAddress     = event.params.lister;
  const buyerAddress      = event.params.buyer;
  const quantity          = event.params.quantityBought;
  const totalPaid         = event.params.totalPricePaid;
  const buyer             = createOrLoadAccount(buyerAddress)

  const volumeETH         = totalPaid.toBigDecimal().div(MANTISSA_FACTOR);
  const priceETH          = volumeETH.div(quantity.toBigDecimal());

  createOrLoadAccount(sellerAddress)
  const collection = createOrLoadCollection(collectionAddress, currentTimestamp)

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
        listing.soldAt = currentTimestamp;
      }
      listing.save();

      //
      // update collection
      //
      const marketplace = Marketplace.bind(event.address);
      const erc2981 = IERC2981.bind(collectionAddress);
      const try_supportERC2981 = erc2981.try_supportsInterface(Bytes.fromHexString("0x2a55205a")); // ERC2981
      const try_platformFeeBps = marketplace.try_platformFeeBps()

      // if collection is supported royalty
      if (!try_supportERC2981.reverted) {
        const isERC2981 = try_supportERC2981.value
        if (isERC2981) {
          let royaltyFee = ZERO_DECIMAL;
          if (collection.royaltyFee != royaltyFee) {
            royaltyFee = collection.royaltyFee;
          } else {
            const try_royaltyInfo = erc2981.try_royaltyInfo(token.tokenId, totalPaid);

            if (!try_royaltyInfo.reverted) {
              const royaltyAmount = try_royaltyInfo.value.getRoyaltyAmount()
  
              // calculate royalty fee for the collection
              royaltyFee = royaltyAmount.toBigDecimal()
                .div(totalPaid.toBigDecimal())
                .times(HUNDRED_DECIMAL);
  
              // explicit set collection royalty fee
              collection.royaltyFee = royaltyFee
            }
          }

          const deltaCreatorRevenueETH = volumeETH
            .times(royaltyFee)
            .div(HUNDRED_DECIMAL);
          collection.creatorRevenueETH = collection.creatorRevenueETH.plus(
            deltaCreatorRevenueETH
          );
        }
      }

      // if marketplace is support platform fee
      if (!try_platformFeeBps.reverted) {
        const platformFeeRate = try_platformFeeBps.value.toBigDecimal().div(HUNDRED_DECIMAL)
        const deltaMarketplaceRevenueETH = volumeETH
          .times(platformFeeRate)
          .div(HUNDRED_DECIMAL)
        collection.marketplaceRevenueETH = collection.marketplaceRevenueETH.plus(
          deltaMarketplaceRevenueETH
        );
      }

      collection.cumulativeTradeVolumeETH = collection.cumulativeTradeVolumeETH.plus(volumeETH);
      collection.totalRevenueETH = collection.marketplaceRevenueETH.plus(collection.creatorRevenueETH);
      collection.save()

      //
      // take collection snapshot
      //
      const collectionSnapshot = getOrCreateCollectionDailySnapshot(
        collection,
        event.block.timestamp
      );
      collectionSnapshot.blockNumber = event.block.number;
      collectionSnapshot.timestamp = event.block.timestamp;
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
    
      // create update listing activity entity
      createActivity(activities.SALE, event, token, sellerAddress, buyerAddress, quantity, currency, priceETH);
    }
  }
}