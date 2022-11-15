import {
  TokensMinted as TokensMintedEvent,
  TokensMintedWithSignature as TokensMintedWithSignatureEvent,
  Transfer as TransferEvent
} from "../generated/templates/ERC721Token/ERC721Token"
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Attribute, Token } from "../generated/schema"
import { NULL_ADDRESS, ONE_BIGINT } from "./constants";
import { getString, loadContentFromURI } from "./utils";
import { createOrUpdateToken, createOrUpdateTokenBalance, generateTokenAttributeUID, generateTokenName, generateTokenUID, transferTokenBalance } from "./modules/token";
import { createActivity } from "./modules/activity";

import * as activities from "./constants/activities";

export function handleTokensMinted(event: TokensMintedEvent): void {
  // init local vars from event params
  const currentBlock = event.block;
  const signer = event.transaction.from;
  const recipient = event.params.mintedTo;
  const tokenID = event.params.tokenIdMinted;
  const uri = event.params.uri;

  // generate token entity, get the instance for create MINTED activity
  const token = _handleMint(
    currentBlock.timestamp,
    event.address,
    signer,
    recipient,
    tokenID,
    uri
  );

  // create activity entity
  createActivity(activities.MINTED, currentBlock, event.transaction, token, null, signer, recipient, ONE_BIGINT);
}

export function handleTokensMintedWithSignature(
  event: TokensMintedWithSignatureEvent
): void {
  // init local vars from event params
  const currentBlock = event.block;
  const signer = event.params.signer;
  const recipient = event.params.mintedTo;
  const tokenID = event.params.tokenIdMinted;
  const uri = event.params.mintRequest.uri;

  // generate token entity, get the instance for create MINTED activity
  const token = _handleMint(
    currentBlock.timestamp,
    event.address,
    signer,
    recipient,
    tokenID,
    uri
  );

  // create activity entity
  const currency = event.params.mintRequest.currency;
  const price = event.params.mintRequest.price;
  createActivity(activities.MINTED, currentBlock, event.transaction, token, null, signer, recipient, ONE_BIGINT, currency, price);
}

export function handleTransfer(event: TransferEvent): void {
  // init local vars from event params
  const from = event.params.from;
  const to = event.params.to;
  const tokenID = event.params.tokenId;

  // check if no tokenID or mint transaction, return
  if (tokenID.toString() == '' || from == NULL_ADDRESS) return;

  // check if token entity is exists, then update both parties token balances
  const tokenUID = generateTokenUID(event.address, tokenID);
  const token = Token.load(tokenUID);
  if (!token) return;
  transferTokenBalance(tokenUID, from, to, ONE_BIGINT);

  // create activity entity
  createActivity(activities.TRANSFERRED, event.block, event.transaction, token, null, from, to);
}

function _handleMint(currentTimestamp: BigInt, collection: Address, creator: Address, recipient: Address, tokenID: BigInt, tokenURI: string): Token {
  const tokenUID = generateTokenUID(collection, tokenID);

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
        const key = entry.key.trim();
        const attribute = new Attribute(generateTokenAttributeUID(tokenUID, key))
        attribute.token = tokenUID;
        attribute.key = key;
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
  createOrUpdateTokenBalance(tokenUID, recipient, ONE_BIGINT, true);
  return token;
}