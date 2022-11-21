import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Collection, CollectionStats } from "../../generated/schema";
import { STATS_POSTFIX, ZERO_BIGINT, ZERO_DECIMAL } from "../constants";
import { generateUID, getMax, getMin } from "../utils";

export function createOrUpdateCollection(address: Address, currentTimestamp: BigInt): Collection {
  let collection = Collection.load(address.toHex());

  if (!collection) {
    collection = new Collection(address.toHex());
    collection.createdAt = currentTimestamp;
  }
  return collection;
}

export function setCollectionDropDetail(address: Address, dropDetailUID: string): void {
  const collection = Collection.load(address.toHex());

  if (collection) {
    collection.dropDetails = dropDetailUID;
    collection.save();
  }
}

export function generateCollectionStatsUID(collection: Address): string {
  return generateUID([collection.toHex(), STATS_POSTFIX])
}

export function createOrLoadCollectionStats(collection: Address): CollectionStats {
  const statsUID = generateCollectionStatsUID(collection);
  let stats = CollectionStats.load(statsUID);

  if (!stats) {
    stats = new CollectionStats(statsUID)
    stats.collection = collection.toHex();
    stats.listed = ZERO_BIGINT;
    stats.sales = ZERO_BIGINT;
    stats.volume = ZERO_BIGINT;
    stats.highestSale = ZERO_DECIMAL;
    stats.floorPrice = ZERO_DECIMAL;
    stats.averagePrice = ZERO_DECIMAL;
    stats.save();
  }
  return stats;
}

export function updateCollectionStatsList(collection: Address, quantity: BigInt, isAddUp: bool): void {
  const statsUID = generateCollectionStatsUID(collection);
  const stats = CollectionStats.load(statsUID);

  if (stats) {
    if (isAddUp) {
      stats.listed = stats.listed.plus(quantity);
    } else {
      stats.listed = stats.listed.minus(quantity);
    }
    stats.save();
  }
}

export function updateCollectionStats(collection: Address, quantity: BigInt, totalPaid: BigInt): void {
  const statsUID = generateCollectionStatsUID(collection);
  const pricePerToken = totalPaid.toBigDecimal().div(quantity.toBigDecimal());
  const stats = CollectionStats.load(statsUID);

  if (stats) {
    stats.listed = stats.listed.minus(quantity);
    stats.sales = stats.sales.plus(quantity);
    stats.volume = stats.volume.plus(totalPaid);
    stats.highestSale = getMax(stats.highestSale, pricePerToken);    
    stats.averagePrice = stats.volume.toBigDecimal().div(stats.sales.toBigDecimal());

    if (stats.floorPrice == ZERO_DECIMAL) {
      stats.floorPrice = pricePerToken;
    } else {
      stats.floorPrice = getMin(stats.floorPrice, pricePerToken);
    }
    stats.save();
  }
}