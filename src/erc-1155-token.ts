import {
  ERC1155TokenTokensMinted as ERC1155TokenTokensMintedEvent,
  ERC1155TokenTokensMintedWithSignature as ERC1155TokenTokensMintedWithSignatureEvent,
  ERC1155TokenTransferBatch as ERC1155TokenTransferBatchEvent,
  ERC1155TokenTransferSingle as ERC1155TokenTransferSingleEvent,
} from "../generated/templates/ERC1155Token/ERC1155Token"
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { createOrUpdateToken, createOrUpdateTokenBalance, generateTokenName, transferTokenBalance } from "./modules/token";
import { generateUID, getString, loadContentFromURI } from "./utils";
import { createActivity } from "./modules/activity";
import { Token, Attribute } from "../generated/schema"

import * as activities from "./constants/activities";
import { NULL_ADDRESS, ONE_BIGINT } from "./constants";

export function handleERC1155TokenTokensMinted(
  event: ERC1155TokenTokensMintedEvent
): void {
  // init local vars from event params
  const currentBlock = event.block;
  const signer = event.transaction.from;
  const recipient = event.params.mintedTo;
  const tokenID = event.params.tokenIdMinted;
  const quantity = event.params.quantityMinted;
  const uri = event.params.uri;

  // generate token entity, get the instance for create MINTED activity
  const token = _handleMint(
    currentBlock.timestamp,
    event.address,
    signer,
    recipient,
    tokenID,
    quantity,
    uri
  );

  // create activity entity
  createActivity(activities.MINTED, currentBlock, event.transaction, token, null, null, recipient, quantity);
}

export function handleERC1155TokenTokensMintedWithSignature(
  event: ERC1155TokenTokensMintedWithSignatureEvent
): void {
  // init local vars from event params
  const currentBlock = event.block;
  const signer = event.params.signer;
  const recipient = event.params.mintedTo;
  const tokenID = event.params.tokenIdMinted;
  const quantity = event.params.mintRequest.quantity;
  const uri = event.params.mintRequest.uri;

  // generate token entity, get the instance for create MINTED activity
  const token = _handleMint(
    currentBlock.timestamp,
    event.address,
    signer,
    recipient,
    tokenID,
    quantity,
    uri
  );

  // create activity entity
  const currency = event.params.mintRequest.currency;
  const price = event.params.mintRequest.pricePerToken;
  createActivity(activities.MINTED, currentBlock, event.transaction, token, null, signer, recipient, quantity, currency, price);
}

export function handleERC1155TokenTransferBatch(
  event: ERC1155TokenTransferBatchEvent
): void {
  // init local vars from event params
  const from = event.params.from;
  const to = event.params.to;
  const tokenIDs = event.params.ids;
  const values = event.params.values;

  // check if mint transaction, return
  if (tokenIDs.length != values.length || from == NULL_ADDRESS) return;

  // loop through all the entries
  for (let i = 0; i < tokenIDs.length; i++) {
    const tokenID = tokenIDs[i];
    const value = values[i];

    // check if token entity is exists, then update both parties token balances
    const tokenUID = generateUID([event.address.toHex(), tokenID.toString()], "/");
    const token = Token.load(tokenUID);
    if (!token) return;
    transferTokenBalance(tokenUID, from, to, ONE_BIGINT);

    // create activity entity
    createActivity(activities.TRANSFERRED, event.block, event.transaction, token, null, from, to, value);
  }
}

export function handleERC1155TokenTransferSingle(
  event: ERC1155TokenTransferSingleEvent
): void {
  // init local vars from event params
  const from = event.params.from;
  const to = event.params.to;
  const tokenID = event.params.id.toString();
  const value = event.params.value;

  // check if no tokenID or mint transaction, return
  if (tokenID == '' || from == NULL_ADDRESS) return;

  // check if token entity is exists, then update both parties token balances
  const tokenUID = generateUID([event.address.toHex(), tokenID], "/");
  const token = Token.load(tokenUID);
  if (!token) return;
  transferTokenBalance(tokenUID, from, to, value);

  // create activity entity
  createActivity(activities.TRANSFERRED, event.block, event.transaction, token, null, from, to, value);
}

function _handleMint(currentTimestamp: BigInt, collection: Address, creator: Address, recipient: Address, tokenID: BigInt, quantity: BigInt, tokenURI: string): Token {
  const tokenUID = generateUID([collection.toHex(), tokenID.toString()], "/");

  // init token entity
  let token = createOrUpdateToken(tokenUID, currentTimestamp);
  token.collection = collection.toHex();
  token.creator = creator.toHex();
  token.tokenId = tokenID;
  token.tokenURI = tokenURI;
  token.isLazyMinted = false;

  // fetch metadata from IPFS URI, then set metadata fields
  const content = loadContentFromURI(tokenURI);
  if (content) {
    const name = getString(content, "name");
    const contentURI = getString(content, "image");
    token.name = name ? name : generateTokenName(collection, tokenID);
    token.description = getString(content, "description");
    token.content = contentURI ? contentURI : "";
    token.externalURL = getString(content, "external_url");
    token.fallbackURL = getString(content, "fallback_url");

    // get attributes link to this token
    const attributes = content.get("attributes");
    if (attributes) {
      const attributesEntries = attributes.toObject().entries;
      for (let i = 0; i < attributesEntries.length; i++) {
        const entry = attributesEntries[i];
        const attribute = new Attribute(generateUID([tokenUID, entry.key], "/"))
        attribute.token = tokenUID;
        attribute.key = entry.key.trim();
        attribute.value = entry.value.toString();
        attribute.save();
      }
    }
  } else {
    token.name = generateTokenName(collection, tokenID);
  }
  token.updatedAt = currentTimestamp;
  token.save();

  // update token balance of recipient
  createOrUpdateTokenBalance(tokenUID, recipient, quantity, true);
  return token;
}
