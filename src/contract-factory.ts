import { Address, ethereum } from "@graphprotocol/graph-ts"; 
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

export function handleProxyDeployed(call: DeployProxyCall): void {
  // define local vars from call params
  const currentTimestamp = call.block.timestamp;
  const contractType = call.inputs._type.toHex();
  const encodedInitData = call.inputs._data;
  const contractAddress = call.outputs.value0;

  // init field values from input params
  let defaultAdmin: Address = call.from;
  let contractName: string = "";
  let contractURI: string = "";
  let collectionType: string = "";
  if (contractType == contract_types.ERC721TOKEN_BYTES) {
    // DEPLOY NFT COLLECTION
    const decodedInitData = ethereum.decode(funs_selectors.ERC721TOKEN_INIT, encodedInitData);
    if (!decodedInitData) return;
    const initData = decodedInitData.toTuple();
    defaultAdmin = initData[0].toAddress();
    contractName = initData[1].toString();
    contractURI = initData[3].toString();
    collectionType = collections.ERC721_TOKEN;
  } else if (contractType == contract_types.ERC721DROP_BYTES) {
    // DEPLOY NFT DROP
    const decodedInitData = ethereum.decode(funs_selectors.ERC721DROP_INIT, encodedInitData);
    if (!decodedInitData) return;
    const initData = decodedInitData.toTuple();
    defaultAdmin = initData[0].toAddress();
    contractName = initData[1].toString();
    contractURI = initData[3].toString();
    collectionType = collections.ERC721_DROP;
  } else if (contractType == contract_types.ERC1155TOKEN_BYTES) {
    // DEPLOY FRACTIONAL NFT COLLECTION
    const decodedInitData = ethereum.decode(funs_selectors.ERC1155TOKEN_INIT, encodedInitData);
    if (!decodedInitData) return;
    const initData = decodedInitData.toTuple();
    defaultAdmin = initData[0].toAddress();
    contractName = initData[1].toString();
    contractURI = initData[3].toString();
    collectionType = collections.ERC1155_TOKEN;
  } else if (contractType == contract_types.ERC1155DROP_BYTES) {
    // DEPLOY FRACTIONAL NFT DROP
    const decodedInitData = ethereum.decode(funs_selectors.ERC1155DROP_INIT, encodedInitData);
    if (!decodedInitData) return;
    const initData = decodedInitData.toTuple();
    defaultAdmin = initData[0].toAddress();
    contractName = initData[1].toString();
    contractURI = initData[3].toString();
    collectionType = collections.ERC1155_DROP;
  } 

  // init collection entity
  let collection = createOrUpdateCollection(contractAddress, currentTimestamp);
  collection.collectionType = collectionType;
  collection.metadataURI = contractURI;
  collection.creator = defaultAdmin.toHex();
  
  // fetch metadata from IPFS URI, then set metadata fields
  const content = loadContentFromURI(contractURI);
  if (content) {
    const title = getString(content, "title")
    collection.title = title ? title : contractName;
    collection.description = getString(content, "description");
    collection.featuredImage = getString(content, "featuredImage");;
    collection.bannerImage = getString(content, "bannerImage");
    collection.externalLink = getString(content, "externalLink");
  } else {
    collection.title = contractName; 
  }

  const statsUID = generateUID([contractAddress.toHex(), STATS_POSTFIX]);
  let stats = new CollectionStats(statsUID)
  stats.collection = contractAddress.toHex();
  stats.volume = ZERO_BIGINT;
  stats.sales = ZERO_BIGINT;
  stats.highestSale = ZERO_BIGINT;
  stats.floorPrice = ZERO_BIGINT;
  stats.averagePrice = ZERO_BIGINT;
  stats.save();

  collection.statistics = statsUID
  collection.createdAt = currentTimestamp;
  collection.updatedAt = currentTimestamp;
  collection.save()

  // init create collection activity entity
  createActivity(activities.CREATE_COLLECTION, call.block, call.transaction, null, contractAddress, defaultAdmin, null);
} 
