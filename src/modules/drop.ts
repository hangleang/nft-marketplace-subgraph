import { BigInt } from "@graphprotocol/graph-ts";
import { DropDetail } from "../../generated/schema";
import { ZERO_BIGINT } from "../constants";
import { generateUID } from "../utils";

const DROP_POSTFIX: string = "drop";

export function generateDropDetailsUID(uid: string): string {
    return generateUID([uid, DROP_POSTFIX]);
}

export function generateDropClaimConditionUID(uid: string, idx: BigInt): string {
    return generateUID([uid, idx.toString()]);
}

export function createOrLoadDropDetails(uid: string): DropDetail {
    let dropDetail = DropDetail.load(uid);

    if (!dropDetail) {
        dropDetail = new DropDetail(uid);
        dropDetail.startClaimConditionID = ZERO_BIGINT;
        dropDetail.count = ZERO_BIGINT;
        dropDetail.supplyClaimed = ZERO_BIGINT;
    }

    return dropDetail;
}

export function increaseSupplyClaimed(uid: string, quantity: BigInt): void {
    const drop = DropDetail.load(uid);

    if (drop) {
        drop.supplyClaimed = drop.supplyClaimed.plus(quantity);
        drop.save();
    }
}