import {
  TokensMinted as TokensMintedEvent,
  TokensMintedWithSignature as TokensMintedWithSignatureEvent,
  Transfer as TransferEvent
} from "../generated/templates/ERC721Token/ERC721Token"
import { Attribute, Token } from "../generated/schema"
import { NULL_ADDRESS, ONE_BIGINT } from "./constants";
import * as activities from "./constants/activities";
import { generateUID, getString, loadContentFromURI } from "./utils";
import { createOrUpdateToken, createOrUpdateTokenBalance, generateTokenName, transferTokenBalance } from "./modules/token";
import { createActivity } from "./modules/activity";
import { Address, BigInt } from "@graphprotocol/graph-ts";

export function handleTokensMinted(event: TokensMintedEvent): void {
  const token = _handleMint(
    event.block.timestamp,
    event.address,
    event.params.mintedTo,
    event.params.tokenIdMinted,
    event.params.uri
  );

  // create activity entity
  createActivity(activities.MINTED, event.block, event.transaction, token, null, null, event.params.mintedTo, ONE_BIGINT);
}

export function handleTokensMintedWithSignature(
  event: TokensMintedWithSignatureEvent
): void {
  const token = _handleMint(
    event.block.timestamp,
    event.address,
    event.params.mintedTo,
    event.params.tokenIdMinted,
    event.params.mintRequest.uri
  );

  // create activity entity
  const signer = event.params.signer;
  const currency = event.params.mintRequest.currency;
  const price = event.params.mintRequest.price;
  createActivity(activities.MINTED, event.block, event.transaction, token, null, signer, event.params.mintedTo, ONE_BIGINT, currency, price);
}

export function handleTransfer(event: TransferEvent): void {
  if (event.params.tokenId.toString() == '' || event.params.from == NULL_ADDRESS) return;

  const tokenUID = generateUID([event.address.toHex(), event.params.tokenId.toString()], "/")
  transferTokenBalance(tokenUID, event.params.from, event.params.to, ONE_BIGINT);

  // create activity entity
  const token = Token.load(tokenUID);
  if (!token) return;
  createActivity(activities.TRANSFERRED, event.block, event.transaction, token, null, null, null);
  token.save();
}

function _handleMint(currentTimestamp: BigInt, collection: Address, recipient: Address, tokenID: BigInt, tokenURI: string): Token {
  const tokenUID = generateUID([collection.toHex(), tokenID.toString()], "/");

  // init token entity
  let token = createOrUpdateToken(tokenUID, currentTimestamp);
  token.collection = collection.toHex();
  token.tokenId = tokenID;
  token.tokenURI = tokenURI;

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
  createOrUpdateTokenBalance(tokenUID, recipient, ONE_BIGINT, true);
  return token;
}