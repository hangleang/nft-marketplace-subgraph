import { BigInt, Bytes } from "@graphprotocol/graph-ts";
import { DropClaimCondition, DropDetail } from "../../generated/schema";
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
        dropDetail.save()
    }

    return dropDetail
}

export function createOrLoadDropClaimCondition(
    dropDetail: DropDetail, 
    idx: BigInt
): DropClaimCondition {
    const id                = generateDropClaimConditionUID(dropDetail.id, idx)
    let dropCondition       = DropClaimCondition.load(id)

    if (dropCondition == null) {
        dropCondition                       = new DropClaimCondition(id)
        dropCondition.drop                  = dropDetail.id
        dropCondition.startTimestamp        = ZERO_BIGINT
        dropCondition.quantityLimit         = ZERO_BIGINT
        dropCondition.waitBetweenClaims     = ZERO_BIGINT
        dropCondition.merkleRoot            = Bytes.empty()
        dropCondition.price                 = ZERO_BIGINT
        dropCondition.currency              = Bytes.empty()
        dropCondition.save();
    }

    return dropCondition
}