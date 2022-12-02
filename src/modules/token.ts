import { Address, BigInt, JSONValue, JSONValueKind } from "@graphprotocol/graph-ts";
import { decimals } from '@amxx/graphprotocol-utils'
import { TokenBalance, Collection, Token, Account, Attribute } from "../../generated/schema";
import { NULL_ADDRESS, ZERO_BIGINT, ZERO_DECIMAL } from "../constants";
import { concatImageIPFS, generateUID, getString, isIPFS, isURI, loadContentFromURI } from "../utils";
import * as collections from '../constants/collections';
import { IERC721 } from "../../generated/ERC721/IERC721";
import { IERC1155 } from "../../generated/ERC1155/IERC1155";
import { createOrLoadAccount } from "./account";

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

        let tokenURI = '';
        if (collection.supportsMetadata) {
            if (collection.collectionType == collections.SINGLE) {
                let erc721          = IERC721.bind(collectionAddress)
                let try_tokenURI    = erc721.try_tokenURI(tokenId)
                tokenURI            = try_tokenURI.reverted ? '' : try_tokenURI.value
            } else if (collection.collectionType == collections.MULTI) {
                let erc1155         = IERC1155.bind(collectionAddress)
                let try_uri         = erc1155.try_uri(tokenId)
                tokenURI            = try_uri.reverted ? '' : replaceURI(try_uri.value, tokenId)
            }
        }
        if (tokenURI != '') {
            // fetch metadata from IPFS URI, then set metadata fields
            token          = updateTokenMetadata(token, tokenURI)
        } else {
            // implicit set name, in case no metadataURI
            token.isIPFS   = false;
            token.name     = generateTokenName(collectionAddress, token.tokenId)
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
        token.name          = name ? name : generatedName
        token.description   = getString(content, "description")
        token.contentURI    = image ? isURI(image) ? image : concatImageIPFS(tokenURI, image) : null
        token.externalURL   = getString(content, "external_url")
        token.fallbackURL   = getString(content, "fallback_url")
        token.bgColor       = getString(content, "background_color")
        token.animationURL  = getString(content, "animation_url")
        token.youtubeURL    = getString(content, "youtube_url")

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

export function transferTokenBalance(token: Token, from: Account, to: Account, value: BigInt): void {
    if (Address.fromString(from.id) == NULL_ADDRESS) {
		let totalSupply        = createOrLoadTokenBalance(token, null)
		totalSupply.valueExact = totalSupply.valueExact.plus(value)
		totalSupply.value      = decimals.toDecimals(totalSupply.valueExact)
		totalSupply.save()
	} else {
		let balance            = createOrLoadTokenBalance(token, from)
		balance.valueExact     = balance.valueExact.minus(value)
		balance.value          = decimals.toDecimals(balance.valueExact)
		balance.save()
	}

	if (Address.fromString(to.id) == NULL_ADDRESS) {
		let totalSupply        = createOrLoadTokenBalance(token, null)
		totalSupply.valueExact = totalSupply.valueExact.minus(value)
		totalSupply.value      = decimals.toDecimals(totalSupply.valueExact)
		totalSupply.save()
	} else {
		let balance            = createOrLoadTokenBalance(token, to)
		balance.valueExact     = balance.valueExact.plus(value)
		balance.value          = decimals.toDecimals(balance.valueExact)
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

export function generateTokenUID(collection: Address, tokenID: BigInt): string {
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

export function replaceURI(uri: string, tokenId: BigInt): string {
	return uri.replaceAll(
		'{id}',
		tokenId.toHex().slice(2).padStart(64, '0'),
	)
}

export function setTokenDropDetail(tokenUID: string, dropDetailUID: string): void {
    const token = Token.load(tokenUID);

    if (token) {
        token.dropDetails = dropDetailUID;
        token.save();
    }
}