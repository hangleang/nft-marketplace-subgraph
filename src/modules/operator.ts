import { Account, Collection, Operator } from "../../generated/schema";
import { generateUID } from "../utils";

export function createOrLoadOperator(collection: Collection, owner: Account, operator: Account): Operator {
    const id = generateUID([collection.id, owner.id, operator.id], "/");
    let op = Operator.load(id);

    if (op == null) {
        op              = new Operator(id);
        op.collection   = collection.id;
        op.owner        = owner.id;
        op.operator     = operator.id;
    }

    return op;
}