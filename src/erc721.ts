import { 
    Approval as ApprovalEvent,
    ApprovalForAll as ApprovalForAllEvent,
    Transfer as TransferEvent 
} from '../generated/ERC721/IERC721';
import { NULL_ADDRESS, ONE_BIGINT } from './constants';
import { createOrLoadCollection } from './modules/collection';
import { createOrLoadToken, transferTokenBalance } from './modules/token';
import { createOrLoadAccount } from './modules/account';
import { createActivity } from './modules/activity';
import { createOrLoadOperator } from './modules/operator';

import * as activities from './constants/activities';

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
        const token     = createOrLoadToken(collection, tokenId, currentBlock.timestamp);

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
        transferTokenBalance(token, from, to, ONE_BIGINT)

        collection.save()
        token.save()
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