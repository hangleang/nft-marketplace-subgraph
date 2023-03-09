import { BigDecimal, BigInt, JSONValue, JSONValueKind, TypedMap } from "@graphprotocol/graph-ts";
import { concatImageIPFS, ipfsToJSON, isIPFS, toIPFSGateway } from "./ipfs";
import { base64ToJSON, isBase64JSON, isBase64 } from "./base64";
// import { httpsToJSON, isHTTPS } from "./https";
import { isArweave, toArweaveGateway } from "./arweave";
import { isHTTPS } from "./https";
import { ZERO_BIGINT, ZERO_DECIMAL } from "../constants";

export * from './ipfs';
export * from './https';
export * from './base64';

// OTHERS
const URI_CONTAINS: string = "://";

export function loadMetadataFromURI(uri: string): TypedMap<string, JSONValue> | null {
    let value: JSONValue | null = null;

    if (isIPFS(uri)) {
        value = ipfsToJSON(uri);
    } 
    // else if (isHTTPS(uri)) {
    //     value = httpsToJSON(uri);
    // } 
    else if (isBase64JSON(uri)) {
        value = base64ToJSON(uri);
    }
    // else if (isArweave(uri)) {
    //     value = arweaveToJSON(uri)
    // }
    
    // parse to object, then return
    if (value) {
        if (value.kind == JSONValueKind.OBJECT) {
            return value.toObject();
        }
    }
    
    return null;
}

export function formatURI(uriOrPath: string, metadataURI: string | null): string | null {
    if (isURI(uriOrPath)) {
        // if URI
        if (isIPFS(uriOrPath)) {
            // if IPFS
            return toIPFSGateway(uriOrPath)
        } else if (isHTTPS(uriOrPath)) {
            // if HTTPS
            return uriOrPath
        } else if (isArweave(uriOrPath)) {
            // if Arweave
            return toArweaveGateway(uriOrPath)
        }
    } else if (isBase64(uriOrPath)) {
        // if Base64
        return uriOrPath
    } else if (metadataURI) {
        // if Path
        const fullIPFSURI = concatImageIPFS(metadataURI, uriOrPath)
        return fullIPFSURI ? toIPFSGateway(fullIPFSURI) : null
    }
    return null
}

export function replaceURI(uri: string, tokenId: BigInt): string {
	return uri.replaceAll(
		'{id}',
		tokenId.toString(),
	)
}

function isURI(uri: string): bool {
    return uri.includes(URI_CONTAINS);
}

export function generateUID(keys: string[], sep: string = "-"): string {
    return keys.join(sep);
}

export function getString(object: TypedMap<string, JSONValue>, key: string): string | null {
    const value = object.get(key);
    if (value) {
        if (value.kind == JSONValueKind.STRING) {
            return value.toString();
        } 
    }
    return null;
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

export function safeDivDecimal(a: BigInt, b: BigDecimal): BigDecimal {
    if (a.equals(ZERO_BIGINT)) return ZERO_DECIMAL; 
    return a.divDecimal(b)
}