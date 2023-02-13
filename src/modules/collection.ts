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
} from "../../generated/schema";
import { UNKNOWN, ZERO_DECIMAL } from "../constants";
import {
  formatURI,
  getString,
  ipfsToCID,
  isIPFS,
  loadMetadataFromURI,
} from "../utils";
import { IERC165Metadata } from "../../generated/templates/NFTs/IERC165Metadata";
import { supportsInterface } from "./erc165";
import { createOrLoadAccount } from "./account";

import * as collections from "../constants/collections";
import { CollectionMetadataTemplate } from "../../generated/templates";

export function createOrLoadCollection(
  address: Address,
  currentTimestamp: BigInt
): Collection {
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
  if (collection == null) {
    collection = new Collection(collectionAddress);
    let try_contractURI = contract.try_contractURI();
    let try_owner = contract.try_owner();
    const metadataURI: string | null = try_contractURI.reverted
      ? null
      : try_contractURI.value;
    collection.metadataURI = metadataURI ? formatURI(metadataURI, null) : null;

    // Try load owner, then set to collection entity
    if (!try_owner.reverted) {
      collection.owner = createOrLoadAccount(try_owner.value).id;
    }

    if (isERC721) {
      collection.collectionType = collections.SINGLE; // ERC721
      collection.supportsMetadata = introspection_5b5e139f; // ERC721Metadata
    } else if (isERC1155) {
      collection.collectionType = collections.MULTI; // ERC1155
      collection.supportsMetadata = introspection_0e89341c; // ERC1155Metadata_URI
    } else {
      collection.collectionType = UNKNOWN; // Unknown
      collection.supportsMetadata = false;
    }

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

      // explicit set metadata field
      collection.metadata = collectionAddress;
    }

    // initialize statistic
    collection.cumulativeTradeVolumeETH = ZERO_DECIMAL;
    collection.marketplaceRevenueETH = ZERO_DECIMAL;
    collection.creatorRevenueETH = ZERO_DECIMAL;
    collection.totalRevenueETH = ZERO_DECIMAL;

    // stamping the creation
    collection.createdAt = currentTimestamp;
    collection.updatedAt = currentTimestamp;
    collection.save();
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