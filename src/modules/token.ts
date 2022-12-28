import {
  Address,
  BigInt,
  DataSourceContext,
  ethereum,
  JSONValue,
  JSONValueKind,
  TypedMap,
} from "@graphprotocol/graph-ts";
import { decimals } from "@amxx/graphprotocol-utils";
import {
  TokenBalance,
  Collection,
  Token,
  Account,
  Attribute,
  TokenMetadata,
} from "../../generated/schema";
import { TokenMetadataTemplate } from "../../generated/templates";
import { NULL_ADDRESS, ZERO_BIGINT, ZERO_DECIMAL } from "../constants";
import {
  formatURI,
  generateUID,
  getString,
  ipfsToCID,
  isIPFS,
  loadMetadataFromURI,
  replaceURI,
} from "../utils";
import { INFTs } from "../../generated/NFTs/INFTs";
import { createOrLoadAccount } from "./account";
import { createActivity } from "./activity";

import * as collections from "../constants/collections";
import * as activities from "../constants/activities";

const TOTAL_SUPPLY_POSTFIX: string = "totalSupply";
const TOKEN_NAME_NOT_FOUND: string = "Untitled";

export function createOrLoadToken(
  collection: Collection,
  tokenId: BigInt,
  currentTimestamp: BigInt
): Token {
  const collectionAddress = Address.fromString(collection.id);
  const id = generateTokenUID(collectionAddress, tokenId);
  let token = Token.load(id);

  if (token == null) {
    token = new Token(id);
    token.collection = collection.id;
    token.tokenId = tokenId;
    token.totalSupply = createOrLoadTokenBalance(token, null).id;
    token.approval = createOrLoadAccount(NULL_ADDRESS).id;

    let tokenURI = "";
    if (collection.supportsMetadata) {
      const asset = INFTs.bind(collectionAddress);

      if (collection.collectionType == collections.SINGLE) {
        // const erc721        = IERC721.bind(collectionAddress)
        const try_tokenURI = asset.try_tokenURI(tokenId);
        tokenURI = try_tokenURI.reverted ? "" : try_tokenURI.value;
      } else if (collection.collectionType == collections.MULTI) {
        // const erc1155       = IERC1155.bind(collectionAddress)
        const try_uri = asset.try_uri(tokenId);
        tokenURI = try_uri.reverted ? "" : replaceURI(try_uri.value, tokenId);
      } else if (collection.collectionType == collections.SEMI) {
        // const asset         = IERC721ERC1155.bind(collectionAddress)

        let collectionId: BigInt;
        let isCollection = false;
        let owner: string | null = null;
        const try_owner = asset.try_ownerOf(tokenId);

        if (!try_owner.reverted) {
          owner = try_owner.value.toHex();
        }
        if (owner != null) {
          let try_collectionId = asset.try_collectionOf(tokenId);

          if (!try_collectionId.reverted) {
            collectionId = try_collectionId.value;
            isCollection = true;
          } else {
            collectionId = tokenId; // a dual token minted as NFT straight away is its own collection
          }
        } else {
          collectionId = tokenId;
        }

        const try_uri = isCollection
          ? asset.try_uri(collectionId)
          : asset.try_tokenURI(collectionId);
        tokenURI = try_uri.reverted ? "" : replaceURI(try_uri.value, tokenId);
      }
    }

    token.tokenURI = formatURI(tokenURI, null);
    token.metadata = id;
    token.createdAt = currentTimestamp;
    token.updatedAt = currentTimestamp;
    token.save();

    if (tokenURI != "") {
      // fetch metadata from URI, then set metadata fields
      resolveTokenMetadata(id, tokenURI);
    }
  }

  return token;
}

export function resolveTokenMetadata(tokenUID: string, tokenURI: string): void {
  if (isIPFS(tokenURI)) {
    let CID = ipfsToCID(tokenURI)

    if (CID) {
      let context = new DataSourceContext();
      context.setString("tokenUID", tokenUID);

      TokenMetadataTemplate.createWithContext(CID, context);
    }
  } else {
    // try load metadata from URI
    const metadata = loadMetadataFromURI(tokenURI);

    if (metadata) {
      updateTokenMetadata(tokenUID, tokenURI, metadata);
    }
  }
}

export function updateTokenMetadata(
  metadataUID: string,
  metadataURI: string,
  metadata: TypedMap<string, JSONValue>
): void {
  const name = getString(metadata, "name");
  const externalURL = getString(metadata, "external_url");
  const animationURL = getString(metadata, "animation_url");
  let image = getString(metadata, "image");
  if (image == null) {
    image = getString(metadata, "image_data");
  }

  let tokenMetadata = TokenMetadata.load(metadataUID);
  if (tokenMetadata == null) {
    tokenMetadata = new TokenMetadata(metadataUID);
  }

  tokenMetadata.name = name && name != "" ? name : TOKEN_NAME_NOT_FOUND;
  tokenMetadata.description = getString(metadata, "description");
  tokenMetadata.contentURI = image ? formatURI(image, metadataURI) : null;
  tokenMetadata.externalURL = externalURL
    ? formatURI(externalURL, metadataURI)
    : null;
  tokenMetadata.fallbackURL = getString(metadata, "fallback_url");
  tokenMetadata.bgColor = getString(metadata, "background_color");
  tokenMetadata.animationURL = animationURL
    ? formatURI(animationURL, metadataURI)
    : null;
  tokenMetadata.youtubeURL = getString(metadata, "youtube_url");

  const decimals = metadata.get("decimals");
  if (decimals != null && decimals.kind == JSONValueKind.NUMBER) {
    tokenMetadata.decimals = decimals.toBigInt().toI32();
  } else {
		tokenMetadata.decimals = 0
	}

  // get attributes link to this token
  const attributes = metadata.get("attributes");
  if (attributes) {
    if (attributes.kind == JSONValueKind.ARRAY) {
      const attributesEntries = attributes.toArray();

      for (let i = 0; i < attributesEntries.length; i++) {
        const entry = attributesEntries[i];
        if (entry.kind == JSONValueKind.OBJECT) {
          const attribute = entry.toObject();
          const displayType = getString(attribute, "display_type");
          const traitType = getString(attribute, "trait_type");
          const value = attribute.get("value");
          createOrUpdateTokenAttribute(
            tokenMetadata,
            i,
            displayType,
            traitType,
            value
          );
        }
      }
    }
  }
  tokenMetadata.save();
}

