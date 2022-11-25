import {
  ERC721Drop,
  ERC721DropClaimConditionsUpdated as ClaimConditionsUpdatedEvent,
  ERC721DropTokensClaimed as ERC721DropTokensClaimedEvent,
  ERC721DropTokensLazyMinted as ERC721DropTokensLazyMintedEvent,
  ERC721DropTransfer as ERC721DropTransferEvent,
  NFTRevealed as NFTRevealedEvent,
} from "../generated/templates/ERC721Drop/ERC721Drop"
import { Token, Attribute, DropClaimCondition } from "../generated/schema"
import { NULL_ADDRESS, ONE_BIGINT, ZERO_BIGINT } from "./constants";
import { getString, loadContentFromURI } from "./utils";
import { createOrUpdateToken, createOrUpdateTokenBalance, generateTokenAttributeUID, generateTokenName, generateTokenUID, transferTokenBalance } from "./modules/token";
import { createActivity } from "./modules/activity";

import * as activities from "./constants/activities";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { createOrLoadDropDetails, generateDropClaimConditionUID, generateDropDetailsUID, increaseSupplyClaimed } from "./modules/drop";
import { setCollectionDropDetail } from "./modules/collection";

export function handleNFTRevealed(event: NFTRevealedEvent): void {
  // init local vars from event params
  const currentTimestamp = event.block.timestamp;
  const collection = event.address;
  const startTokenID = event.params.startTokenId;
  const endTokenID = event.params.endTokenId;
  // const revealedURI = event.params.revealedURI;

  for(let tokenID = startTokenID; tokenID <= endTokenID; tokenID.plus(ONE_BIGINT)) {
    const tokenUID = generateTokenUID(collection, tokenID);
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

  let count = 0;
  for(let tokenID = startTokenID; tokenID <= endTokenID; tokenID.plus(ONE_BIGINT)) {
    const tokenUID = generateTokenUID(collection, tokenID);
    const token = Token.load(tokenUID);

    if (token) {
      token.isLazyMinted = false;
      token.updatedAt = currentBlock.timestamp;
      token.save();

      // update token balance of `receiver`
      createOrUpdateTokenBalance(tokenUID, receiver, ONE_BIGINT, true);

      // create `claimed` and `minted` activity entity
      //! TODO: get info from claim condition by index to set the additional fields
      createActivity(activities.CLAIMED, currentBlock, event.transaction, event.logIndex, token, null, claimer, null, ONE_BIGINT);
      createActivity(activities.MINTED, currentBlock, event.transaction, event.logIndex, token, null, receiver, null, ONE_BIGINT);
      count++;
    }
  }

  // increase supply claimed in claim conditions
  const dropDetailUID = generateDropDetailsUID(collection.toHex());
  increaseSupplyClaimed(dropDetailUID, BigInt.fromI32(count));
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
  const tokenID = event.params.tokenId;

  // check if no tokenID or mint transaction, return
  if (tokenID.toString() == '' || from == NULL_ADDRESS) return;

  // check if token entity is exists, then update both parties token balances
  const tokenUID = generateTokenUID(event.address, tokenID);
  const token = Token.load(tokenUID);
  if (!token) return;
  transferTokenBalance(tokenUID, from, to, ONE_BIGINT);

  // create transferred activity entity
  createActivity(activities.TRANSFERRED, event.block, event.transaction, event.logIndex, token, null, from, to);
}

function _handleLazyMint(currentTimestamp: BigInt, collection: Address, creator: Address, _baseURI: string, tokenID: BigInt): void {
  const tokenUID = generateTokenUID(collection, tokenID);
  
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
    token.name = name ? name : generateTokenName(collection, tokenID);
    token.description = getString(content, "description");
    token.content = getString(content, "image");
    token.externalURL = getString(content, "external_url");
    token.fallbackURL = getString(content, "fallback_url");

    // get attributes link to this token
    const attributes = content.get("attributes");
    if (attributes) {
      const attributesEntries = attributes.toObject().entries;
      for (let i = 0; i < attributesEntries.length; i++) {
        const entry = attributesEntries[i];
        const key = entry.key.trim();
        const attribute = new Attribute(generateTokenAttributeUID(token.id, key));
        attribute.token = token.id;
        attribute.key = key;
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

export function handlerClaimConditionsUpdated(event: ClaimConditionsUpdatedEvent): void {
  // init local vars from event params
  const dropAddress = event.address;
  const currentStartID = event.params.currentStartId;
  const totalPhase = event.params.count;
  const erc721Drop = ERC721Drop.bind(dropAddress);

  // init drop details entity
  const dropDetailUID = generateDropDetailsUID(dropAddress.toHex());
  const dropDetail = createOrLoadDropDetails(dropDetailUID);
  dropDetail.startClaimConditionID = currentStartID;
  dropDetail.count = totalPhase; 
  dropDetail.save();
  
  // update collection entity with drop detail UID
  setCollectionDropDetail(dropAddress, dropDetailUID);
  
  // loop through all the claim conditions, then init each 
  // const endClaimConditionID = nextStartClaimConditionID.plus(BigInt.fromI32(claimConditions.length));
  for (let i = ZERO_BIGINT; i < totalPhase; i.plus(ONE_BIGINT)) {
    const claimConditionID = currentStartID.plus(i);
    const claimCondition = erc721Drop.getClaimConditionById(claimConditionID);
    const dropClaimConditionUID = generateDropClaimConditionUID(dropDetailUID, claimConditionID);
    const dropClaimCondition = new DropClaimCondition(dropClaimConditionUID);
    dropClaimCondition.drop = dropDetailUID;
    dropClaimCondition.startTimestamp = claimCondition.startTimestamp;
    dropClaimCondition.maxClaimableSupply = claimCondition.maxClaimableSupply;
    dropClaimCondition.quantityLimit = claimCondition.quantityLimitPerTransaction;
    dropClaimCondition.price = claimCondition.pricePerToken;
    dropClaimCondition.currency = claimCondition.currency;
    dropClaimCondition.save();
  }
}
