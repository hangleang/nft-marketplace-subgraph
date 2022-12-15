import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Collection, CollectionStats } from "../../generated/schema";
import { STATS_POSTFIX, ZERO_BIGINT, ZERO_DECIMAL } from "../constants";
import { formateURI, generateUID, getMax, getMin, getString, loadContentFromURI } from "../utils";
import { IERC165Metadata } from '../../generated/NFTs/IERC165Metadata';
import { supportsInterface } from "./erc165";
import { createOrLoadAccount } from "./account";

import * as collections from '../constants/collections';

export function createOrLoadCollection(address: Address, currentTimestamp: BigInt): Collection | null {
  let contract = IERC165Metadata.bind(address);

  // Detect using ERC165
  let introspection_01ffc9a7 = supportsInterface(contract, '01ffc9a7') // ERC165
  let introspection_80ac58cd = supportsInterface(contract, '80ac58cd') // ERC721
  let introspection_d9b67a26 = supportsInterface(contract, 'd9b67a26') // ERC1155
  let introspection_5b5e139f = supportsInterface(contract, '5b5e139f') // ERC721Metadata
  let introspection_0e89341c = supportsInterface(contract, '0e89341c') // ERC1155Metadata_URI
  let introspection_00000000 = supportsInterface(contract, '00000000', false)
  let isERC721               = introspection_01ffc9a7 && introspection_80ac58cd && introspection_00000000
  let isERC1155              = introspection_01ffc9a7 && introspection_d9b67a26 && introspection_00000000

  // Try load collection entity
  let collection = Collection.load(address.toHex());
  if (collection != null) {
    return collection;
  }

  // If support interface, build a collection entity
  if (isERC721 || isERC1155) {
    collection                = new Collection(address.toHex());
    let try_name              = contract.try_name()
		let try_symbol            = contract.try_symbol()
    let try_contractURI       = contract.try_contractURI()
    let try_owner             = contract.try_owner()
    const nameFromContract    = try_name.reverted   ? '' : try_name.value;
    collection.name           = nameFromContract
		collection.symbol         = try_symbol.reverted ? '' : try_symbol.value
    collection.metadataURI    = try_contractURI.reverted ? null : try_contractURI.value
    
    // Try load owner, then set to collection entity
    if (!try_owner.reverted) {
      collection.owner        = createOrLoadAccount(try_owner.value).id
    }
    
    // If have contractURI, then try load from IPFS
    if (!try_contractURI.reverted) {
      const contractURI = try_contractURI.value

      // fetch metadata from IPFS URI, then set metadata fields
      const content = loadContentFromURI(contractURI)

      collection.isResolved = content != null
      if (content) {
        const name                = getString(content, "name")
        const featuredImage       = getString(content, "image")
        const bannerImage         = getString(content, "banner_image")
        collection.name           = name ? name : nameFromContract
        collection.description    = getString(content, "description")
        collection.featuredImage  = formateURI(featuredImage, contractURI)
        collection.bannerImage    = formateURI(bannerImage, contractURI)
        collection.externalLink   = getString(content, "external_link")
        collection.fallbackURL    = getString(content, "fallback_url")
      }
    }

    if (isERC721 && isERC1155) {
      collection.collectionType   = collections.SEMI // ERC721ERC1155          
      collection.supportsMetadata = introspection_5b5e139f && introspection_0e89341c // ERC721Metadata & ERC1155Metadata_URI
    } else if (isERC721) {
      collection.collectionType   = collections.SINGLE // ERC721        
      collection.supportsMetadata = introspection_5b5e139f // ERC721Metadata
    } else if (isERC1155) {
      collection.collectionType   = collections.MULTI // ERC1155
      collection.supportsMetadata = introspection_0e89341c // ERC1155Metadata_URI
    }

    // Create collection stats entity
    const collectionStats         = createOrLoadCollectionStats(address);

    collection.statistics         = collectionStats.id;
    collection.createdAt          = currentTimestamp;
    collection.updatedAt          = currentTimestamp;
    collection.save()

    // createOrLoadAccount(address)
  } 

  return collection;
}

function generateCollectionStatsUID(collection: Address): string {
  return generateUID([collection.toHex(), STATS_POSTFIX])
}

function createOrLoadCollectionStats(collection: Address): CollectionStats {
  const statsUID      = generateCollectionStatsUID(collection)
  let stats           = CollectionStats.load(statsUID)

  if (stats == null) {
    stats             = new CollectionStats(statsUID)
    stats.collection  = collection.toHex()
    stats.listed      = ZERO_BIGINT
    stats.sales       = ZERO_BIGINT
    stats.volume      = ZERO_BIGINT
    stats.highestSale = ZERO_DECIMAL
    stats.floorPrice  = ZERO_DECIMAL
    stats.averagePrice = ZERO_DECIMAL
    stats.save()
  }
  return stats
}

export function updateCollectionStatsList(collection: Address, quantity: BigInt, isAddUp: bool): void {
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

export function updateCollectionStats(collection: Address, quantity: BigInt, totalPaid: BigInt): void {
  const statsUID = generateCollectionStatsUID(collection);
  const pricePerToken = totalPaid.toBigDecimal().div(quantity.toBigDecimal());
  const stats = CollectionStats.load(statsUID);

  if (stats != null) {
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