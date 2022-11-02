import {
  ERC1155TokenApprovalForAll as ERC1155TokenApprovalForAllEvent,
  ERC1155TokenDefaultRoyalty as ERC1155TokenDefaultRoyaltyEvent,
  ERC1155TokenInitialized as ERC1155TokenInitializedEvent,
  ERC1155TokenOwnerUpdated as ERC1155TokenOwnerUpdatedEvent,
  ERC1155TokenPlatformFeeInfoUpdated as ERC1155TokenPlatformFeeInfoUpdatedEvent,
  ERC1155TokenPrimarySaleRecipientUpdated as ERC1155TokenPrimarySaleRecipientUpdatedEvent,
  ERC1155TokenRoleAdminChanged as ERC1155TokenRoleAdminChangedEvent,
  ERC1155TokenRoleGranted as ERC1155TokenRoleGrantedEvent,
  ERC1155TokenRoleRevoked as ERC1155TokenRoleRevokedEvent,
  ERC1155TokenRoyaltyForToken as ERC1155TokenRoyaltyForTokenEvent,
  ERC1155TokenTokensMinted as ERC1155TokenTokensMintedEvent,
  ERC1155TokenTokensMintedWithSignature as ERC1155TokenTokensMintedWithSignatureEvent,
  ERC1155TokenTransferBatch as ERC1155TokenTransferBatchEvent,
  ERC1155TokenTransferSingle as ERC1155TokenTransferSingleEvent,
  ERC1155TokenURI as ERC1155TokenURIEvent
} from "../generated/ERC1155Token/ERC1155Token"
import {
  ERC1155TokenApprovalForAll,
  ERC1155TokenDefaultRoyalty,
  ERC1155TokenInitialized,
  ERC1155TokenOwnerUpdated,
  ERC1155TokenPlatformFeeInfoUpdated,
  ERC1155TokenPrimarySaleRecipientUpdated,
  ERC1155TokenRoleAdminChanged,
  ERC1155TokenRoleGranted,
  ERC1155TokenRoleRevoked,
  ERC1155TokenRoyaltyForToken,
  ERC1155TokenTokensMinted,
  ERC1155TokenTokensMintedWithSignature,
  ERC1155TokenTransferBatch,
  ERC1155TokenTransferSingle,
  ERC1155TokenURI
} from "../generated/schema"

