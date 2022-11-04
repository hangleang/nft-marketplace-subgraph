import { ipfs, json, JSONValue, TypedMap } from "@graphprotocol/graph-ts"

export function loadContentFromURI(uri: string): TypedMap<string, JSONValue> | null {
    const CID: string = URIToCID(uri);
    const content = ipfs.cat(CID);
    
    if (!content) return null;
    const contentJSON = json.fromBytes(content).toObject();
    console.log(content.toString())

    return contentJSON;
}

export function URIToCID(uri: string): string {
    const cid = uri.slice(6);
    return cid;
}

export function generateUID(keys: string[], sep: string = "-"): string {
    return keys.join(sep);
}