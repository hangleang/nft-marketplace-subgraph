import { Account, Collection, Delegation } from "../../generated/schema";
import { generateUID } from "../utils";

export function createOrLoadDelegation(collection: Collection, owner: Account, operator: Account): Delegation {
    const id = generateUID([collection.id, owner.id, operator.id], "/");
    let op = Delegation.load(id);

    if (op == null) {
        op              = new Delegation(id);
        op.collection   = collection.id;
        op.owner        = owner.id;
        op.operator     = operator.id;
    }

    return op;
}