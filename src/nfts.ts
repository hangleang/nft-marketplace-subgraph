import {
    ApprovalForAll as ApprovalForAllEvent,
    TransferSingle as TransferSingleEvent,
    TransferBatch as TransferBatchEvent,
    URI as URIEvent,
    TokensLazyMinted as TokensLazyMintedEvent,
    MaxTotalSupplyUpdated as MaxTotalSupplyUpdatedEvent,
    ClaimConditionsUpdated as ClaimConditionsUpdatedEvent,
    TokensClaimed as TokensClaimedEvent,
    Transfer as TransferEvent,
    Approval as ApprovalEvent,
    IERC721TokensLazyMinted as IERC721TokensLazyMintedEvent,
    IERC721MaxTotalSupplyUpdated as IERC721MaxTotalSupplyUpdatedEvent,
    IERC721ClaimConditionsUpdated as IERC721ClaimConditionsUpdatedEvent,
    IERC721TokensClaimed as IERC721TokensClaimedEvent,
    NFTRevealed as NFTRevealedEvent,
    INFTs
} from '../generated/NFTs/INFTs';
import { createOrLoadAccount } from './modules/account';
import { createOrLoadCollection } from './modules/collection';
import { createActivity } from './modules/activity';
import { createOrLoadOperator } from './modules/operator';
import { createOrLoadToken, registerTransfer, updateTokenMetadata } from './modules/token';
import { createOrLoadDropDetails, generateDropClaimConditionUID, createOrLoadDropClaimCondition } from './modules/drop';

import * as activities from './constants/activities';
import * as collections from './constants/collections';
import { ONE_BIGINT } from './constants';
import { Address, BigInt, ethereum, store } from '@graphprotocol/graph-ts';
import { replaceURI } from './utils';
import { Collection } from '../generated/schema';

export function handleTransferSingle(event: TransferSingleEvent): void {
    // Init local vars from event params
    const fromAddress   = event.params.from
    const toAddress     = event.params.to
    const opAddress     = event.params.operator
    const tokenId       = event.params.id
    const value         = event.params.value
    const currentBlock  = event.block

    // Try create new collection entity, if not yet exist
	const collection      = createOrLoadCollection(event.address, currentBlock.timestamp)
    if (collection != null) {
        const operator  = createOrLoadAccount(opAddress)
        const from      = createOrLoadAccount(fromAddress)
        const to        = createOrLoadAccount(toAddress)

        registerTransfer(event, collection, from, to, tokenId, value, currentBlock.timestamp)
    }
}

export function handleTransferBatch(event: TransferBatchEvent): void {
    // Init local vars from event params
    const fromAddress   = event.params.from
    const toAddress     = event.params.to
    const opAddress     = event.params.operator
    const tokenIds      = event.params.ids
    const values        = event.params.values
    const currentBlock  = event.block

    // Try create new collection entity, if not yet exist
	const collection      = createOrLoadCollection(event.address, currentBlock.timestamp)
    if (collection != null) {
        const operator  = createOrLoadAccount(opAddress)
        const from      = createOrLoadAccount(fromAddress)
        const to        = createOrLoadAccount(toAddress)
        
        // Make sure these length are equal
        if(tokenIds.length == values.length) {
            for (let i = 0; i < tokenIds.length; i++) {
                registerTransfer(event, collection, from, to, tokenIds[i], values[i], currentBlock.timestamp)
            }
        }
    }
}

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
	// Init local vars from event params
    const ownerAddress      = event.params.account
    const operatorAddress   = event.params.operator
    const approved          = event.params.approved
    const currentBlock      = event.block

    // Try create new collection entity, if not yet exist
    const collection        = createOrLoadCollection(event.address, currentBlock.timestamp)
    if (collection != null) {
        const owner         = createOrLoadAccount(ownerAddress)
        const operator      = createOrLoadAccount(operatorAddress)
        const delegation    = createOrLoadOperator(collection, owner, operator)

        delegation.approved = approved;
        delegation.save()
    }
}

export function handleURI(event: URIEvent): void {
    const currentBlock      = event.block

    // Try create new collection entity, if not yet exist
    const collection        = createOrLoadCollection(event.address, currentBlock.timestamp)
    if (collection != null) {
        let token           = createOrLoadToken(collection, event.params.id, currentBlock.timestamp)
        const tokenURI      = replaceURI(event.params.value, event.params.id)
        token               = updateTokenMetadata(token, tokenURI)
        token.updatedAt     = currentBlock.timestamp
        token.save()
    }
}

