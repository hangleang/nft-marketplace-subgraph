import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Balance, Collection, Token } from "../../generated/schema";
import { NULL_ADDRESS, ZERO_BIGINT } from "../constants";
import { generateUID } from "../utils";
import { createOrLoadUser } from "./user";

export function createOrUpdateToken(tokenUID: string, currentTimestamp: BigInt): Token {
    let token = Token.load(tokenUID);

    if (!token) {
        token = new Token(tokenUID);
        token.createdAt = currentTimestamp;
    }
    return token;
}

export function createOrLoadTokenBalance(tokenUID: string, owner: Address): Balance {
    const operator = createOrLoadUser(owner);
    const tokenBalanceUID = generateUID([tokenUID, operator.id])
    let tokenBalance = Balance.load(tokenBalanceUID)

    if (!tokenBalance) {
        tokenBalance = new Balance(tokenBalanceUID);
        tokenBalance.token = tokenUID;
        tokenBalance.quantity = ZERO_BIGINT;
        tokenBalance.owner = operator.id;
    }
    return tokenBalance;
}

export function createOrUpdateTokenBalance(tokenUID: string, owner: Address, quantity: BigInt, isAddUp: bool): void {
    const tokenBalance = createOrLoadTokenBalance(tokenUID, owner);
    if (isAddUp) {
        tokenBalance.quantity = tokenBalance.quantity.plus(quantity);
    } else {
        tokenBalance.quantity = tokenBalance.quantity.minus(quantity);
    }
    tokenBalance.save()
}

export function transferTokenBalance(tokenUID: string, from: Address, to: Address, quantity: BigInt): void {
    createOrUpdateTokenBalance(tokenUID, from, quantity, false);
    createOrUpdateTokenBalance(tokenUID, to, quantity, true);
}

export function generateTokenName(collectionAddress: Address, tokenID: BigInt): string {
    let collectionName: string;
    const collection = Collection.load(collectionAddress.toHex());
    if (collection) {
      collectionName = collection.title;
    } else {
      collectionName = "Untitled Collection";
    }
    return generateUID([collectionName, `#${tokenID}`], " ");
}