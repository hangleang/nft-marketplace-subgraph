import { ProxyDeployed as ProxyDeployedEvent } from "../generated/ContractFactory/ContractFactory"
import { Collection, CollectionStats } from "../generated/schema"
import { ZERO_BIGINT, STATS_POSTFIX } from "./constants";
import * as collections from "./constants/collections";
import { generateUID } from "./utils";

export function handleProxyDeployed(event: ProxyDeployedEvent): void {
  const collectionAddress = event.params.proxy.toHex();
  let collection = new Collection(collectionAddress);
  collection.creator = event.params.deployer.toHex();
  collection.collectionType = collections.ERC721Token;
  collection.metadataURI  = "";
  collection.title = "";
  collection.featuredImage = "";
  collection.createdAt = event.block.timestamp;
  collection.updatedAt = event.block.timestamp;

  const statsUID = generateUID([collectionAddress, STATS_POSTFIX]);
  let stats = new CollectionStats(statsUID)
  stats.collection = collectionAddress;
  stats.volume = ZERO_BIGINT;
  stats.sales = ZERO_BIGINT;
  stats.highestSale = ZERO_BIGINT;
  stats.floorPrice = ZERO_BIGINT;
  stats.averagePrice = ZERO_BIGINT;
  stats.save();
  
  collection.statistics = statsUID;
  collection.save();

}