export function handleTokensLazyMinted(event: TokensLazyMintedEvent): void {
    // init local vars from event params
    const currentBlock  = event.block;
    const startTokenId  = event.params.startTokenId;
    const endTokenId    = event.params.endTokenId;

    // Try create new collection entity, if not yet exist
    const collection    = createOrLoadCollection(event.address, currentBlock.timestamp)
    if (collection != null) {
        for (let tokenId = startTokenId; tokenId <= endTokenId; tokenId = tokenId.plus(ONE_BIGINT)) {
            const token         = createOrLoadToken(collection, tokenId, currentBlock.timestamp)
            const dropDetail    = createOrLoadDropDetails(token.id)

            token.dropDetails   = dropDetail.id
            token.save()
        }
    }
}

export function handleMaxTotalSupplyUpdated(event: MaxTotalSupplyUpdatedEvent): void {
    // init local vars from event params
    const currentBlock      = event.block;
    const tokenId           = event.params.tokenId;
    const maxTotalSupply    = event.params.maxTotalSupply;

    // Try create new collection entity, if not yet exist
    const collection    = createOrLoadCollection(event.address, currentBlock.timestamp)
    if (collection != null) {
        const token                 = createOrLoadToken(collection, tokenId, currentBlock.timestamp)
        const dropDetail            = createOrLoadDropDetails(token.id)

        // Set max total supply
        dropDetail.maxTotalSupply   = maxTotalSupply;

        // Set drop detail ID on token entity
        token.dropDetails   = dropDetail.id

        dropDetail.save()
        token.save()
    }
}

export function handleClaimConditionsUpdated(event: ClaimConditionsUpdatedEvent): void {
    // Init local vars from event params
    const currentBlock      = event.block
    const currentStartId    = event.params.currentStartId
    const count             = event.params.count
    const tokenId           = event.params.tokenId
    const resetClaim        = event.params.resetClaimEligibility

    // Try create new collection entity, if not yet exist
    const collection        = createOrLoadCollection(event.address, currentBlock.timestamp)
    if (collection != null) {
        let token           = createOrLoadToken(collection, tokenId, currentBlock.timestamp)
        const dropDetail    = createOrLoadDropDetails(token.id)

        const existingStartIndex = dropDetail.startClaimConditionId
        const existingPhaseCount = dropDetail.count

        // reset claim conditions
        if (resetClaim) {
            for (let i = existingStartIndex; i < currentStartId; i.plus(ONE_BIGINT)) {
                const id = generateDropClaimConditionUID(dropDetail.id, i)

                store.remove('DropClaimCondition', id)
            }
        } else if (existingPhaseCount > count) {
            for (let i = count; i < existingPhaseCount; i.plus(ONE_BIGINT)) {
                const id = generateDropClaimConditionUID(dropDetail.id, i)

                store.remove('DropClaimCondition', id)
            }
        }

        dropDetail.startClaimConditionId    = currentStartId
        dropDetail.count                    = count
        dropDetail.save()

        token.dropDetails                   = dropDetail.id
        token.save()

        // loop through all the claim conditions, then init each 
        const endClaimConditionID   = currentStartId.plus(count)
        const erc1155drop           = INFTs.bind(event.address)
        for (let claimConditionID = currentStartId; claimConditionID <= endClaimConditionID; claimConditionID.plus(ONE_BIGINT)) {
            const try_claimCondition = erc1155drop.try_getClaimConditionById(tokenId, claimConditionID)
            if (!try_claimCondition.reverted) {
                const claimCondition = try_claimCondition.value

                const dropCondition = createOrLoadDropClaimCondition(dropDetail, claimConditionID)
                dropCondition.startTimestamp        = claimCondition.startTimestamp
                dropCondition.maxClaimableSupply    = claimCondition.maxClaimableSupply
                dropCondition.quantityLimit         = claimCondition.quantityLimitPerTransaction
                dropCondition.waitBetweenClaims     = claimCondition.waitTimeInSecondsBetweenClaims
                dropCondition.merkleRoot            = claimCondition.merkleRoot
                dropCondition.price                 = claimCondition.pricePerToken
                dropCondition.currency              = claimCondition.currency
                dropCondition.save();
            }
        }

    }
}

