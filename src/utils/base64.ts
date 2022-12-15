import { Bytes, json, JSONValue } from "@graphprotocol/graph-ts";

// PROTOCOL
const BASE64JSON_PREFIX: string = "data:application/json;base64,";
const BASE64_CONTAINS: string = ";base64,";

export function isBase64JSON(base64data: string): bool {
  return base64data.startsWith(BASE64JSON_PREFIX);
}

export function isBase64(base64data: string): bool {
  return base64data.includes(BASE64_CONTAINS);
}

// function isUrlSafe(base64data: string): bool {
//   return !base64data.includes("=");
// }

export function base64ToJSON(base64data: string): JSONValue | null {
  if (isBase64JSON(base64data)) {
    const encoded = base64data.replace(BASE64JSON_PREFIX, "");
	const formattedEncoded = encoded.replaceAll("-", "+").replaceAll("_", "/")
    const decoded = decode(formattedEncoded)
    const base64AsBytes = Bytes.fromUint8Array(decoded)

    const try_value = json.try_fromBytes(base64AsBytes);
    if (try_value.isOk) {
      return try_value.value;
    }
  }

  return null;
}

// below codes is modified from https://github.com/near/as-base64/blob/master/assembly/index.ts
const PADCHAR = "=";

 /**
    * Decode a base64-encoded string and return a Uint8Array.
    * @param s Base64 encoded string.
    */
function decode(s: string): Uint8Array {
	let i: u32, b10: u32;
	let pads = 0,
			imax = s.length as u32;

	if (imax == 0) {
		return new Uint8Array(0);
	}

	if (s.charAt(imax - 1) == PADCHAR) {
		pads = 1;
		if (s.charAt(imax - 2) == PADCHAR) {
			pads = 2;
		}
		imax -= 4;
	}

	let main_chunk = imax % 4 == 0 ? (imax / 4) * 3 : (imax / 4 + 1) * 3;
	let pad_size = pads > 0 ? 3 - pads : 0;
	let size = main_chunk + pad_size;

	let x = new Uint8Array(size),
			index = 0;

	for (i = 0; i < imax; i += 4) {
		b10 =
			(getByte64(s, i) << 18) |
			(getByte64(s, i + 1) << 12) |
			(getByte64(s, i + 2) << 6) |
			getByte64(s, i + 3);
		x[index++] = b10 >> 16;
		x[index++] = (b10 >> 8) & 255;
		x[index++] = b10 & 255;
	}
	switch (pads) {
		case 1:
			b10 =
				(getByte64(s, i) << 18) |
				(getByte64(s, i + 1) << 12) |
				(getByte64(s, i + 2) << 6);
			x[index++] = b10 >> 16;
			x[index++] = (b10 >> 8) & 255;
			break;
		case 2:
			b10 = (getByte64(s, i) << 18) | (getByte64(s, i + 1) << 12);
			x[index++] = b10 >> 16;
			break;
	}

	return x;
}

// below codes from https://developer.mozilla.org/en-US/docs/Glossary/Base64

// Array of bytes to Base64 string decoding
function getByte64(s: string, i: u32): u32 {
	const nChr = s.charCodeAt(i);
	return nChr > 64 && nChr < 91
    ? nChr - 65
    : nChr > 96 && nChr < 123
    ? nChr - 71
    : nChr > 47 && nChr < 58
    ? nChr + 4
    : nChr == 43
    ? 62
    : nChr == 47
    ? 63
    : 0;
}

// function base64DecToArr(sBase64: string, nBlocksSize: number | null) {
//   const sB64Enc = sBase64.replace(/^A-Za-z0-9+/g, "");
//   const nInLen = sB64Enc.length;
//   const nOutLen = nBlocksSize
//     ? Math.ceil(((nInLen * 3 + 1) >> 2) / nBlocksSize) * nBlocksSize
//     : (nInLen * 3 + 1) >> 2;
//   const taBytes = new Uint8Array(nOutLen);

//   let nMod3;
//   let nMod4;
//   let nUint24 = 0;
//   let nOutIdx = 0;
//   for (let nInIdx = 0; nInIdx < nInLen; nInIdx++) {
//     nMod4 = nInIdx & 3;
//     nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << (6 * (3 - nMod4));
//     if (nMod4 === 3 || nInLen - nInIdx === 1) {
//       nMod3 = 0;
//       while (nMod3 < 3 && nOutIdx < nOutLen) {
//         taBytes[nOutIdx] = (nUint24 >>> ((16 >>> nMod3) & 24)) & 255;
//         nMod3++;
//         nOutIdx++;
//       }
//       nUint24 = 0;
//     }
//   }

//   return taBytes;
// }

// /* Base64 string to array encoding */
// function uint6ToB64(nUint6: number) {
//   return nUint6 < 26
//     ? nUint6 + 65
//     : nUint6 < 52
//     ? nUint6 + 71
//     : nUint6 < 62
//     ? nUint6 - 4
//     : nUint6 === 62
//     ? 43
//     : nUint6 === 63
//     ? 47
//     : 65;
// }

// function base64EncArr(aBytes: Bytes) {
//   let nMod3 = 2;
//   let sB64Enc = "";

//   const nLen = aBytes.length;
//   let nUint24 = 0;
//   for (let nIdx = 0; nIdx < nLen; nIdx++) {
//     nMod3 = nIdx % 3;
//     if (nIdx > 0 && ((nIdx * 4) / 3) % 76 === 0) {
//       sB64Enc += "\r\n";
//     }

