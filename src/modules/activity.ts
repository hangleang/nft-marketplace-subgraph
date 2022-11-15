import { Address, BigInt, Bytes, ethereum } from "@graphprotocol/graph-ts";
import { Token, Activity } from "../../generated/schema";
import { NULL_ADDRESS, ONE_BIGINT, ZERO_BIGINT } from "../constants";
import { generateUID } from "../utils";

export function createActivity(
    type: string, 
    block: ethereum.Block, 
    tx: ethereum.Transaction, 
    token: Token | null, 
    collection: Address | null,
    from: Address | null,
    to: Address | null, 
    quantity: BigInt = ZERO_BIGINT, 
    currency: Bytes = NULL_ADDRESS,
    price: BigInt = ZERO_BIGINT
): void {
    let activity = new Activity(generateUID([tx.hash.toHex(), tx.index.toString()]));
    activity.activityType = type;
    activity.txHash = tx.hash.toHex();
    activity.blockHash = block.hash.toHex();
    activity.timestamp = block.timestamp; 

    let actualFrom: Address;
    if (from) {
        actualFrom = from;
    } else {
        actualFrom = tx.from;
    }
    
    let actualTo: Address;
    if (to) {
        actualTo = to;
    } else {
        actualTo = NULL_ADDRESS;
    }
    activity.from = actualFrom.toHex();
    activity.to = actualTo.toHex();

    if (token) {
        activity.collection = token.collection;
        activity.token = token.id;
        activity.quantity = quantity;
        activity.currency = currency;
        activity.price = price;
    } else if (collection) {
        activity.collection = collection.toHex();
    }
    activity.save();
}