export function handleTokensClaimed(event: TokensClaimedEvent): void {
    // init local vars from event params
    const currentBlock      = event.block
    const claimerAddress    = event.params.claimer
    const receiverAddress   = event.params.receiver
    const tokenId           = event.params.tokenId
    const quantity          = event.params.quantityClaimed
    const claimIdx          = event.params.claimConditionIndex
    
    // Try create new collection entity, if not yet exist
    const collection        = createOrLoadCollection(event.address, currentBlock.timestamp)
    if (collection != null) {
        createOrLoadAccount(claimerAddress)
        createOrLoadAccount(receiverAddress)

        registerClaimed(collection, claimerAddress, receiverAddress, claimIdx, tokenId, quantity, event)
    }
}


export function handleTransfer(event: TransferEvent): void {
    // Init local vars from event params
    const fromAddress   = event.params.from
    const toAddress     = event.params.to
    const tokenId       = event.params.tokenId
    const currentBlock  = event.block

    // Try create new collection entity, if not yet exist
    const collection    = createOrLoadCollection(event.address, currentBlock.timestamp)
    if (collection != null) {
        const from      = createOrLoadAccount(fromAddress);
        const to        = createOrLoadAccount(toAddress);

        registerTransfer(event, collection, from, to, tokenId, ONE_BIGINT, currentBlock.timestamp)
    }
}

export function handleApproval(event: ApprovalEvent): void {
    // Init local vars from event params
    const ownerAddress      = event.params.owner
    const approvedAddress   = event.params.approved
    const tokenId           = event.params.tokenId
    const currentBlock      = event.block

    // Try create new collection entity, if not yet exist
    const collection        = createOrLoadCollection(event.address, currentBlock.timestamp)
    if (collection != null) {
        const token         = createOrLoadToken(collection, tokenId, currentBlock.timestamp)
        const owner         = createOrLoadAccount(ownerAddress)
        const approved      = createOrLoadAccount(approvedAddress)

        token.approval      = approved.id;

        token.save()
        owner.save()
        approved.save()
    }
}


export function handleIERC721TokensLazyMinted(event: IERC721TokensLazyMintedEvent): void {
    // init local vars from event params
    const currentBlock  = event.block;

    // Try create new collection entity, if not yet exist
    const collection    = createOrLoadCollection(event.address, currentBlock.timestamp)
    if (collection != null) {
        const dropDetail    = createOrLoadDropDetails(collection.id)

        collection.dropDetails   = dropDetail.id
        collection.save()
    }
}

export function handleIERC721MaxTotalSupplyUpdated(event: IERC721MaxTotalSupplyUpdatedEvent): void {
    // init local vars from event params
    const currentBlock      = event.block;
    const maxTotalSupply    = event.params.maxTotalSupply;

    // Try create new collection entity, if not yet exist
    const collection    = createOrLoadCollection(event.address, currentBlock.timestamp)
    if (collection != null) {
        const dropDetail            = createOrLoadDropDetails(collection.id)

        // Set max total supply
        dropDetail.maxTotalSupply   = maxTotalSupply;

        // Set drop detail ID on token entity
        collection.dropDetails      = dropDetail.id

        dropDetail.save()
        collection.save()
    }
}

