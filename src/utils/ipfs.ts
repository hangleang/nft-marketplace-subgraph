import { ipfs, json, JSONValue } from "@graphprotocol/graph-ts";
import { HTTPS_PREFIX } from "./https";

// PROTOCOL
const IPFS_PREFIX: string = "ipfs://";

// GATEWAYS
const IPFS_GATEWAY: string = HTTPS_PREFIX + "ipfs.io/ipfs/";

const METADATA_PATH: string = "/metadata.json";

export function isIPFS(uri: string): boolean {
    return uri.startsWith(IPFS_PREFIX) ? true : false;
}

export function ipfsToJSON(uri: string): JSONValue | null {
    const ipfsHash = uri.replace(IPFS_PREFIX, "").replaceAll("//", "/");

    if ((ipfsHash.startsWith("Qm") || ipfsHash.startsWith("ba")) && ipfsHash.length > 21) {
        const data = ipfs.cat(ipfsHash);
        
        if (data) {
            const try_value = json.try_fromBytes(data);
            if (try_value.isOk) {
                return try_value.value;
            }
        }
    }
    return null;
}   

// for our IPFS metadata standard
export function concatImageIPFS(uri: string, image_path: string): string | null {
    if (uri.startsWith(IPFS_PREFIX)) {
        const cid = metadataURIToCID(uri);
        
        if (cid) {
            const imageIPFS = cid + "/" + image_path;
            
            return imageIPFS;
        }
    }
    return null;
}

export function toIPFSGateway(uri: string): string {
    return uri.replace(IPFS_PREFIX, IPFS_GATEWAY);
}

function metadataURIToCID(metadataURI: string): string | null {
    if (metadataURI.endsWith(METADATA_PATH)) {
        const cid = metadataURI.replace(METADATA_PATH, "");

        return cid;
    }
    return null;
}