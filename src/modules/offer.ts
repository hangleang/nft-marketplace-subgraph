import { BigDecimal, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts"
import { Account, Listing, Offer } from "../../generated/schema"
import { generateUID } from "../utils"

export function loadOffer(listing: Listing, offerer: Account): Offer | null {
  return Offer.load(generateUID([listing.id, offerer.id])) 
}

export function createOffer(
  listing: Listing, 
  offerer: Account,
  quantity: BigInt, 
  currency: Bytes,
  offerAmount: BigDecimal,
  expiredTimestamp: BigInt,
  event: ethereum.Event,
): void {
  const id          = generateUID([listing.id, offerer.id])
  const offer       = new Offer(id)
  offer.listing     = listing.id
  offer.offerer     = offerer.id
  offer.quantity    = quantity
  offer.currency    = currency
  offer.offerAmount = offerAmount
  offer.expiredTimestamp = expiredTimestamp

  const tx          = event.transaction
  const block       = event.block
  offer.txHash      = tx.hash
  offer.blockHash   = block.hash
  offer.timestamp   = block.timestamp 
  offer.blockNumber = block.number
  offer.logIndex    = event.logIndex.toU32()
  offer.save()
}