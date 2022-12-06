import {
    ApprovalForAll as ApprovalForAllEvent,
    TransferSingle as TransferSingleEvent,
    TransferBatch as TransferBatchEvent,
    URI as URIEvent,
    TokensLazyMinted as TokensLazyMintedEvent,
    MaxTotalSupplyUpdated as MaxTotalSupplyUpdatedEvent,
    ClaimConditionsUpdated as ClaimConditionsUpdatedEvent,
    TokensClaimed as TokensClaimedEvent,
    IERC1155Drop
} from '../generated/ERC1155/IERC1155Drop';
import { ONE_BIGINT } from './constants';
import { createOrLoadAccount } from './modules/account';
import { createOrLoadCollection } from './modules/collection';
import { createOrLoadToken, registerTransfer, updateTokenMetadata } from './modules/token';
import { createActivity } from './modules/activity';

import * as activities from './constants/activities';
import { createOrLoadOperator } from './modules/operator';
import { createOrLoadERC1155DropClaimCondition, createOrLoadDropDetails, generateDropClaimConditionUID, generateDropDetailsUID } from './modules/drop';
import { store } from '@graphprotocol/graph-ts';
import { DropClaimCondition } from '../generated/schema';
import { replaceURI } from './utils';

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
        for (let tokenId = startTokenId; tokenId <= endTokenId; tokenId.plus(ONE_BIGINT)) {
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
        const erc1155drop           = IERC1155Drop.bind(event.address)
        for (let claimConditionID = currentStartId; claimConditionID <= endClaimConditionID; claimConditionID.plus(ONE_BIGINT)) {
            const try_claimCondition = erc1155drop.try_getClaimConditionById(tokenId, claimConditionID)
            if (!try_claimCondition.reverted) {
                const claimCondition = try_claimCondition.value

                createOrLoadERC1155DropClaimCondition(dropDetail, claimConditionID, claimCondition)
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
        let token           = createOrLoadToken(collection, tokenId, currentBlock.timestamp)
        createOrLoadAccount(claimerAddress)
        createOrLoadAccount(receiverAddress)

        const id            = generateDropClaimConditionUID(generateDropDetailsUID(token.id), claimIdx)
        const claimCondition = DropClaimCondition.load(id)

        // Create claimed activity entity
        if (claimCondition) {
            createActivity(activities.CLAIMED, event, token, claimerAddress, receiverAddress, quantity, claimCondition.currency, claimCondition.price.toBigDecimal());
        } else {
            createActivity(activities.CLAIMED, event, token, claimerAddress, receiverAddress, quantity);
        }
    }
}