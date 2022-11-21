import { Address, BigInt } from "@graphprotocol/graph-ts";
import { TokenOwnership, Collection, Token } from "../../generated/schema";
import { ZERO_BIGINT } from "../constants";
import { generateUID } from "../utils";
import { createOrLoadUser } from "./user";

export function generateTokenUID(collection: Address, tokenID: BigInt): string {
    return generateUID([collection.toHex(), tokenID.toString()], ":");
}

export function generateTokenAttributeUID(tokenUID: string, key: string): string {
    return generateUID([tokenUID, key.trim()], ":")
}

export function createOrUpdateToken(tokenUID: string, currentTimestamp: BigInt): Token {
    let token = Token.load(tokenUID);

    if (!token) {
        token = new Token(tokenUID);
        token.createdAt = currentTimestamp;
    }
    return token;
}

export function createOrLoadTokenBalance(tokenUID: string, owner: Address): TokenOwnership {
    const tokenOwnershipUID = generateUID([tokenUID, owner.toHex()])
    let tokenOwnership = TokenOwnership.load(tokenOwnershipUID)

    if (!tokenOwnership) {
        tokenOwnership = new TokenOwnership(tokenOwnershipUID);
        tokenOwnership.token = tokenUID;
        tokenOwnership.owner = owner.toHex();
        tokenOwnership.quantity = ZERO_BIGINT;
        createOrLoadUser(owner);
    }
    return tokenOwnership;
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
      collectionName = collection.name;
    } else {
      collectionName = "Untitled Collection";
    }
    return generateUID([collectionName, `#${tokenID}`], " ");
}

export function setTokenDropDetail(tokenUID: string, dropDetailUID: string): void {
    const token = Token.load(tokenUID);

    if (token) {
        token.dropDetails = dropDetailUID;
        token.save();
    }
}