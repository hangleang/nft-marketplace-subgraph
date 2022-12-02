import { Address } from "@graphprotocol/graph-ts"
import { Account } from "../../generated/schema"

export function createOrLoadAccount(address: Address): Account {
    let account = Account.load(address.toHex());

    if (!account) {
        account = new Account(address.toHex());
        account.save()
    }

    return account;
}