export function createOrLoadTokenBalance(
  token: Token,
  owner: Account | null
): TokenBalance {
  const id = generateUID([token.id, owner ? owner.id : TOTAL_SUPPLY_POSTFIX]);
  let balance = TokenBalance.load(id);

  if (balance == null) {
    balance = new TokenBalance(id);
    balance.collection = token.collection;
    balance.token = token.id;
    balance.owner = owner ? owner.id : null;
    balance.value = ZERO_DECIMAL;
    balance.valueExact = ZERO_BIGINT;
    balance.save();
  }
  return balance;
}

export function registerTransfer(
  event: ethereum.Event,
  collection: Collection,
  // operator: Account,
  from: Account,
  to: Account,
  tokenId: BigInt,
  value: BigInt,
  timestamp: BigInt
): void {
  const token = createOrLoadToken(collection, tokenId, timestamp);

  const fromAddress = Address.fromString(from.id);
  const toAddress = Address.fromString(to.id);
  // if mintEvent, set creator address
  // else transferEvent, reset approval
  if (fromAddress == NULL_ADDRESS) {
    token.creator = to.id;

    // Create mint activity entity
    createActivity(activities.MINTED, event, token, toAddress, null);
  } else {
    token.approval = createOrLoadAccount(NULL_ADDRESS).id; // implicit approval reset on transfer

    // Create transfer activity entity
    createActivity(
      activities.TRANSFERRED,
      event,
      token,
      fromAddress,
      toAddress
    );
  }

  // Update both parties token balances (ownership)
  transferTokenBalance(token, from, to, value);
  token.save();
}

function transferTokenBalance(
  token: Token,
  from: Account,
  to: Account,
  value: BigInt
): void {
  let tokenDecimals = 0;

  const metadata = token.metadata;
  if (metadata) {
    const tokenMetadata = TokenMetadata.load(metadata);
    if (tokenMetadata && tokenMetadata.decimals) {
      tokenDecimals = tokenMetadata.decimals;
    }
  }

  if (Address.fromString(from.id) == NULL_ADDRESS) {
    let totalSupply = createOrLoadTokenBalance(token, null);
    totalSupply.valueExact = totalSupply.valueExact.plus(value);
    totalSupply.value = decimals.toDecimals(
      totalSupply.valueExact,
      tokenDecimals
    );
    totalSupply.save();
  } else {
    let balance = createOrLoadTokenBalance(token, from);
    balance.valueExact = balance.valueExact.minus(value);
    balance.value = decimals.toDecimals(balance.valueExact, tokenDecimals);
    balance.save();
  }

  if (Address.fromString(to.id) == NULL_ADDRESS) {
    let totalSupply = createOrLoadTokenBalance(token, null);
    totalSupply.valueExact = totalSupply.valueExact.minus(value);
    totalSupply.value = decimals.toDecimals(
      totalSupply.valueExact,
      tokenDecimals
    );
    totalSupply.save();
  } else {
    let balance = createOrLoadTokenBalance(token, to);
    balance.valueExact = balance.valueExact.plus(value);
    balance.value = decimals.toDecimals(balance.valueExact, tokenDecimals);
    balance.save();
  }
}

function createOrUpdateTokenAttribute(
  tokenMetadata: TokenMetadata,
  key: number,
  displayType: string | null,
  traitType: string | null,
  value: JSONValue | null
): void {
  const id = generateTokenAttributeUID(tokenMetadata, key);
  let attribute = Attribute.load(id);

  let valueAsString: string = "";
  if (value != null) {
    if (value.kind == JSONValueKind.NUMBER) {
      valueAsString = value.data.toString();
    } else if (value.kind == JSONValueKind.STRING) {
      valueAsString = value.toString();
    }
  }

  if (attribute == null) {
    attribute = new Attribute(id);
    attribute.tokenMetadata = tokenMetadata.id;
  }
  attribute.displayType = displayType ? displayType : "string";
  attribute.traitType = traitType ? traitType : "property";
  attribute.value = valueAsString;
  attribute.save();
}

function generateTokenUID(collection: Address, tokenID: BigInt): string {
  return generateUID([collection.toHex(), tokenID.toString()], ":");
}

function generateTokenAttributeUID(
  tokenMetadata: TokenMetadata,
  key: number
): string {
  return generateUID([tokenMetadata.id, key.toString()], ":");
}

function generateTokenName(
  collectionAddress: Address,
  tokenID: BigInt
): string {
  let collectionName: string;
  const collection = Collection.load(collectionAddress.toHex());
  if (collection) {
    collectionName = collection.name;
  } else {
    collectionName = "Untitled Collection";
  }
  return generateUID([collectionName, `#${tokenID}`], " ");
}
