import {
  INFTs,
  IERC721TokensLazyMinted as IERC721TokensLazyMintedEvent,
  IERC721MaxTotalSupplyUpdated as IERC721MaxTotalSupplyUpdatedEvent,
  IERC721ClaimConditionsUpdated as IERC721ClaimConditionsUpdatedEvent,
	IERC721MaxWalletClaimCountUpdated as IERC721MaxWalletClaimCountUpdatedEvent,
  DefaultRoyalty as DefaultRoyaltyEvent,
	RoyaltyForToken as RoyaltyForTokenEvent,
  // IERC721TokensClaimed as IERC721TokensClaimedEvent,
  // NFTRevealed as NFTRevealedEvent,
  // URI as URIEvent,
} from "../generated/templates/NFTs/INFTs";
import { createOrLoadCollection } from "./modules/collection";
import {
  createOrLoadDropDetails,
  generateDropClaimConditionUID,
  createOrLoadDropClaimCondition,
} from "./modules/drop";

import { HUNDRED_DECIMAL, ONE_BIGINT } from "./constants";
import { store } from "@graphprotocol/graph-ts";
import { createOrLoadToken } from "./modules/token";

export function handleDefaultRoyalty(event: DefaultRoyaltyEvent): void {
	// init local vars from event params
  const currentBlock 	= event.block;
	const royaltyFee 		= event.params.newRoyaltyBps.divDecimal(HUNDRED_DECIMAL)

  // Try create new collection entity, if not yet exist
  const collection = createOrLoadCollection(
    event.address,
    currentBlock.timestamp
  );

	collection.royaltyFee = royaltyFee;
	collection.updatedAt 	= currentBlock.timestamp;
	collection.save()
}

export function handleRoyaltyForToken(event: RoyaltyForTokenEvent): void {
	// init local vars from event params
  const currentBlock 	= event.block;
	const tokenId 			= event.params.tokenId;
	const royaltyFee 		= event.params.royaltyBps.divDecimal(HUNDRED_DECIMAL)

  // Try create new collection entity, if not yet exist
  const collection = createOrLoadCollection(
    event.address,
    currentBlock.timestamp
  );

	const token 			= createOrLoadToken(collection, tokenId);
	token.royaltyFee 	= royaltyFee;
	token.save()
}

export function handleIERC721TokensLazyMinted(
  event: IERC721TokensLazyMintedEvent
): void {
  // init local vars from event params
  const currentBlock = event.block;

  // Try create new collection entity, if not yet exist
  const collection = createOrLoadCollection(
    event.address,
    currentBlock.timestamp
  );
  const dropDetail = createOrLoadDropDetails(collection.id);

  collection.dropDetails 	= dropDetail.id;
	collection.updatedAt 		= currentBlock.timestamp;
  collection.save();
}

export function handleIERC721MaxTotalSupplyUpdated(
  event: IERC721MaxTotalSupplyUpdatedEvent
): void {
  // init local vars from event params
  const currentBlock = event.block;
  const maxTotalSupply = event.params.maxTotalSupply;

  // Try create new collection entity, if not yet exist
  const collection = createOrLoadCollection(
    event.address,
    currentBlock.timestamp
  );

  const dropDetail = createOrLoadDropDetails(collection.id);
  dropDetail.maxTotalSupply = maxTotalSupply;
  dropDetail.save();

  // Set drop detail ID on collection entity
  collection.dropDetails = dropDetail.id;
  collection.save();
}

export function handleIERC721MaxWalletClaimCountUpdated(event: IERC721MaxWalletClaimCountUpdatedEvent): void {
	// init local vars from event params
  const currentBlock = event.block;
  const maxWalletClaim = event.params.count;

  // Try create new collection entity, if not yet exist
  const collection = createOrLoadCollection(
    event.address,
    currentBlock.timestamp
  );

  const dropDetail = createOrLoadDropDetails(collection.id);
  dropDetail.maxWalletClaim = maxWalletClaim;
  dropDetail.save();

  // Set drop detail ID on collection entity
  collection.dropDetails 		= dropDetail.id;
  collection.save();
}

