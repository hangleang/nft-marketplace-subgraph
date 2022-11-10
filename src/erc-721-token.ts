import {
  TokensMinted as TokensMintedEvent,
  TokensMintedWithSignature as TokensMintedWithSignatureEvent,
  Transfer as TransferEvent
} from "../generated/templates/ERC721Token/ERC721Token"
import { Token } from "../generated/schema"
import { ONE_BIGINT } from "./constants";
import * as activities from "./constants/activities";
import { generateUID, getString, loadContentFromURI } from "./utils";
import { createOrUpdateToken, createOrUpdateTokenBalance, generateTokenName, transferTokenBalance } from "./modules/token";
import { createActivity } from "./modules/activity";

export function handleTokensMinted(event: TokensMintedEvent): void {
  // define local vars from call params
  const currentTimestamp = event.block.timestamp;
  const collection = event.address.toHex();
  const tokenID = event.params.tokenIdMinted;
  const tokenURI = event.params.uri;
  const tokenUID = generateUID([collection, tokenID.toString()], "/");

  // init token entity
  let token = createOrUpdateToken(tokenUID, currentTimestamp);
  token.collection = collection;
  token.tokenId = tokenID;
  token.tokenURI = tokenURI;

  // fetch metadata from IPFS URI, then set metadata fields
  const content = loadContentFromURI(tokenURI);
  token.name = generateTokenName(collection, tokenID);
  if (content) {
    const name = getString(content, "name");
    const contentURI = getString(content, "content");
    token.name = name ? name : generateTokenName(collection, tokenID);
    token.description = getString(content, "description");
    token.content = contentURI ? contentURI : "";
    token.externalLink = getString(content, "externalLink");
  } 
  token.updatedAt = currentTimestamp;

  const recipient = event.params.mintedTo;
  // update token balance of recipient
  createOrUpdateTokenBalance(tokenUID, recipient, ONE_BIGINT, true);

  // create activity entity
  createActivity(activities.MINTED, event.block, event.transaction, token, null, null, recipient);
  token.save();
}

export function handleTokensMintedWithSignature(
  event: TokensMintedWithSignatureEvent
): void {
  // define local vars from call params
  const currentTimestamp = event.block.timestamp;
  const collection = event.address.toHex();
  const tokenID = event.params.tokenIdMinted;
  const tokenURI = event.params.mintRequest.uri;
  const tokenUID = generateUID([collection, tokenID.toString()], "/");

  // init token entity
  let token = createOrUpdateToken(tokenUID, currentTimestamp);
  token.collection = collection;
  token.tokenId = tokenID;
  token.tokenURI = tokenURI;

  // fetch metadata from IPFS URI, then set metadata fields
  const content = loadContentFromURI(tokenURI);
  if (content) {
    const name = getString(content, "name");
    const contentURI = getString(content, "content");
    token.name = name ? name : generateTokenName(collection, tokenID);
    token.description = getString(content, "description");
    token.content = contentURI ? contentURI : "";
    token.externalLink = getString(content, "externalLink");
  } else {
    token.name = generateTokenName(collection, tokenID);
  }
  token.updatedAt = currentTimestamp;
  
  const recipient = event.params.mintedTo;
  // update token balance of recipient
  createOrUpdateTokenBalance(tokenUID, recipient, ONE_BIGINT, true);
  
  // create activity entity
  const signer = event.params.signer;
  const currency = event.params.mintRequest.currency;
  const price = event.params.mintRequest.price;
  createActivity(activities.MINTED, event.block, event.transaction, token, null, signer, recipient, ONE_BIGINT, currency, price);
  token.save();
}

export function handleTransfer(event: TransferEvent): void {
  if (event.params.tokenId.toString() == '') return;

  const tokenUID = generateUID([event.address.toHex(), event.params.tokenId.toString()], "/")
  transferTokenBalance(tokenUID, event.params.from, event.params.to, ONE_BIGINT);

  // create activity entity
  const token = Token.load(tokenUID);
  if (!token) return;
  createActivity(activities.TRANSFERRED, event.block, event.transaction, token, null, null, null);
  token.save();
}
