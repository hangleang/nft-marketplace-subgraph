import {
  AuctionClosed,
  Initialized,
  ListingAdded,
  ListingRemoved,
  ListingUpdated,
  NewOffer,
  NewSale,
} from "../generated/Marketplace/Marketplace"

export function handleAuctionClosed(event: AuctionClosed): void {}

export function handleInitialized(event: Initialized): void {}

export function handleListingAdded(event: ListingAdded): void {}

export function handleListingRemoved(event: ListingRemoved): void {}

export function handleListingUpdated(event: ListingUpdated): void {}

export function handleNewOffer(event: NewOffer): void {}

export function handleNewSale(event: NewSale): void {}
