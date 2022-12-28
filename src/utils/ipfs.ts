import { ipfs, json, JSONValue } from "@graphprotocol/graph-ts";
import { HTTPS_PREFIX } from "./https";

// PROTOCOL
const IPFS_PREFIX: string = "ipfs://";

// GATEWAYS
const GATEWAY_PATH: string = "/ipfs/";
const IPFS_GATEWAY: string = HTTPS_PREFIX + "ipfs.io" + GATEWAY_PATH;

const METADATA_PATH: string = "/metadata.json";

export function isIPFS(uri: string): bool {
    return uri.startsWith(IPFS_PREFIX) || isIPFSGateway(uri)
}

export function isIPFSGateway(url: string): bool {
    return url.includes(GATEWAY_PATH);
}

export function ipfsToCID(uri: string): string | null {
    if (isIPFS(uri)) {
        if (isIPFSGateway(uri)) {
            return uri.split(GATEWAY_PATH)[1]
        } else {
            return uri.split(IPFS_PREFIX)[1]
        }
    }
    return null
}

export function CIDToIpfsURI(cid: string): string {
    return IPFS_PREFIX.concat(cid);
}

export function toIPFSGateway(uri: string): string {
    return uri.replace(IPFS_PREFIX, IPFS_GATEWAY);
}

export function ipfsToJSON(uri: string): JSONValue | null {
    const ipfsHash = ipfsToCID(uri);

    if (ipfsHash && (ipfsHash.startsWith("Qm") || ipfsHash.startsWith("ba")) && ipfsHash.length > 21) {
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

function metadataURIToCID(metadataURI: string): string | null {
    if (metadataURI.endsWith(METADATA_PATH)) {
        const cid = metadataURI.replace(METADATA_PATH, "");

        return cid;
    }
    return null;
}