import { json, JSONValue } from "@graphprotocol/graph-ts";
import { fetch } from "as-fetch";
// import {  } from "as-fetch/imports"

// PROTOCOL
export const HTTPS_PREFIX: string = "https://";

export function isHTTPS(url: string): bool {
    return url.startsWith(HTTPS_PREFIX);
}

export function httpsToJSON(url: string): JSONValue | null {
    let value: JSONValue | null = null;

    fetch(url, {
        method: "GET",
        mode: "no-cors",
        headers: [["content-type", "application/json"]],
        body: null
    })
    .then((resp) => {
        if (resp.ok) {
            let dataJSON = resp.text();
            let try_value = json.try_fromString(dataJSON);

            if (try_value.isOk) {
                value = try_value.value;
            }
        }
    });

    return value;
}