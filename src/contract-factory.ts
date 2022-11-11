import { ByteArray, Bytes, ethereum } from "@graphprotocol/graph-ts"; 
import { ZERO_BIGINT, STATS_POSTFIX } from "./constants";
import * as collections from "./constants/collections";
import * as activities from "./constants/activities";
import * as contract_types from "./constants/contract_types";
import * as funs_selectors from "./constants/function_selectors";

import { DeployProxyCall } from "../generated/ContractFactory/ContractFactory"
import { CollectionStats } from "../generated/schema"
import { generateUID, getString, loadContentFromURI } from "./utils";
import { createOrUpdateCollection } from "./modules/collection";
import { createActivity } from "./modules/activity";
import { createOrLoadUser } from "./modules/user";
import { buildCountFromCollection } from "./modules/count";
import { ERC721Token, ERC1155Drop, ERC721Drop, ERC1155Token } from "../generated/templates";

export function handleProxyDeployed(call: DeployProxyCall): void {
  // define local vars from call params
  const currentTimestamp = call.block.timestamp;
  const contractType = call.inputs._type.toHex();
  const functionInput = call.inputs._data.subarray(4);
  const contractAddress = call.outputs.value0;

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
    ERC721Token.create(contractAddress);
  } else if (contractType == contract_types.ERC721DROP_BYTES) {
    // DEPLOY NFT DROP
    decodedInitData = ethereum.decode(funs_selectors.ERC721DROP_INIT, encodedInitData);
    collectionType = collections.ERC721_DROP;
    ERC721Drop.create(contractAddress);
  } else if (contractType == contract_types.ERC1155TOKEN_BYTES) {
    // DEPLOY FRACTIONAL NFT COLLECTION
    decodedInitData = ethereum.decode(funs_selectors.ERC1155TOKEN_INIT, encodedInitData);
    collectionType = collections.ERC1155_TOKEN;
    ERC1155Token.create(contractAddress);
  } else if (contractType == contract_types.ERC1155DROP_BYTES) {
    // DEPLOY FRACTIONAL NFT DROP
    decodedInitData = ethereum.decode(funs_selectors.ERC1155DROP_INIT, encodedInitData);
    collectionType = collections.ERC1155_DROP;
    ERC1155Drop.create(contractAddress);
  }

  if (!decodedInitData) return;
  const initData = decodedInitData.toTuple();
  // log.info('decoded init data: {}', [initData.toString()])
  // init collection entity
  const defaultAdmin = initData[0].toAddress();
  const contractName = initData[1].toString();
  const contractURI = initData[3].toString();
  const creator = createOrLoadUser(defaultAdmin);
  let collection = createOrUpdateCollection(contractAddress, currentTimestamp);
  collection.collectionType = collectionType;
  collection.creator = creator.id;
  collection.metadataURI = contractURI;
  
  // fetch metadata from IPFS URI, then set metadata fields
  const content = loadContentFromURI(contractURI);
  if (content) {
    const name = getString(content, "name");
    collection.name = name ? name : contractName;
    collection.description = getString(content, "description");
    collection.featuredImage = getString(content, "image");;
    collection.bannerImage = getString(content, "banner_image");
    collection.externalLink = getString(content, "external_link");
    collection.fallbackURL = getString(content, "fallback_url");
  } else {
    collection.name = contractName; 
  }

  const statsUID = generateUID([contractAddress.toHex(), STATS_POSTFIX]);
  collection.statistics = statsUID
  collection.createdAt = currentTimestamp;
  collection.updatedAt = currentTimestamp;
  collection.save()

  let stats = new CollectionStats(statsUID)
  stats.collection = contractAddress.toHex();
  stats.volume = ZERO_BIGINT;
  stats.sales = ZERO_BIGINT;
  stats.highestSale = ZERO_BIGINT;
  stats.floorPrice = ZERO_BIGINT;
  stats.averagePrice = ZERO_BIGINT;
  stats.save();

  // init create collection activity entity
  createActivity(activities.CREATE_COLLECTION, call.block, call.transaction, null, contractAddress, defaultAdmin, null);
  buildCountFromCollection();
} 
