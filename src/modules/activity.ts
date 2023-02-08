import { Address, BigDecimal, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { Activity, Token, Marketplace } from "../../generated/schema";
import { NULL_ADDRESS, ZERO_BIGINT, ZERO_DECIMAL } from "../constants";
import { generateUID } from "../utils";

export function createActivity(
    marketplace: Marketplace,
    type: string, 
    event: ethereum.Event,
    token: Token, 
    from: Address,
    to: Address = NULL_ADDRESS, 
    quantity: BigInt = ZERO_BIGINT, 
    currency: Bytes = NULL_ADDRESS,
    price: BigDecimal = ZERO_DECIMAL
): void {
    const block             = event.block
    const tx                = event.transaction
    const logIndex          = event.logIndex
    let id                  = generateUID([tx.hash.toHex(), logIndex.toString()])
    
    let activity            = new Activity(id)
    activity.activityType   = type
    activity.marketplace    = marketplace.id
    activity.from           = from.toHex()
    activity.to             = to.toHex()
    activity.collection     = token.collection
    activity.token          = token.id
    activity.quantity       = quantity
    activity.currency       = currency
    activity.price          = price

    activity.txHash         = tx.hash
    activity.blockHash      = block.hash
    activity.timestamp      = block.timestamp 
    activity.blockNumber    = block.number
    activity.logIndex       = logIndex.toU32()
    activity.save();
}