// import { JSONValue } from "@graphprotocol/graph-ts";
import { HTTPS_PREFIX } from "./https";

// PROTOCOL
const ARWEAVE_PREFIX: string = "ar://";
const ARWEAVE_GATEWAY: string = HTTPS_PREFIX + "arweave.net/"

export function isArweave(uri: string): bool {
    return uri.startsWith(ARWEAVE_PREFIX)
}

export function toArweaveGateway(uri: string): string {
    return uri.replace(ARWEAVE_PREFIX, ARWEAVE_GATEWAY)
}

// export function arweaveToJSON(uri: string): JSONValue | null {
//     const arweaveEndpoint = toArweaveGateway(uri)
    
//     return httpsToJSON(arweaveEndpoint)
// }