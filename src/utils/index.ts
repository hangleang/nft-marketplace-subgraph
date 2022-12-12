import { BigDecimal, BigInt, JSONValue, JSONValueKind, TypedMap } from "@graphprotocol/graph-ts";
// import { base64ToJSON, isBase64 } from "./base64";
// import { httpsToJSON, isHTTPS } from "./https";
import { concatImageIPFS, ipfsToJSON, isIPFS, toIPFSGateway } from "./ipfs";

export * from './ipfs';
export * from './https';
export * from './base64';

// PROTOCOL
// const ARWEAVE_PREFIX: string = "ar://";

// OTHERS
const URI_CONTAINS: string = "://";

export function loadContentFromURI(uri: string): TypedMap<string, JSONValue> | null {
    let value: JSONValue | null = null;

    if (isIPFS(uri)) {
        value = ipfsToJSON(uri);
    } 
    // else if (isHTTPS(uri)) {
    //     value = httpsToJSON(uri);
    // } 
    // else if (isBase64(uri)) {
    //     value = base64ToJSON(uri);
    // }
    
    // parse to object, then return
    if (value) {
        if (value.kind == JSONValueKind.OBJECT) {
            return value.toObject();
        }
    }
    
    return null;
}

export function formateURI(uriOrPath: string | null, metadataURI: string): string | null {
    if (uriOrPath) {
        if (isURI(uriOrPath)) {
            // if URI
            if (isIPFS(uriOrPath)) {
                // if IPFS
                return toIPFSGateway(uriOrPath)
            } else {
                // if HTTPS
                return uriOrPath
            }
        } else {
            // if Path
            const fullIPFSURI = concatImageIPFS(metadataURI, uriOrPath)
            return fullIPFSURI ? toIPFSGateway(fullIPFSURI) : null
        }
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