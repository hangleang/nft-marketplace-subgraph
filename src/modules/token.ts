import { Address, BigInt } from "@graphprotocol/graph-ts";
import { Balance, Collection, Token } from "../../generated/schema";
import { NULL_ADDRESS } from "../constants";
import { generateUID } from "../utils";

export function createOrUpdateToken(tokenUID: string, currentTimestamp: BigInt): Token {
    let token = Token.load(tokenUID);

    if (!token) {
        token = new Token(tokenUID);
        token.createdAt = currentTimestamp;
    }
    return token;
}

export function createOrUpdateTokenBalance(tokenUID: string, owner: Address, quantity: BigInt): void {
    const tokenBalanceUID = generateUID([tokenUID, owner.toHex()])
    let tokenBalance = Balance.load(tokenBalanceUID)

    if (!tokenBalance) {
        tokenBalance = new Balance(tokenBalanceUID);
        tokenBalance.token = tokenUID;
        tokenBalance.owner = owner.toHex();
    }
    tokenBalance.quantity = tokenBalance.quantity.plus(quantity);
    tokenBalance.save()
}

export function transferTokenBalance(tokenUID: string, from: Address, to: Address, quantity: BigInt): void {
    if (from == NULL_ADDRESS) return;

    const fromBalance = Balance.load(generateUID([tokenUID, from.toHex()]));
    if (fromBalance) {
        fromBalance.quantity = fromBalance.quantity.minus(quantity);
        fromBalance.save();
    }

    const toBalanceUID = generateUID([tokenUID, to.toHex()])
    let toBalance = Balance.load(toBalanceUID);
    if (!toBalance) {
        toBalance = new Balance(toBalanceUID);
        toBalance.token = tokenUID;
        toBalance.owner = to.toHex();
    }
    toBalance.quantity = toBalance.quantity.plus(quantity);
    toBalance.save()
}

export function generateTokenName(collectionAddress: string, tokenID: BigInt): string {
    let collectionName: string;
    const collection = Collection.load(collectionAddress);
    if (collection) {
      collectionName = collection.title;
    } else {
      collectionName = "Untitled Collection";
    }
    return generateUID([collectionName, `#${tokenID}`], " ");
}