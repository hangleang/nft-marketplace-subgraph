import { 
    Approval as ApprovalEvent,
    ApprovalForAll as ApprovalForAllEvent,
    Transfer as TransferEvent,
    TokensLazyMinted as TokensLazyMintedEvent,
    MaxTotalSupplyUpdated as MaxTotalSupplyUpdatedEvent,
    ClaimConditionsUpdated as ClaimConditionsUpdatedEvent,
    TokensClaimed as TokensClaimedEvent,
    NFTRevealed as NFTRevealedEvent,
    IERC721Drop
} from '../generated/ERC721/IERC721Drop';
import { DropClaimCondition } from '../generated/schema';
import { ONE_BIGINT } from './constants';
import { createOrLoadCollection } from './modules/collection';
import { createOrLoadToken, registerTransfer, updateTokenMetadata } from './modules/token';
import { createOrLoadAccount } from './modules/account';
import { createOrLoadOperator } from './modules/operator';
import { createOrLoadERC721DropClaimCondition, createOrLoadDropDetails, generateDropClaimConditionUID, generateDropDetailsUID } from './modules/drop';
import { createActivity } from './modules/activity';

import { store } from '@graphprotocol/graph-ts';
import * as activities from './constants/activities';
import { replaceURI } from './utils';

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

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
    // Init local vars from event params
    const ownerAddress      = event.params.owner
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

export function handleTokensLazyMinted(event: TokensLazyMintedEvent): void {
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

export function handleMaxTotalSupplyUpdated(event: MaxTotalSupplyUpdatedEvent): void {
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

export function handleClaimConditionsUpdated(event: ClaimConditionsUpdatedEvent): void {
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
        const erc721drop           = IERC721Drop.bind(event.address)
        for (let claimConditionID = currentStartId; claimConditionID <= endClaimConditionID; claimConditionID.plus(ONE_BIGINT)) {
            const try_claimCondition = erc721drop.try_getClaimConditionById(claimConditionID)
            if (!try_claimCondition.reverted) {
                const claimCondition = try_claimCondition.value

                createOrLoadERC721DropClaimCondition(dropDetail, claimConditionID, claimCondition)
            }
        }
    }
}

export function handleTokensClaimed(event: TokensClaimedEvent): void {
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

        const id            = generateDropClaimConditionUID(generateDropDetailsUID(collection.id), claimIdx)
        const claimCondition = DropClaimCondition.load(id)

        const endTokenId    = startTokenId.plus(quantity)
        for (let tokenId = startTokenId; tokenId <= endTokenId; tokenId.plus(ONE_BIGINT)) {
            let token       = createOrLoadToken(collection, tokenId, currentBlock.timestamp)
    
            // Create claimed activity entity
            if (claimCondition) {
                createActivity(activities.CLAIMED, event, token, claimerAddress, receiverAddress, ONE_BIGINT, claimCondition.currency, claimCondition.price.toBigDecimal());
            } else {
                createActivity(activities.CLAIMED, event, token, claimerAddress, receiverAddress, ONE_BIGINT);
            }
        }
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
        for (let tokenId = startTokenId; tokenId <= endTokenId; tokenId.plus(ONE_BIGINT)) {
            let token       = createOrLoadToken(collection, tokenId, currentBlock.timestamp)
            const tokenURI  = replaceURI(revealedURI, tokenId)
            token           = updateTokenMetadata(token, tokenURI)
            token.updatedAt = currentBlock.timestamp
            token.save()
        }
    }
}