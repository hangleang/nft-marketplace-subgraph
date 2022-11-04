import {
  InitializeCall,
  TokensMinted as TokensMintedEvent,
  TokensMintedWithSignature as TokensMintedWithSignatureEvent,
  Transfer as TransferEvent
} from "../generated/templates/ERC721Token/ERC721Token"
import { Collection, Token } from "../generated/schema"
import { ONE_BIGINT } from "./constants";
import * as collections from "./constants/collections";
import * as activities from "./constants/activities";
import { generateUID, loadContentFromURI } from "./utils";
import { createOrUpdateCollection } from "./modules/collection";
import { createOrUpdateToken, createOrUpdateTokenBalance, generateTokenName, transferTokenBalance } from "./modules/token";
import { createActivity } from "./modules/activity";

export function handleERC721TokenInitialized(call: InitializeCall): void {
  // define local vars from call params
  const currentTimestamp = call.block.timestamp;
  const collectionAddress = call.to;
  const contractURI = call.inputs._contractURI;
  const defaultAdmin = call.inputs._defaultAdmin;

  // init collection entity
  let collection = createOrUpdateCollection(collectionAddress, currentTimestamp);
  collection.collectionType = collections.ERC721Token;
  collection.metadataURI = contractURI;
  if (collection.creator !== defaultAdmin.toHex()) {
    collection.creator = defaultAdmin.toHex();
  }
  
  // fetch metadata from IPFS URI, then set metadata fields
  const content = loadContentFromURI(contractURI);
  if (content) {
    collection.title = content.mustGet("title").toString();
    collection.description = content.mustGet("description").toString();
    collection.featuredImage = content.mustGet("featuredImage").toString();
    collection.bannerImage = content.mustGet("bannerImage").toString();
    collection.externalLink = content.mustGet("externalLink").toString();
  } else {
    collection.title = call.inputs._name; 
  }
  collection.updatedAt = currentTimestamp;
  collection.save()

  // init create collection activity entity
  createActivity(activities.CreateCollection, call.block, call.transaction, null, collectionAddress, defaultAdmin, null);
}

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
  if (content) {
    token.name = content.mustGet("name").toString();
    token.description = content.mustGet("description").toString();
    token.content = content.mustGet("content").toString();
    token.externalLink = content.mustGet("externalLink").toString();
  } else {
    token.name = generateTokenName(collection, tokenID);
  }
  token.updatedAt = currentTimestamp;
  token.save();

  const recipient = event.params.mintedTo;
  // update token balance of recipient
  createOrUpdateTokenBalance(tokenUID, recipient, ONE_BIGINT);

  // create activity entity
  createActivity(activities.Minted, event.block, event.transaction, token, null, null, recipient);
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
    token.name = content.mustGet("name").toString();
    token.description = content.mustGet("description").toString();
    token.content = content.mustGet("content").toString();
    token.externalLink = content.mustGet("externalLink").toString();
  } else {
    token.name = generateTokenName(collection, tokenID);
  }
  token.updatedAt = currentTimestamp;
  token.save();

  const recipient = event.params.mintedTo;
  // update token balance of recipient
  createOrUpdateTokenBalance(tokenUID, recipient, ONE_BIGINT);

  // create activity entity
  const signer = event.params.signer;
  const currency = event.params.mintRequest.currency;
  const price = event.params.mintRequest.price;
  createActivity(activities.Minted, event.block, event.transaction, token, null, signer, recipient, ONE_BIGINT, currency, price);
}

export function handleTransfer(event: TransferEvent): void {
  const tokenUID = generateUID([event.address.toHex(), event.params.tokenId.toString()], "/")
  transferTokenBalance(tokenUID, event.params.from, event.params.to, ONE_BIGINT);

  // create activity entity
  const token = Token.load(tokenUID);
  if (!token) return;
  createActivity(activities.Transferred, event.block, event.transaction, token, null, null, null);
}