//     nUint24 |= aBytes[nIdx] << ((16 >>> nMod3) & 24);
//     if (nMod3 === 2 || aBytes.length - nIdx === 1) {
//       sB64Enc += String.fromCodePoint(
//         uint6ToB64((nUint24 >>> 18) & 63),
//         uint6ToB64((nUint24 >>> 12) & 63),
//         uint6ToB64((nUint24 >>> 6) & 63),
//         uint6ToB64(nUint24 & 63)
//       );
//       nUint24 = 0;
//     }
//   }
//   return (
//     sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) +
//     (nMod3 === 2 ? "" : nMod3 === 1 ? "=" : "==")
//   );
// }

// /* UTF-8 array to JS string and vice versa */

// function UTF8ArrToStr(aBytes: Bytes): string {
//   let sView = "";
//   let nPart: u8;
//   const nLen = aBytes.length;
//   for (let nIdx = 0; nIdx < nLen; nIdx++) {
//     nPart = aBytes[nIdx];
//     sView += String.fromCodePoint(
//       nPart > 251 && nPart < 254 && nIdx + 5 < nLen /* six bytes */
//         ? /* (nPart - 252 << 30) may be not so safe in ECMAScript! So…: */
//           (nPart - 252) * 1073741824 +
//             ((aBytes[++nIdx] - 128) << 24) +
//             ((aBytes[++nIdx] - 128) << 18) +
//             ((aBytes[++nIdx] - 128) << 12) +
//             ((aBytes[++nIdx] - 128) << 6) +
//             aBytes[++nIdx] -
//             128
//         : nPart > 247 && nPart < 252 && nIdx + 4 < nLen /* five bytes */
//         ? ((nPart - 248) << 24) +
//           ((aBytes[++nIdx] - 128) << 18) +
//           ((aBytes[++nIdx] - 128) << 12) +
//           ((aBytes[++nIdx] - 128) << 6) +
//           aBytes[++nIdx] -
//           128
//         : nPart > 239 && nPart < 248 && nIdx + 3 < nLen /* four bytes */
//         ? ((nPart - 240) << 18) +
//           ((aBytes[++nIdx] - 128) << 12) +
//           ((aBytes[++nIdx] - 128) << 6) +
//           aBytes[++nIdx] -
//           128
//         : nPart > 223 && nPart < 240 && nIdx + 2 < nLen /* three bytes */
//         ? ((nPart - 224) << 12) +
//           ((aBytes[++nIdx] - 128) << 6) +
//           aBytes[++nIdx] -
//           128
//         : nPart > 191 && nPart < 224 && nIdx + 1 < nLen /* two bytes */
//         ? ((nPart - 192) << 6) + aBytes[++nIdx] - 128 /* nPart < 127 ? */
//         : /* one byte */
//           nPart
//     );
//   }
//   return sView;
// }

// function strToUTF8Arr(sDOMStr: string) {
//   let aBytes;
//   let nChr;
//   const nStrLen = sDOMStr.length;
//   let nArrLen = 0;

//   /* mapping… */
//   for (let nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
//     nChr = sDOMStr.codePointAt(nMapIdx);

//     if (nChr > 65536) {
//       nMapIdx++;
//     }

//     nArrLen +=
//       nChr < 0x80
//         ? 1
//         : nChr < 0x800
//         ? 2
//         : nChr < 0x10000
//         ? 3
//         : nChr < 0x200000
//         ? 4
//         : nChr < 0x4000000
//         ? 5
//         : 6;
//   }

//   aBytes = new Uint8Array(nArrLen);

//   /* transcription… */
//   let nIdx = 0;
//   let nChrIdx = 0;
//   while (nIdx < nArrLen) {
//     nChr = sDOMStr.codePointAt(nChrIdx);
//     if (nChr < 128) {
//       /* one byte */
//       aBytes[nIdx++] = nChr;
//     } else if (nChr < 0x800) {
//       /* two bytes */
//       aBytes[nIdx++] = 192 + (nChr >>> 6);
//       aBytes[nIdx++] = 128 + (nChr & 63);
//     } else if (nChr < 0x10000) {
//       /* three bytes */
//       aBytes[nIdx++] = 224 + (nChr >>> 12);
//       aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
//       aBytes[nIdx++] = 128 + (nChr & 63);
//     } else if (nChr < 0x200000) {
//       /* four bytes */
//       aBytes[nIdx++] = 240 + (nChr >>> 18);
//       aBytes[nIdx++] = 128 + ((nChr >>> 12) & 63);
//       aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
//       aBytes[nIdx++] = 128 + (nChr & 63);
//       nChrIdx++;
//     } else if (nChr < 0x4000000) {
//       /* five bytes */
//       aBytes[nIdx++] = 248 + (nChr >>> 24);
//       aBytes[nIdx++] = 128 + ((nChr >>> 18) & 63);
//       aBytes[nIdx++] = 128 + ((nChr >>> 12) & 63);
//       aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
//       aBytes[nIdx++] = 128 + (nChr & 63);
//       nChrIdx++;
//     } /* if (nChr <= 0x7fffffff) */ else {
//       /* six bytes */
//       aBytes[nIdx++] = 252 + (nChr >>> 30);
//       aBytes[nIdx++] = 128 + ((nChr >>> 24) & 63);
//       aBytes[nIdx++] = 128 + ((nChr >>> 18) & 63);
//       aBytes[nIdx++] = 128 + ((nChr >>> 12) & 63);
//       aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
//       aBytes[nIdx++] = 128 + (nChr & 63);
//       nChrIdx++;
//     }
//     nChrIdx++;
//   }

//   return aBytes;
// }
