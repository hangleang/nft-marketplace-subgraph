import {
  Address,
  BigInt,
  DataSourceContext,
  JSONValue,
  TypedMap,
} from "@graphprotocol/graph-ts";
import {
  Collection,
  CollectionMetadata,
  CollectionStats,
} from "../../generated/schema";
import { STATS_POSTFIX, ZERO_BIGINT, ZERO_DECIMAL } from "../constants";
import {
  formatURI,
  generateUID,
  getMax,
  getMin,
  getString,
  ipfsToCID,
  isIPFS,
  loadMetadataFromURI,
} from "../utils";
import { IERC165Metadata } from "../../generated/NFTs/IERC165Metadata";
import { supportsInterface } from "./erc165";
import { createOrLoadAccount } from "./account";

import * as collections from "../constants/collections";
import { CollectionMetadataTemplate } from "../../generated/templates";

export function createOrLoadCollection(
  address: Address,
  currentTimestamp: BigInt
): Collection | null {
  let contract = IERC165Metadata.bind(address);
  const collectionAddress = address.toHex();

  // Detect using ERC165
  const introspection_01ffc9a7 = supportsInterface(contract, "01ffc9a7"); // ERC165
  const introspection_80ac58cd = supportsInterface(contract, "80ac58cd"); // ERC721
  const introspection_d9b67a26 = supportsInterface(contract, "d9b67a26"); // ERC1155
  const introspection_5b5e139f = supportsInterface(contract, "5b5e139f"); // ERC721Metadata
  const introspection_0e89341c = supportsInterface(contract, "0e89341c"); // ERC1155Metadata_URI
  const introspection_00000000 = supportsInterface(contract, "00000000", false);
  const isERC721 =
    introspection_01ffc9a7 && introspection_80ac58cd && introspection_00000000;
  const isERC1155 =
    introspection_01ffc9a7 && introspection_d9b67a26 && introspection_00000000;

  // Try load collection entity
  let collection = Collection.load(collectionAddress);
  if (collection != null) {
    return collection;
  }

  // If support interface, build a collection entity
  if (isERC721 || isERC1155) {
    collection = new Collection(collectionAddress);
    let try_name = contract.try_name();
    let try_symbol = contract.try_symbol();
    let try_contractURI = contract.try_contractURI();
    let try_owner = contract.try_owner();
    const nameFromContract = try_name.reverted ? "" : try_name.value;
    const metadataURI: string | null = try_contractURI.reverted
      ? null
      : try_contractURI.value;
    collection.name = nameFromContract;
    collection.symbol = try_symbol.reverted ? "" : try_symbol.value;
    collection.metadataURI = metadataURI ? formatURI(metadataURI, null) : null;

    // Try load owner, then set to collection entity
    if (!try_owner.reverted) {
      collection.owner = createOrLoadAccount(try_owner.value).id;
    }

    if (isERC721 && isERC1155) {
      collection.collectionType = collections.SEMI; // ERC721ERC1155
      collection.supportsMetadata =
        introspection_5b5e139f && introspection_0e89341c; // ERC721Metadata & ERC1155Metadata_URI
    } else if (isERC721) {
      collection.collectionType = collections.SINGLE; // ERC721
      collection.supportsMetadata = introspection_5b5e139f; // ERC721Metadata
    } else if (isERC1155) {
      collection.collectionType = collections.MULTI; // ERC1155
      collection.supportsMetadata = introspection_0e89341c; // ERC1155Metadata_URI
    }

    // Create collection stats entity
    const collectionStats = createOrLoadCollectionStats(address);

    collection.metadata = collectionAddress;
    collection.statistics = collectionStats.id;
    collection.createdAt = currentTimestamp;
    collection.updatedAt = currentTimestamp;
    collection.save();

    // If have contractURI, then try load from IPFS
    if (metadataURI) {
      if (isIPFS(metadataURI)) {
        let CID = ipfsToCID(metadataURI)

        if (CID) {
          let context = new DataSourceContext();
          context.setString("collectionAddress", collectionAddress);

          CollectionMetadataTemplate.createWithContext(CID, context);
        }
      } else {
        // try load metadata from URI
        const metadata = loadMetadataFromURI(metadataURI);

        if (metadata) {
          updateCollectionMetadata(collectionAddress, metadataURI, metadata);
        }
      }
    }
  }

  return collection;
}

export function updateCollectionMetadata(
  metadataUID: string,
  metadataURI: string,
  metadata: TypedMap<string, JSONValue>
): void {
  // fetch metadata from URI, then set metadata fields
  const name = getString(metadata, "name");
  const featuredImage = getString(metadata, "image");
  const bannerImage = getString(metadata, "banner_image");

  let collectionMetadata = CollectionMetadata.load(metadataUID);
  if (collectionMetadata == null) {
    collectionMetadata = new CollectionMetadata(metadataUID);
  }

  collectionMetadata.name = name;
  collectionMetadata.description = getString(metadata, "description");
  collectionMetadata.featuredImage = featuredImage
    ? formatURI(featuredImage, metadataURI)
    : null;
  collectionMetadata.bannerImage = bannerImage
    ? formatURI(bannerImage, metadataURI)
    : null;
  collectionMetadata.externalLink = getString(metadata, "external_link");
  collectionMetadata.fallbackURL = getString(metadata, "fallback_url");
  collectionMetadata.save();
}

function generateCollectionStatsUID(collection: Address): string {
  return generateUID([collection.toHex(), STATS_POSTFIX]);
}

function createOrLoadCollectionStats(collection: Address): CollectionStats {
  const statsUID = generateCollectionStatsUID(collection);
  let stats = CollectionStats.load(statsUID);

  if (stats == null) {
    stats = new CollectionStats(statsUID);
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

export function updateCollectionStatsList(
  collection: Address,
  quantity: BigInt,
  isAddUp: bool
): void {
  const statsUID = generateCollectionStatsUID(collection);
  const stats = CollectionStats.load(statsUID);

  if (stats != null) {
    if (isAddUp) {
      stats.listed = stats.listed.plus(quantity);
    } else {
      stats.listed = stats.listed.minus(quantity);
    }
    stats.save();
  }
}

export function updateCollectionStats(
  collection: Address,
  quantity: BigInt,
  totalPaid: BigInt
): void {
  const statsUID = generateCollectionStatsUID(collection);
  const pricePerToken = totalPaid.toBigDecimal().div(quantity.toBigDecimal());
  const stats = CollectionStats.load(statsUID);

  if (stats != null) {
    stats.listed = stats.listed.minus(quantity);
    stats.sales = stats.sales.plus(quantity);
    stats.volume = stats.volume.plus(totalPaid);
    stats.highestSale = getMax(stats.highestSale, pricePerToken);
    stats.averagePrice = stats.volume
      .toBigDecimal()
      .div(stats.sales.toBigDecimal());

    if (stats.floorPrice == ZERO_DECIMAL) {
      stats.floorPrice = pricePerToken;
    } else {
      stats.floorPrice = getMin(stats.floorPrice, pricePerToken);
    }
    stats.save();
  }
}