export function handleERC1155TokenApprovalForAll(
  event: ERC1155TokenApprovalForAllEvent
): void {
  let entity = new ERC1155TokenApprovalForAll(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.account = event.params.account
  entity.operator = event.params.operator
  entity.approved = event.params.approved
  entity.save()
}

export function handleERC1155TokenDefaultRoyalty(
  event: ERC1155TokenDefaultRoyaltyEvent
): void {
  let entity = new ERC1155TokenDefaultRoyalty(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.newRoyaltyRecipient = event.params.newRoyaltyRecipient
  entity.newRoyaltyBps = event.params.newRoyaltyBps
  entity.save()
}

export function handleERC1155TokenInitialized(
  event: ERC1155TokenInitializedEvent
): void {
  let entity = new ERC1155TokenInitialized(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.version = event.params.version
  entity.save()
}

export function handleERC1155TokenOwnerUpdated(
  event: ERC1155TokenOwnerUpdatedEvent
): void {
  let entity = new ERC1155TokenOwnerUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.prevOwner = event.params.prevOwner
  entity.newOwner = event.params.newOwner
  entity.save()
}

export function handleERC1155TokenPlatformFeeInfoUpdated(
  event: ERC1155TokenPlatformFeeInfoUpdatedEvent
): void {
  let entity = new ERC1155TokenPlatformFeeInfoUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.platformFeeRecipient = event.params.platformFeeRecipient
  entity.platformFeeBps = event.params.platformFeeBps
  entity.save()
}

export function handleERC1155TokenPrimarySaleRecipientUpdated(
  event: ERC1155TokenPrimarySaleRecipientUpdatedEvent
): void {
  let entity = new ERC1155TokenPrimarySaleRecipientUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.recipient = event.params.recipient
  entity.save()
}

export function handleERC1155TokenRoleAdminChanged(
  event: ERC1155TokenRoleAdminChangedEvent
): void {
  let entity = new ERC1155TokenRoleAdminChanged(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.role = event.params.role
  entity.previousAdminRole = event.params.previousAdminRole
  entity.newAdminRole = event.params.newAdminRole
  entity.save()
}

export function handleERC1155TokenRoleGranted(
  event: ERC1155TokenRoleGrantedEvent
): void {
  let entity = new ERC1155TokenRoleGranted(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender
  entity.save()
}

export function handleERC1155TokenRoleRevoked(
  event: ERC1155TokenRoleRevokedEvent
): void {
  let entity = new ERC1155TokenRoleRevoked(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender
  entity.save()
}

export function handleERC1155TokenRoyaltyForToken(
  event: ERC1155TokenRoyaltyForTokenEvent
): void {
  let entity = new ERC1155TokenRoyaltyForToken(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.tokenId = event.params.tokenId
  entity.royaltyRecipient = event.params.royaltyRecipient
  entity.royaltyBps = event.params.royaltyBps
  entity.save()
}

export function handleERC1155TokenTokensMinted(
  event: ERC1155TokenTokensMintedEvent
): void {
  let entity = new ERC1155TokenTokensMinted(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.mintedTo = event.params.mintedTo
  entity.tokenIdMinted = event.params.tokenIdMinted
  entity.uri = event.params.uri
  entity.quantityMinted = event.params.quantityMinted
  entity.save()
}

export function handleERC1155TokenTokensMintedWithSignature(
  event: ERC1155TokenTokensMintedWithSignatureEvent
): void {
  let entity = new ERC1155TokenTokensMintedWithSignature(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.signer = event.params.signer
  entity.mintedTo = event.params.mintedTo
  entity.tokenIdMinted = event.params.tokenIdMinted
  entity.mintRequest_to = event.params.mintRequest.to
  entity.mintRequest_royaltyRecipient =
    event.params.mintRequest.royaltyRecipient
  entity.mintRequest_royaltyBps = event.params.mintRequest.royaltyBps
  entity.mintRequest_primarySaleRecipient =
    event.params.mintRequest.primarySaleRecipient
  entity.mintRequest_tokenId = event.params.mintRequest.tokenId
  entity.mintRequest_uri = event.params.mintRequest.uri
  entity.mintRequest_quantity = event.params.mintRequest.quantity
  entity.mintRequest_pricePerToken = event.params.mintRequest.pricePerToken
  entity.mintRequest_currency = event.params.mintRequest.currency
  entity.mintRequest_validityStartTimestamp =
    event.params.mintRequest.validityStartTimestamp
  entity.mintRequest_validityEndTimestamp =
    event.params.mintRequest.validityEndTimestamp
  entity.mintRequest_uid = event.params.mintRequest.uid
  entity.save()
}

export function handleERC1155TokenTransferBatch(
  event: ERC1155TokenTransferBatchEvent
): void {
  let entity = new ERC1155TokenTransferBatch(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.operator = event.params.operator
  entity.from = event.params.from
  entity.to = event.params.to
  entity.ids = event.params.ids
  entity.values = event.params.values
  entity.save()
}

export function handleERC1155TokenTransferSingle(
  event: ERC1155TokenTransferSingleEvent
): void {
  let entity = new ERC1155TokenTransferSingle(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.operator = event.params.operator
  entity.from = event.params.from
  entity.to = event.params.to
  entity.id = event.params.id
  entity.value = event.params.value
  entity.save()
}

export function handleERC1155TokenURI(event: ERC1155TokenURIEvent): void {
  let entity = new ERC1155TokenURI(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.value = event.params.value
  entity.id = event.params.id
  entity.save()
}
