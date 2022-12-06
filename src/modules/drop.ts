import { BigInt } from "@graphprotocol/graph-ts";
import { IERC1155Drop__getClaimConditionByIdResultValue0Struct } from "../../generated/ERC1155/IERC1155Drop";
import { IERC721Drop__getClaimConditionByIdResultValue0Struct } from "../../generated/ERC721/IERC721Drop";
import { Collection, DropClaimCondition, DropDetail, Token } from "../../generated/schema";
import { ZERO_BIGINT } from "../constants";
import { generateUID } from "../utils";

const DROP_POSTFIX: string = "drop";

export function generateDropDetailsUID(uid: string): string {
    return generateUID([uid, DROP_POSTFIX])
}

export function generateDropClaimConditionUID(dropDetailId: string, idx: BigInt): string {
    return generateUID([dropDetailId, idx.toString()])
}

export function createOrLoadDropDetails(entityId: string): DropDetail {
    const id                = generateDropDetailsUID(entityId)
    let dropDetail          = DropDetail.load(id)

    if (dropDetail == null) {
        dropDetail                          = new DropDetail(id)
        dropDetail.startClaimConditionId    = ZERO_BIGINT
        dropDetail.count                    = ZERO_BIGINT
        dropDetail.maxTotalSupply           = ZERO_BIGINT
        dropDetail.save()
    }

    return dropDetail
}

export function createOrLoadERC1155DropClaimCondition(
    dropDetail: DropDetail, 
    idx: BigInt, 
    claimCondition: IERC1155Drop__getClaimConditionByIdResultValue0Struct
): void {
    const id                = generateDropClaimConditionUID(dropDetail.id, idx)
    let dropCondition       = DropClaimCondition.load(id)

    if (dropCondition == null) {
        dropCondition                       = new DropClaimCondition(id)
        dropCondition.drop                  = dropDetail.id
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

export function createOrLoadERC721DropClaimCondition(
    dropDetail: DropDetail, 
    idx: BigInt, 
    claimCondition: IERC721Drop__getClaimConditionByIdResultValue0Struct
): void {
    const id                = generateDropClaimConditionUID(dropDetail.id, idx)
    let dropCondition       = DropClaimCondition.load(id)

    if (dropCondition == null) {
        dropCondition                       = new DropClaimCondition(id)
        dropCondition.drop                  = dropDetail.id
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