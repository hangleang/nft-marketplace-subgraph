import { Count } from "../../generated/schema";

export const DEFAULT_ID = 'all'

export function createOrLoadCount(): Count {
    let count = Count.load(DEFAULT_ID);

    if (!count) {
        count = new Count(DEFAULT_ID);
        count.collectionTotal = 0;
        count.salesTotal = 0;
    }

    return count;
}

export function buildCountFromCollection(): void {
    let count = createOrLoadCount();

    count.collectionTotal += 1;
    count.save();
}

export function buildCountFromSale(): void {
    let count = createOrLoadCount();
    
    count.salesTotal += 1;
    count.save();
}