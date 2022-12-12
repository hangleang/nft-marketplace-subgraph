import { Bytes, json, JSONValue } from "@graphprotocol/graph-ts";
import { decode } from "as-base64";

// PROTOCOL
const BASE64_PREFIX: string = "data:application/json;base64,";

export function isBase64(base64data: string): bool {
  return base64data.startsWith(BASE64_PREFIX);
}

export function base64ToJSON(base64data: string): JSONValue | null {
	if (isBase64(base64data)) {
    const encoded = base64data.replace(BASE64_PREFIX, "");
		const decoded = decode(encoded);
		const base64AsBytes = Bytes.fromUint8Array(decoded);

		const try_value = json.try_fromBytes(base64AsBytes);
		if (try_value.isOk) {
			return try_value.value;
		}
	}
	return null;
}