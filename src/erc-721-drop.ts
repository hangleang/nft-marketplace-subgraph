import {
  NFTRevealed as NFTRevealedEvent,
  ERC721DropTokensClaimed as ERC721DropTokensClaimedEvent,
  ERC721DropTokensLazyMinted as ERC721DropTokensLazyMintedEvent,
  ERC721DropTransfer as ERC721DropTransferEvent,
  ERC721Drop,
} from "../generated/templates/ERC721Drop/ERC721Drop"
import { Token, Attribute } from "../generated/schema"
import { NULL_ADDRESS, ONE_BIGINT } from "./constants";
import { generateUID, getString, loadContentFromURI } from "./utils";
import { createOrUpdateToken, createOrUpdateTokenBalance, generateTokenName, transferTokenBalance } from "./modules/token";
import { createActivity } from "./modules/activity";

import * as activities from "./constants/activities";
import { Address, BigInt } from "@graphprotocol/graph-ts";

export function handleNFTRevealed(event: NFTRevealedEvent): void {
  // init local vars from event params
  const currentTimestamp = event.block.timestamp;
  const collection = event.address;
  const startTokenID = event.params.startTokenId;
  const endTokenID = event.params.endTokenId;
  // const revealedURI = event.params.revealedURI;

  for(let tokenID = startTokenID; tokenID <= endTokenID; tokenID.plus(ONE_BIGINT)) {
    const tokenUID = generateUID([collection.toHex(), tokenID.toString()], "/");
    let token = Token.load(tokenUID);

    if (token) {
      // fetch metadata from IPFS URI, then set metadata fields
      token = _updateTokenMetadata(collection, token, tokenID);
      token.updatedAt = currentTimestamp;
      token.save();
    }
  }
}

export function handleERC721DropTokensClaimed(
  event: ERC721DropTokensClaimedEvent
): void {
  // init local vars from event params
  const currentBlock = event.block;
  const collection = event.address;
  const claimer = event.params.claimer;
  const receiver = event.params.receiver;
  const quantity = event.params.quantityClaimed;
  const startTokenID = event.params.startTokenId;
  const endTokenID = startTokenID.plus(quantity);

  for(let tokenID = startTokenID; tokenID <= endTokenID; tokenID.plus(ONE_BIGINT)) {
    const tokenUID = generateUID([collection.toHex(), tokenID.toString()], "/");
    const token = Token.load(tokenUID);

    if (token) {
      token.isLazyMinted = false;
      token.updatedAt = currentBlock.timestamp;
      token.save();

      // update token balance of `receiver`
      createOrUpdateTokenBalance(tokenUID, receiver, ONE_BIGINT, true);
  
      // create `claimed` and `minted` activity entity
      //! TODO: get info from claim condition by index to set the additional fields
      createActivity(activities.CLAIMED, currentBlock, event.transaction, token, null, claimer, receiver, ONE_BIGINT);
      createActivity(activities.MINTED, currentBlock, event.transaction, token, null, receiver, receiver, ONE_BIGINT);
    }
  }
}

export function handleERC721DropTokensLazyMinted(
  event: ERC721DropTokensLazyMintedEvent
): void {
  // init local vars from event params
  const currentBlock = event.block;
  const signer = event.transaction.from;
  const startTokenID = event.params.startTokenId;
  const endTokenID = event.params.endTokenId;
  const baseURI = event.params.baseURI;

  // generate token entity
  for(let tokenID = startTokenID; tokenID <= endTokenID; tokenID.plus(ONE_BIGINT)) {
    _handleLazyMint(
      currentBlock.timestamp,
      event.address,
      signer,
      baseURI,
      tokenID
    );
  }
}

export function handleERC721DropTransfer(event: ERC721DropTransferEvent): void {
  // init local vars from event params
  const from = event.params.from;
  const to = event.params.to;
  const tokenID = event.params.tokenId.toString();

  // check if no tokenID or mint transaction, return
  if (tokenID == '' || from == NULL_ADDRESS) return;

  // check if token entity is exists, then update both parties token balances
  const tokenUID = generateUID([event.address.toHex(), tokenID], "/");
  const token = Token.load(tokenUID);
  if (!token) return;
  transferTokenBalance(tokenUID, from, to, ONE_BIGINT);

  // create transferred activity entity
  createActivity(activities.TRANSFERRED, event.block, event.transaction, token, null, from, to);
}

function _handleLazyMint(currentTimestamp: BigInt, collection: Address, creator: Address, _baseURI: string, tokenID: BigInt): void {
  const tokenUID = generateUID([collection.toHex(), tokenID.toString()], "/");
  
  // init token entity
  let token = createOrUpdateToken(tokenUID, currentTimestamp);
  token.collection = collection.toHex();
  token.creator = creator.toHex();
  token.tokenId = tokenID;
  token.isLazyMinted = true;
  
  // fetch metadata from IPFS URI, then set metadata fields
  token = _updateTokenMetadata(collection, token, tokenID);
  token.updatedAt = currentTimestamp;
  token.save();
}

function _updateTokenMetadata(collection: Address, token: Token, tokenID: BigInt): Token {
  const tokenURI = ERC721Drop.bind(collection).tokenURI(tokenID);
  const content = loadContentFromURI(tokenURI.toString());

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
        const attribute = new Attribute(generateUID([token.id, entry.key], "/"))
        attribute.token = token.id;
        attribute.key = entry.key.trim();
        attribute.value = entry.value.toString();
        attribute.save();
      }
    }
  } else {
    token.name = generateTokenName(collection, tokenID);
  }
  token.tokenURI = tokenURI.toString();
  return token;
}