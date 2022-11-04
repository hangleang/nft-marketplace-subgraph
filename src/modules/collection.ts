import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Collection } from "../../generated/schema";

export function createOrUpdateCollection(address: Address, currentTimestamp: BigInt): Collection {
    let collection = Collection.load(address.toHex());

    if (!collection) {
      collection = new Collection(address.toHex());
      collection.createdAt = currentTimestamp;
    }
    return collection;
}