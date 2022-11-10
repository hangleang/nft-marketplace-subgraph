import { Address } from "@graphprotocol/graph-ts"
import { User } from "../../generated/schema"
import { ZERO_BIGINT, ZERO_DECIMAL } from "../constants"

export function createOrLoadUser(address: Address): User {
    const address0x = address.toHex();
    let user = User.load(address0x)

    if (!user) {
        user = new User(address0x)
        user.sales = ZERO_BIGINT
        user.purchases = ZERO_BIGINT
        user.spent = ZERO_DECIMAL;
        user.save()
    }

    return user;
}