export function handleIERC721ClaimConditionsUpdated(event: IERC721ClaimConditionsUpdatedEvent): void {
    // Init local vars from event params
    const currentBlock      = event.block
    const currentStartId    = event.params.currentStartId
    const count             = event.params.count
    const resetClaim        = event.params.resetClaimEligibility

    // Try create new collection entity, if not yet exist
    const collection        = createOrLoadCollection(event.address, currentBlock.timestamp)
    if (collection != null) {
        const dropDetail    = createOrLoadDropDetails(collection.id)

        const existingStartIndex = dropDetail.startClaimConditionId
        const existingPhaseCount = dropDetail.count

        // reset claim conditions
        if (resetClaim) {
            for (let i = existingStartIndex; i < currentStartId; i.plus(ONE_BIGINT)) {
                const id = generateDropClaimConditionUID(dropDetail.id, i)

                store.remove('DropClaimCondition', id)
            }
        } else if (existingPhaseCount > count) {
            for (let i = count; i < existingPhaseCount; i.plus(ONE_BIGINT)) {
                const id = generateDropClaimConditionUID(dropDetail.id, i)

                store.remove('DropClaimCondition', id)
            }
        }

        dropDetail.startClaimConditionId    = currentStartId
        dropDetail.count                    = count
        dropDetail.save()

        // loop through all the claim conditions, then init each 
        const endClaimConditionID   = currentStartId.plus(count)
        const erc721drop           = INFTs.bind(event.address)
        for (let claimConditionID = currentStartId; claimConditionID <= endClaimConditionID; claimConditionID.plus(ONE_BIGINT)) {
            const try_claimCondition = erc721drop.try_getClaimConditionById1(claimConditionID)
            if (!try_claimCondition.reverted) {
                const claimCondition = try_claimCondition.value

                const dropCondition = createOrLoadDropClaimCondition(dropDetail, claimConditionID)
                dropCondition.startTimestamp        = claimCondition.startTimestamp
                dropCondition.maxClaimableSupply    = claimCondition.maxClaimableSupply
                dropCondition.quantityLimit         = claimCondition.quantityLimitPerTransaction
                dropCondition.waitBetweenClaims     = claimCondition.waitTimeInSecondsBetweenClaims
                dropCondition.merkleRoot            = claimCondition.merkleRoot
                dropCondition.price                 = claimCondition.pricePerToken
                dropCondition.currency              = claimCondition.currency
                dropCondition.save();
            }
        }
    }
}

export function handleIERC721TokensClaimed(event: IERC721TokensClaimedEvent): void {
    // init local vars from event params
    const currentBlock      = event.block
    const claimerAddress    = event.params.claimer
    const receiverAddress   = event.params.receiver
    const startTokenId      = event.params.startTokenId
    const quantity          = event.params.quantityClaimed
    const claimIdx          = event.params.claimConditionIndex
    
    // Try create new collection entity, if not yet exist
    const collection        = createOrLoadCollection(event.address, currentBlock.timestamp)
    if (collection != null) {
        createOrLoadAccount(claimerAddress)
        createOrLoadAccount(receiverAddress)

        registerClaimed(collection, claimerAddress, receiverAddress, claimIdx, startTokenId, quantity, event)
    }
}

export function handleNFTRevealed(event: NFTRevealedEvent): void {
    // init local vars from event params
    const currentBlock      = event.block
    const startTokenId      = event.params.startTokenId
    const endTokenId        = event.params.endTokenId
    const revealedURI       = event.params.revealedURI

    // Try create new collection entity, if not yet exist
    const collection        = createOrLoadCollection(event.address, currentBlock.timestamp)
    if (collection != null) {
        for (let tokenId = startTokenId; tokenId <= endTokenId; tokenId = tokenId.plus(ONE_BIGINT)) {
            let token       = createOrLoadToken(collection, tokenId, currentBlock.timestamp)
            const tokenURI  = replaceURI(revealedURI, tokenId)
            token           = updateTokenMetadata(token, tokenURI)
            token.updatedAt = currentBlock.timestamp
            token.save()
        }
    }
}

function registerClaimed(collection: Collection, claimerAddress: Address, receiverAddress: Address, claimIdx: BigInt, startTokenId: BigInt, quantity: BigInt, event: ethereum.Event): void {
    if (collection.collectionType == collections.SINGLE) {
        const dropDetail    = createOrLoadDropDetails(collection.id)
        const dropCondition = createOrLoadDropClaimCondition(dropDetail, claimIdx)

        const endTokenId    = startTokenId.plus(quantity)
        for (let tokenId = startTokenId; tokenId <= endTokenId; tokenId = tokenId.plus(ONE_BIGINT)) {
            let token       = createOrLoadToken(collection, tokenId, event.block.timestamp)

            // Create claimed activity entity
            createActivity(activities.CLAIMED, event, token, claimerAddress, receiverAddress, ONE_BIGINT, dropCondition.currency, dropCondition.price.toBigDecimal())
        }
    } else if (collection.collectionType == collections.MULTI) {
        let token           = createOrLoadToken(collection, startTokenId, event.block.timestamp)

        const dropDetail    = createOrLoadDropDetails(token.id)
        const dropCondition = createOrLoadDropClaimCondition(dropDetail, claimIdx)

        // Create claimed activity entity
        createActivity(activities.CLAIMED, event, token, claimerAddress, receiverAddress, quantity, dropCondition.currency, dropCondition.price.toBigDecimal());
    }
}