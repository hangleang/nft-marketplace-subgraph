import { Address, BigDecimal, BigInt, Bytes, ethereum, log } from "@graphprotocol/graph-ts";
import { Token, Activity, Account, Offer, Listing } from "../../generated/schema";
import { NULL_ADDRESS, ZERO_BIGINT, ZERO_DECIMAL } from "../constants";
import { generateUID } from "../utils";

import * as activities from '../constants/activities';

export function createActivity(
    type: string, 
    event: ethereum.Event,
    token: Token, 
    from: Address,
    to: Address | null, 
    quantity: BigInt = ZERO_BIGINT, 
    currency: Bytes = NULL_ADDRESS,
    price: BigDecimal = ZERO_DECIMAL
): void {
    const block             = event.block
    const tx                = event.transaction
    let id                = tx.hash.toHex() + "-" + event.logIndex.toString()
    if (type == activities.CLAIMED) {
        id = id + "-" + token.tokenId.toString()
    }
    log.info("event {} with id:{}", [type, id])

    let activity            = new Activity(id)
    activity.activityType   = type
    activity.txHash         = tx.hash.toHex()
    activity.blockHash      = block.hash.toHex()
    activity.timestamp      = block.timestamp 
    activity.from           = from.toHex()
    activity.to             = to ? to.toHex() : null
    activity.collection     = token.collection
    activity.token          = token.id
    activity.quantity       = quantity
    activity.currency       = currency
    activity.price          = price
    activity.save();
}

export function createOrLoadOffer(listing: Listing, offeror: Account): Offer {
    const id            = generateUID([listing.id, offeror.id])
    let offer           = Offer.load(id) 
    
    if (offer == null) {
        offer           = new Offer(id)
        offer.listing   = listing.id
        offer.offeror   = offeror.id
    }

    return offer
}