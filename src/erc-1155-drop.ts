import {
  ERC1155Drop,
  TokensClaimed as TokensClaimedEvent,
  TokensLazyMinted as TokensLazyMintedEvent,
  TransferBatch as TransferBatchEvent,
  TransferSingle as TransferSingleEvent,
  ClaimConditionsUpdated as ClaimConditionsUpdatedEventEvent,
} from "../generated/templates/ERC1155Drop/ERC1155Drop"
import { Token, Attribute, DropClaimCondition } from "../generated/schema"

import * as activities from "./constants/activities";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { getString, loadContentFromURI } from "./utils";
import { createOrUpdateToken, createOrUpdateTokenBalance, generateTokenAttributeUID, generateTokenName, generateTokenUID, setTokenDropDetail, transferTokenBalance } from "./modules/token";
import { NULL_ADDRESS, ONE_BIGINT, ZERO_BIGINT } from "./constants";
import { createActivity } from "./modules/activity";
import { createOrLoadDropDetails, generateDropClaimConditionUID, generateDropDetailsUID, increaseSupplyClaimed } from "./modules/drop";

export function handleTokensClaimed(event: TokensClaimedEvent): void {
  // init local vars from event params
  const currentBlock = event.block;
  const collection = event.address;
  const claimer = event.params.claimer;
  const receiver = event.params.receiver;
  const quantity = event.params.quantityClaimed;
  const tokenID = event.params.tokenId;

  const tokenUID = generateTokenUID(collection, tokenID);
  const token = Token.load(tokenUID);

  let count = 0;
  if (token) {
    token.isLazyMinted = false;
    token.updatedAt = currentBlock.timestamp;
    token.save();

    // update token balance of `receiver`
    createOrUpdateTokenBalance(tokenUID, receiver, quantity, true);

    // create `claimed` and `minted` activity entity
    //! TODO: get info from claim condition by index to set the additional fields
    createActivity(activities.CLAIMED, currentBlock, event.transaction, token, null, claimer, receiver, ONE_BIGINT);
    createActivity(activities.MINTED, currentBlock, event.transaction, token, null, receiver, receiver, ONE_BIGINT);
    count++;
  }

  // increase supply claimed in claim conditions
  const dropDetailUID = generateDropDetailsUID(collection.toHex());
  increaseSupplyClaimed(dropDetailUID, BigInt.fromI32(count));
}

export function handleTokensLazyMinted(event: TokensLazyMintedEvent): void {
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

export function handleTransferBatch(event: TransferBatchEvent): void {
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
    const tokenUID = generateTokenUID(event.address, tokenID);
    const token = Token.load(tokenUID);
    if (!token) return;
    transferTokenBalance(tokenUID, from, to, value);

    // create activity entity
    createActivity(activities.TRANSFERRED, event.block, event.transaction, token, null, from, to, value);
  }
}

export function handleTransferSingle(event: TransferSingleEvent): void {
  // init local vars from event params
  const from = event.params.from;
  const to = event.params.to;
  const tokenID = event.params.id;
  const value = event.params.value;

  // check if no tokenID or mint transaction, return
  if (tokenID.toString() == '' || from == NULL_ADDRESS) return;

  // check if token entity is exists, then update both parties token balances
  const tokenUID = generateTokenUID(event.address, tokenID);
  const token = Token.load(tokenUID);
  if (!token) return;
  transferTokenBalance(tokenUID, from, to, value);

  // create activity entity
  createActivity(activities.TRANSFERRED, event.block, event.transaction, token, null, from, to, value);
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
  const tokenURI = ERC1155Drop.bind(collection).uri(tokenID);
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
  token.tokenURI = tokenURI.toString();
  token.updatedAt = currentTimestamp;
  token.save();
}

export function handlerClaimConditionsUpdated(event: ClaimConditionsUpdatedEventEvent): void {
  // init local vars from event params
  const dropAddress = event.address;
  const tokenID = event.params.tokenId;
  const currentStartID = event.params.currentStartId;
  const totalPhase = event.params.count;
  const erc1155Drop = ERC1155Drop.bind(dropAddress);

  // init drop details entity
  const tokenUID = generateTokenUID(dropAddress, tokenID);
  const dropDetailUID = generateDropDetailsUID(tokenUID);
  const dropDetail = createOrLoadDropDetails(dropDetailUID);
  dropDetail.startClaimConditionID = currentStartID;
  dropDetail.count = totalPhase; 
  dropDetail.save();
  
  // update token entity with drop detail UID
  setTokenDropDetail(tokenUID, dropDetailUID);
  
  // loop through all the claim conditions, then init each 
  // const endClaimConditionID = nextStartClaimConditionID.plus(BigInt.fromI32(claimConditions.length));
  for (let i = ZERO_BIGINT; i < totalPhase; i.plus(ONE_BIGINT)) {
    const claimConditionID = currentStartID.plus(i);
    const claimCondition = erc1155Drop.getClaimConditionById(tokenID, claimConditionID);
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