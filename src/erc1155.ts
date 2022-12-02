import {
    ApprovalForAll as ApprovalForAllEvent,
    TransferSingle as TransferSingleEvent,
    TransferBatch as TransferBatchEvent,
    URI as URIEvent
} from '../generated/ERC1155/IERC1155';
import { NULL_ADDRESS } from './constants';
import { createOrLoadAccount } from './modules/account';
import { createOrLoadCollection } from './modules/collection';
import { createOrLoadToken, replaceURI, transferTokenBalance, updateTokenMetadata } from './modules/token';
import { createActivity } from './modules/activity';

import * as activities from './constants/activities';
import { createOrLoadOperator } from './modules/operator';
import { BigInt } from '@graphprotocol/graph-ts';

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
        const token     = createOrLoadToken(collection, tokenId, currentBlock.timestamp)
        const operator  = createOrLoadAccount(opAddress)
        const from      = createOrLoadAccount(fromAddress)
        const to        = createOrLoadAccount(toAddress)

        // if mintEvent, set creator address
        // else transferEvent, reset approval
        if (fromAddress == NULL_ADDRESS) {
            token.creator   = to.id;
        } else {
            token.approval  = createOrLoadAccount(NULL_ADDRESS).id // implicit approval reset on transfer

            // Create transfer activity entity
            createActivity(activities.TRANSFERRED, event.block, event.transaction, event.logIndex, token, null, fromAddress, toAddress)
        }

        // Update both parties token balances (ownership)
        transferTokenBalance(token, from, to, value)

        collection.save()
        token.save()
    }
}

export function handleTransferBatch(event: TransferBatchEvent): void {
    // Init local vars from event params
    const fromAddress   = event.params.from
    const toAddress     = event.params.to
    const opAddress     = event.params.operator
    const tokenIds       = event.params.ids
    const values         = event.params.values
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
                const tokenId   = tokenIds[i];
                const value     = values[i];
                const token     = createOrLoadToken(collection, tokenId, currentBlock.timestamp)
                
                // if mintEvent, set creator address
                // else transferEvent, reset approval
                if (fromAddress == NULL_ADDRESS) {
                    token.creator   = to.id;

                    // Create mint activity entity
                    createActivity(activities.MINTED, currentBlock, event.transaction, event.logIndex, token, null, toAddress, null)
                } else {
                    token.approval  = createOrLoadAccount(NULL_ADDRESS).id // implicit approval reset on transfer

                    // Create transfer activity entity
                    createActivity(activities.TRANSFERRED, event.block, event.transaction, event.logIndex, token, null, fromAddress, toAddress)
                }

                // Update both parties token balances (ownership)
                transferTokenBalance(token, from, to, value)

                collection.save()
                token.save()
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