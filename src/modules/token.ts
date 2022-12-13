import { Address, BigInt, ethereum, JSONValue, JSONValueKind } from "@graphprotocol/graph-ts";
import { decimals } from '@amxx/graphprotocol-utils'
import { TokenBalance, Collection, Token, Account, Attribute } from "../../generated/schema";
import { NULL_ADDRESS, ZERO_BIGINT, ZERO_DECIMAL } from "../constants";
import { formateURI, generateUID, getString, isIPFS, loadContentFromURI, replaceURI } from "../utils";
// import { IERC721 } from "../../generated/ERC721/IERC721";
// import { IERC1155 } from "../../generated/ERC1155/IERC1155";
// import { IERC721ERC1155 } from "../../generated/ERC1155/IERC721ERC1155";
import { INFTs } from '../../generated/NFTs/INFTs';
import { createOrLoadAccount } from "./account";
import { createActivity } from "./activity";

import * as collections from '../constants/collections';
import * as activities from '../constants/activities';

const TOTAL_SUPPLY_POSTFIX: string = 'totalSupply'

export function createOrLoadToken(collection: Collection, tokenId: BigInt, currentTimestamp: BigInt): Token {
    const collectionAddress = Address.fromString(collection.id)
    const id = generateTokenUID(collectionAddress, tokenId)
    let token = Token.load(id)

    if (token == null) {
        token               = new Token(id)
        token.collection    = collection.id
        token.tokenId       = tokenId
        token.totalSupply   = createOrLoadTokenBalance(token, null).id
        token.approval      = createOrLoadAccount(NULL_ADDRESS).id

        // implicit set non-null fields with default value, in case no metadataURI
        token.isIPFS   = false
        token.decimals = 1
        token.name     = generateTokenName(collectionAddress, token.tokenId)

        let tokenURI = '';
        if (collection.supportsMetadata) {
            const asset             = INFTs.bind(collectionAddress)
            
            if (collection.collectionType == collections.SINGLE) {
                // const erc721        = IERC721.bind(collectionAddress)
                const try_tokenURI  = asset.try_tokenURI(tokenId)
                tokenURI            = try_tokenURI.reverted ? '' : try_tokenURI.value
            } else if (collection.collectionType == collections.MULTI) {
                // const erc1155       = IERC1155.bind(collectionAddress)
                const try_uri       = asset.try_uri(tokenId)
                tokenURI            = try_uri.reverted ? '' : replaceURI(try_uri.value, tokenId)
            } else if (collection.collectionType == collections.SEMI) {
                // const asset         = IERC721ERC1155.bind(collectionAddress)

                let collectionId: BigInt
                let isCollection = false
                let owner: string | null = null
                const try_owner = asset.try_ownerOf(tokenId)
                
                if (!try_owner.reverted) {
                    owner = try_owner.value.toHex()
                }
                if (owner != null) {
                    let try_collectionId = asset.try_collectionOf(tokenId)

                    if (!try_collectionId.reverted) {
                      collectionId = try_collectionId.value
                      isCollection = true
                    } else {
                      collectionId = tokenId // a dual token minted as NFT straight away is its own collection
                    }
                } else {
                    collectionId = tokenId
                }

                const try_uri           = isCollection ? asset.try_uri(collectionId) : asset.try_tokenURI(collectionId)
                tokenURI                = try_uri.reverted ? '' : replaceURI(try_uri.value, tokenId)
            }
        }

        if (tokenURI != '') {
            // fetch metadata from IPFS URI, then set metadata fields
            token          = updateTokenMetadata(token, tokenURI)
        }

        token.createdAt = currentTimestamp
        token.updatedAt = currentTimestamp
    }

    return token
}

export function updateTokenMetadata(token: Token, tokenURI: string): Token {
    const collectionAddress = Address.fromString(token.collection)
    const generatedName     = generateTokenName(collectionAddress, token.tokenId)
    token.tokenURI          = tokenURI
    token.isIPFS            = isIPFS(tokenURI)
    
    const content           = loadContentFromURI(tokenURI)
    if (content) {
        const name          = getString(content, "name")
        const image         = getString(content, "image")
        const externalURL   = getString(content, "external_url")
        const animationURL  = getString(content, "animation_url")
        token.name          = name ? name : generatedName
        token.description   = getString(content, "description")
        token.contentURI    = formateURI(image, tokenURI)
        token.externalURL   = formateURI(externalURL, tokenURI)
        token.fallbackURL   = getString(content, "fallback_url")
        token.bgColor       = getString(content, "background_color")
        token.animationURL  = formateURI(animationURL, tokenURI)
        token.youtubeURL    = getString(content, "youtube_url")
        
        const decimals      = content.get("decimals")
        if (decimals != null && decimals.kind == JSONValueKind.NUMBER) {
            token.decimals  = decimals.toBigInt().toI32()
        } else {
            token.decimals  = 1
        }

        // get attributes link to this token
        const attributes    = content.get("attributes")
        if (attributes) {
            if (attributes.kind == JSONValueKind.ARRAY) {
                const attributesEntries = attributes.toArray()
                    
                for (let i = 0; i < attributesEntries.length; i++) {
                    const entry     = attributesEntries[i]
                    if (entry.kind == JSONValueKind.OBJECT) {
                        const attribute     = entry.toObject();
                        const displayType   = getString(attribute, "display_type");
                        const traitType     = getString(attribute, "trait_type");
                        const value         = attribute.get("value");
                        createOrUpdateTokenAttribute(token, i, displayType, traitType, value)
                    }
                }
            }
        }
    } else {
        token.name = generatedName;
    }

    return token;
}

