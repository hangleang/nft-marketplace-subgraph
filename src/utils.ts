import { BigDecimal, ipfs, json, JSONValue, log, TypedMap } from "@graphprotocol/graph-ts"

export function loadContentFromURI(uri: string): TypedMap<string, JSONValue> | null {
    const CID: string = URIToIPFSHash(uri);

    if (CID && CID.length > 21) {
        const content = ipfs.cat(CID);
    
        if (!content) return null;
        log.info("content: {}", [content.toString()]);
        return json.fromBytes(content).toObject();
    }
    return null;
}

export function URIToIPFSHash(uri: string): string {
    const cid = uri.replace("ipfs://", "");
    return cid;
}

export function generateUID(keys: string[], sep: string = "-"): string {
    return keys.join(sep);
}

export function getString(object: TypedMap<string, JSONValue>, key: string): string | null {
    const value = object.get(key);
    if (!value) return null;
    return value.toString();
}

export function getMax(left: BigDecimal, right: BigDecimal): BigDecimal {
    if (left > right) {
        return left;
    } else {
        return right;
    }
}

export function getMin(left: BigDecimal, right: BigDecimal): BigDecimal {
    if (left < right) {
        return left;
    } else {
        return right;
    }
}