export function handleIERC721ClaimConditionsUpdated(
  event: IERC721ClaimConditionsUpdatedEvent
): void {
  // Init local vars from event params
  const currentBlock = event.block;
  const currentStartId = event.params.currentStartId;
  const count = event.params.count;
  const resetClaim = event.params.resetClaimEligibility;

  // Try create new collection entity, if not yet exist
  const collection = createOrLoadCollection(
    event.address,
    currentBlock.timestamp
  );
  const dropDetail = createOrLoadDropDetails(collection.id);

  const existingStartIndex = dropDetail.startClaimConditionId;
  const existingPhaseCount = dropDetail.count;

  // reset claim conditions
  if (resetClaim) {
    for (let i = existingStartIndex; i < currentStartId; i.plus(ONE_BIGINT)) {
      const id = generateDropClaimConditionUID(dropDetail.id, i);

      store.remove("DropClaimCondition", id);
    }
  } else if (existingPhaseCount > count) {
    for (let i = count; i < existingPhaseCount; i.plus(ONE_BIGINT)) {
      const id = generateDropClaimConditionUID(dropDetail.id, i);

      store.remove("DropClaimCondition", id);
    }
  }

  dropDetail.startClaimConditionId = currentStartId;
  dropDetail.count = count;
  dropDetail.save();

  // loop through all the claim conditions, then init each
  const endClaimConditionID = currentStartId.plus(count);
  const erc721drop = INFTs.bind(event.address);
  for (
    let claimConditionID = currentStartId;
    claimConditionID <= endClaimConditionID;
    claimConditionID.plus(ONE_BIGINT)
  ) {
    const try_claimCondition = erc721drop.try_getClaimConditionById1(
      claimConditionID
    );
    if (!try_claimCondition.reverted) {
      const claimCondition = try_claimCondition.value;

      const dropCondition = createOrLoadDropClaimCondition(
        dropDetail,
        claimConditionID
      );
      dropCondition.startTimestamp 			= claimCondition.startTimestamp;
      dropCondition.maxClaimableSupply 	= claimCondition.maxClaimableSupply;
      dropCondition.quantityLimit 			= claimCondition.quantityLimitPerTransaction;
      dropCondition.waitBetweenClaims 	=
        claimCondition.waitTimeInSecondsBetweenClaims;
      dropCondition.merkleRoot 					= claimCondition.merkleRoot;
      dropCondition.price 							= claimCondition.pricePerToken;
      dropCondition.currency 						= claimCondition.currency;
      dropCondition.save();
    }
  }
}

// export function handleURI(event: URIEvent): void {
//     const currentBlock      = event.block

//     // Try create new collection entity, if not yet exist
//     const collection        = createOrLoadCollection(event.address, currentBlock.timestamp)
//     if (collection != null) {
//         let token           = createOrLoadToken(collection, event.params.id, currentBlock.timestamp)
//         const tokenURI      = replaceURI(event.params.value, event.params.id)
//         token.tokenURI      = formatURI(tokenURI, null)
//         token.updatedAt     = currentBlock.timestamp
//         token.save()

//         resolveTokenMetadata(token.id, tokenURI)
//     }
// }

// export function handleIERC721TokensClaimed(event: IERC721TokensClaimedEvent): void {
//     // init local vars from event params
//     const currentBlock      = event.block
//     const claimerAddress    = event.params.claimer
//     const receiverAddress   = event.params.receiver
//     const startTokenId      = event.params.startTokenId
//     const quantity          = event.params.quantityClaimed
//     const claimIdx          = event.params.claimConditionIndex

//     // Try create new collection entity, if not yet exist
//     const collection        = createOrLoadCollection(event.address, currentBlock.timestamp)
//     if (collection != null) {
//         createOrLoadAccount(claimerAddress)
//         createOrLoadAccount(receiverAddress)

//         registerClaimed(collection, claimerAddress, receiverAddress, claimIdx, startTokenId, quantity, event)
//     }
// }

// export function handleNFTRevealed(event: NFTRevealedEvent): void {
//     // init local vars from event params
//     const currentBlock      = event.block
//     const startTokenId      = event.params.startTokenId
//     const endTokenId        = event.params.endTokenId
//     const revealedURI       = event.params.revealedURI

//     // Try create new collection entity, if not yet exist
//     const collection        = createOrLoadCollection(event.address, currentBlock.timestamp)
//     if (collection != null) {
//         for (let tokenId = startTokenId; tokenId <= endTokenId; tokenId = tokenId.plus(ONE_BIGINT)) {
//             let token       = createOrLoadToken(collection, tokenId, currentBlock.timestamp)
//             const tokenURI  = replaceURI(revealedURI, tokenId)
//             token.tokenURI  = formatURI(tokenURI, null)
//             token.updatedAt = currentBlock.timestamp
//             token.save()

//             resolveTokenMetadata(token.id, tokenURI)
//         }
//     }
// }

// function registerClaimed(collection: Collection, claimerAddress: Address, receiverAddress: Address, claimIdx: BigInt, startTokenId: BigInt, quantity: BigInt, event: ethereum.Event): void {
//     if (collection.collectionType == collections.SINGLE) {
//         const dropDetail    = createOrLoadDropDetails(collection.id)
//         const dropCondition = createOrLoadDropClaimCondition(dropDetail, claimIdx)
//         const endTokenId    = startTokenId.plus(quantity)

//         for (let tokenId = startTokenId; tokenId <= endTokenId; tokenId = tokenId.plus(ONE_BIGINT)) {
//             let token       = createOrLoadToken(collection, tokenId, event.block.timestamp)

//             // Create claimed activity entity
//             createActivity(activities.CLAIMED, event, token, claimerAddress, receiverAddress, ONE_BIGINT, dropCondition.currency, dropCondition.price.toBigDecimal())
//         }
//     } else if (collection.collectionType == collections.MULTI) {
//         let token           = createOrLoadToken(collection, startTokenId, event.block.timestamp)

//         const dropDetail    = createOrLoadDropDetails(token.id)
//         const dropCondition = createOrLoadDropClaimCondition(dropDetail, claimIdx)

//         // Create claimed activity entity
//         createActivity(activities.CLAIMED, event, token, claimerAddress, receiverAddress, quantity, dropCondition.currency, dropCondition.price.toBigDecimal());
//     }
// }