export function createOrLoadTokenBalance(token: Token, owner: Account | null): TokenBalance {
    const id = generateUID([token.id, owner ? owner.id : TOTAL_SUPPLY_POSTFIX])
    let balance = TokenBalance.load(id)

    if (balance == null) {
        balance             = new TokenBalance(id)
        balance.collection  = token.collection
        balance.token       = token.id
        balance.owner       = owner ? owner.id : null
        balance.value       = ZERO_DECIMAL
        balance.valueExact  = ZERO_BIGINT
        balance.save()
    }
    return balance
}

export function registerTransfer(
	event: ethereum.Event,
	collection: Collection,
	// operator: Account,
	from: Account,
	to: Account,
	tokenId: BigInt,
	value: BigInt,
    timestamp: BigInt
): void {
    const token         = createOrLoadToken(collection, tokenId, timestamp)
                
    const fromAddress   = Address.fromString(from.id)
    const toAddress     = Address.fromString(to.id)
    // if mintEvent, set creator address
    // else transferEvent, reset approval
    if (fromAddress == NULL_ADDRESS) {
        token.creator   = to.id;

        // Create mint activity entity
        createActivity(activities.MINTED, event, token, toAddress, null)
    } else {
        token.approval  = createOrLoadAccount(NULL_ADDRESS).id // implicit approval reset on transfer

        // Create transfer activity entity
        createActivity(activities.TRANSFERRED, event, token, fromAddress, toAddress)
    }

    // Update both parties token balances (ownership)
    transferTokenBalance(token, from, to, value)

    token.save()
}

function transferTokenBalance(token: Token, from: Account, to: Account, value: BigInt): void {
    if (Address.fromString(from.id) == NULL_ADDRESS) {
		let totalSupply        = createOrLoadTokenBalance(token, null)
		totalSupply.valueExact = totalSupply.valueExact.plus(value)
		totalSupply.value      = decimals.toDecimals(totalSupply.valueExact, token.decimals)
		totalSupply.save()
	} else {
		let balance            = createOrLoadTokenBalance(token, from)
		balance.valueExact     = balance.valueExact.minus(value)
		balance.value          = decimals.toDecimals(balance.valueExact, token.decimals)
		balance.save()
	}

	if (Address.fromString(to.id) == NULL_ADDRESS) {
		let totalSupply        = createOrLoadTokenBalance(token, null)
		totalSupply.valueExact = totalSupply.valueExact.minus(value)
		totalSupply.value      = decimals.toDecimals(totalSupply.valueExact, token.decimals)
		totalSupply.save()
	} else {
		let balance            = createOrLoadTokenBalance(token, to)
		balance.valueExact     = balance.valueExact.plus(value)
		balance.value          = decimals.toDecimals(balance.valueExact, token.decimals)
		balance.save()
	}
}


function createOrUpdateTokenAttribute(token: Token, key: number, displayType: string | null, traitType: string | null, value: JSONValue | null): void {
    const id            = generateTokenAttributeUID(token, key)
    let attribute       = Attribute.load(id)

    let valueAsString: string = '';
    if (value != null) {
        if (value.kind == JSONValueKind.NUMBER) {
            valueAsString = value.data.toString();
        } else if (value.kind == JSONValueKind.STRING) {
            valueAsString = value.toString();
        }
    }
    
    if (attribute == null) {
        attribute       = new Attribute(id);
        attribute.token = token.id
    }
    attribute.displayType   = displayType ? displayType : "string"
    attribute.traitType     = traitType ? traitType : "property"
    attribute.value         = valueAsString
    attribute.save()
}

function generateTokenUID(collection: Address, tokenID: BigInt): string {
    return generateUID([collection.toHex(), tokenID.toString()], ":")
}

function generateTokenAttributeUID(token: Token, key: number): string {
    return generateUID([token.id, key.toString()], ":")
}

function generateTokenName(collectionAddress: Address, tokenID: BigInt): string {
    let collectionName: string;
    const collection = Collection.load(collectionAddress.toHex());
    if (collection) {
      collectionName = collection.name;
    } else {
      collectionName = "Untitled Collection";
    }
    return generateUID([collectionName, `#${tokenID}`], " ");
}