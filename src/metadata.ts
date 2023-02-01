import { Bytes, dataSource, json, JSONValueKind, log } from "@graphprotocol/graph-ts";
import { updateCollectionMetadata } from "./modules/collection";
// import { updateTokenMetadata } from "./modules/token";
import { CIDToIpfsURI } from "./utils";

// export function handleTokenMetadata(content: Bytes): void {
//     log.info(">>>>>>>>>>>>>>>>> CID: {}", [dataSource.stringParam()]);
//     const CID = dataSource.address();
//     const metadataURI = CIDToIpfsURI(CID.toString());
//     let context = dataSource.context();
//     const tokenUID = context.getString("tokenUID"); 
//     log.info(">>>>>>>>>>>>>>>>> TOKEN: {}", [tokenUID]);
    
//     const try_value = json.try_fromBytes(content)
//     if (try_value.isOk) {
//         const value = try_value.value

//         if (value.kind == JSONValueKind.OBJECT) {
//             const jsonData = value.toObject();

//             updateTokenMetadata(tokenUID, metadataURI, jsonData)
//         }
//     }
// }

export function handleCollectionMetadata(content: Bytes): void {
    log.info(">>>>>>>>>>>>>>>>> CID: {}", [dataSource.stringParam()]);
    const CID = dataSource.address();
    const metadataURI = CIDToIpfsURI(CID.toString());
    let context = dataSource.context();
    const collectionAddress = context.getString("collectionAddress"); 
    log.info(">>>>>>>>>>>>>>>>> COLLECTION: {}", [collectionAddress]);
    
    const try_value = json.try_fromBytes(content)
    if (try_value.isOk) {
        const value = try_value.value

        if (value.kind == JSONValueKind.OBJECT) {
            const jsonData = value.toObject();

            updateCollectionMetadata(collectionAddress, metadataURI, jsonData)
        }
    }
    
}