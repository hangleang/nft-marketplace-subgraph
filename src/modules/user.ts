import { Address } from "@graphprotocol/graph-ts"
import { User } from "../../generated/schema"

export function createOrLoadUser(address: Address): User {
    const address0x = address.toHex();
    let user = User.load(address0x);

    if (!user) {
        user = new User(address0x);
        user.save()
    }

    return user;
}
