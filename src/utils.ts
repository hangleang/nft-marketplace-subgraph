import { BigDecimal, BigInt, ipfs, json, JSONValue, JSONValueKind, log, TypedMap } from "@graphprotocol/graph-ts";
// import fetch, { Response } from 'node-fetch'

const URI_CONTAINS: string = "://";
// const HTTPS_PREFIX: string = "https://";
const IPFS_PREFIX: string = "ipfs://";
const METADATA_PATH: string = "/metadata.json";

export function loadContentFromURI(uri: string): TypedMap<string, JSONValue> | null {
    // let try_value: Result<JSONValue, Boolean>;
    // check given metadata URI, IPFS or https protocol
    // if (uri.startsWith(HTTPS_PREFIX)) {
    //     log.info("endpoint: {}", [uri])

    //     fetch(uri).then((resp: Response) => {
    //         if (resp.ok) {
    //             resp.text().then((text: string) => {
    //                 try_value = json.try_fromString(text)
    //             })
    //         }
    //     })
    // } else 

    if (isIPFS(uri)) {
        const ipfsHash = uri.replace(IPFS_PREFIX, "").replaceAll("//", "/");
        log.info("ipfsHash: {}", [ipfsHash]);

        if ((ipfsHash.startsWith("Qm") || ipfsHash.startsWith("ba")) && ipfsHash.length > 21) {
            const data = ipfs.cat(ipfsHash);
            
            if (data) {
                const try_value = json.try_fromBytes(data);
                if (try_value.isOk) {
                    const value = try_value.value;
            
                    if (value.kind == JSONValueKind.OBJECT) {
                        return value.toObject();
                    }
                }
            }
        }
    }
    
    // parse to object, then return
    // if (try_value != null) {
    //     if (try_value.isOk) {
    //         const value = try_value.value;
    
    //         if (value.kind == JSONValueKind.OBJECT) {
    //             return value.toObject();
    //         }
    //     }
    // }
    
    return null;
}

export function isIPFS(uri: string): boolean {
    return uri.startsWith(IPFS_PREFIX) ? true : false;
}

export function isURI(uri: string): bool {
    return uri.includes(URI_CONTAINS);
}

export function replaceURI(uri: string, tokenId: BigInt): string {
	return uri.replaceAll(
		'{id}',
		tokenId.toString(),
	)
}

export function metadataURIToCID(uri: string): string | null {
    if (uri.endsWith(METADATA_PATH)) {
        const cid = uri.replace(METADATA_PATH, "");
        log.info("CID: {}", [cid]);

        return cid;
    }
    return null;
}

// for our IPFS metadata standard
export function concatImageIPFS(uri: string, image_path: string): string | null {
    if (uri.startsWith(IPFS_PREFIX)) {
        const cid = metadataURIToCID(uri);
        
        if (cid) {
            const imageIPFS = cid + "/" + image_path;
            log.info("image IPFS: {}", [imageIPFS]);
            
            return imageIPFS;
        }
    }
    return null;
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