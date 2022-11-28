import { BigDecimal, ipfs, json, JSONValue, log, TypedMap } from "@graphprotocol/graph-ts";

const IPFS_PREFIX: string = "ipfs://";

export function loadContentFromURI(uri: string): TypedMap<string, JSONValue> | null {
    const CID = URIToIPFSHash(uri);

    if (CID && (CID.startsWith("Qm") || CID.startsWith("ba")) && CID.length > 21) {
        const content = ipfs.cat(CID);
        
        if (content) return json.fromBytes(content).toObject();
    }
    return null;
}

export function URIToIPFSHash(uri: string): string | null {
    if (uri.startsWith(IPFS_PREFIX)) {
        const cid = uri.replace(IPFS_PREFIX, "");
        log.info("CID: {}", [cid]);

        return cid;
    }
    return null;
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