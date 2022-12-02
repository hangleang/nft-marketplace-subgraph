import { ByteArray, Bytes, ethereum } from "@graphprotocol/graph-ts"; 
import * as collections from "./constants/collections";
import * as activities from "./constants/activities";
import * as contract_types from "./constants/contract_types";
import * as funs_selectors from "./constants/function_selectors";

import { ProxyDeployed } from "../generated/ContractFactory/ContractFactory"
import { concatImageIPFS, getString, loadContentFromURI, metadataURIToCID } from "./utils";
import { createOrLoadCollectionStats, createOrUpdateCollection, generateCollectionStatsUID } from "./modules/collection";
import { createActivity } from "./modules/activity";
import { createOrLoadUser } from "./modules/user";
import { ERC721Token, ERC1155Drop, ERC721Drop, ERC1155Token } from "../generated/templates";

export function handleProxyDeployed(event: ProxyDeployed): void {
  // define local vars from call params
  const currentBlock = event.block;
  const currentTimestamp = currentBlock.timestamp;
  const contractType = event.params.contractType.toHex();
  const functionInput = event.params.data.subarray(4);
  const proxyAddress = event.params.proxy;

  //prepend a "tuple" prefix (function params are arrays, not tuples)
  const tuplePrefix = ByteArray.fromHexString(
    '0x0000000000000000000000000000000000000000000000000000000000000020'
  );
  const functionInputAsTuple = new Uint8Array(
    tuplePrefix.length + functionInput.length
  );

  //concat prefix & original input
  functionInputAsTuple.set(tuplePrefix, 0);
  functionInputAsTuple.set(functionInput, tuplePrefix.length);
  const encodedInitData = Bytes.fromUint8Array(functionInputAsTuple);

  // init field values from input params
  let decodedInitData: ethereum.Value | null = null;
  let collectionType: string = contract_types.ERC721TOKEN_BYTES;
  if (contractType == contract_types.ERC721TOKEN_BYTES) {
    // DEPLOY NFT COLLECTION
    decodedInitData = ethereum.decode(funs_selectors.ERC721TOKEN_INIT, encodedInitData);
    collectionType = collections.ERC721_TOKEN;
    ERC721Token.create(proxyAddress);
  } else if (contractType == contract_types.ERC721DROP_BYTES) {
    // DEPLOY NFT DROP
    decodedInitData = ethereum.decode(funs_selectors.ERC721DROP_INIT, encodedInitData);
    collectionType = collections.ERC721_DROP;
    ERC721Drop.create(proxyAddress);
  } else if (contractType == contract_types.ERC1155TOKEN_BYTES) {
    // DEPLOY FRACTIONAL NFT COLLECTION
    decodedInitData = ethereum.decode(funs_selectors.ERC1155TOKEN_INIT, encodedInitData);
    collectionType = collections.ERC1155_TOKEN;
    ERC1155Token.create(proxyAddress);
  } else if (contractType == contract_types.ERC1155DROP_BYTES) {
    // DEPLOY FRACTIONAL NFT DROP
    decodedInitData = ethereum.decode(funs_selectors.ERC1155DROP_INIT, encodedInitData);
    collectionType = collections.ERC1155_DROP;
    ERC1155Drop.create(proxyAddress);
  }

  if (!decodedInitData) return;
  const initData = decodedInitData.toTuple();
  // log.info('decoded init data: {}', [initData.toString()])
  // init collection entity
  const defaultAdmin = initData[0].toAddress();
  const contractName = initData[1].toString();
  const contractURI = initData[3].toString();
  const creator = createOrLoadUser(defaultAdmin);
  let collection = createOrUpdateCollection(proxyAddress, currentTimestamp);
  collection.collectionType = collectionType;
  collection.creator = creator.id;
  collection.metadataURI = contractURI;
  
  // fetch metadata from IPFS URI, then set metadata fields
  const content = loadContentFromURI(contractURI);
  if (content) {
    const name = getString(content, "name");
    const featuredImagePath = getString(content, "image");
    const bannerImagePath = getString(content, "banner_image");
    collection.name = name ? name : contractName;
    collection.description = getString(content, "description");
    collection.featuredImage = featuredImagePath ? concatImageIPFS(contractURI, featuredImagePath) : null;
    collection.bannerImage = bannerImagePath ? concatImageIPFS(contractURI, bannerImagePath) : null;
    collection.externalLink = getString(content, "external_link");
    collection.fallbackURL = getString(content, "fallback_url");
  } else {
    collection.name = contractName; 
  }

  // create collection stats entity
  const statsUID = generateCollectionStatsUID(proxyAddress);
  createOrLoadCollectionStats(proxyAddress);

  collection.statistics = statsUID;
  collection.createdAt = currentTimestamp;
  collection.updatedAt = currentTimestamp;
  collection.save()

  // init create collection activity entity
  createActivity(activities.CREATE_COLLECTION, currentBlock, event.transaction, event.logIndex, null, proxyAddress, defaultAdmin, null);
} 