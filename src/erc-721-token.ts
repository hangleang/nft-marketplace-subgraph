import {
  ERC721TokenApproval as ERC721TokenApprovalEvent,
  ERC721TokenApprovalForAll as ERC721TokenApprovalForAllEvent,
  ERC721TokenDefaultRoyalty as ERC721TokenDefaultRoyaltyEvent,
  ERC721TokenInitialized as ERC721TokenInitializedEvent,
  ERC721TokenOwnerUpdated as ERC721TokenOwnerUpdatedEvent,
  ERC721TokenPlatformFeeInfoUpdated as ERC721TokenPlatformFeeInfoUpdatedEvent,
  ERC721TokenPrimarySaleRecipientUpdated as ERC721TokenPrimarySaleRecipientUpdatedEvent,
  ERC721TokenRoleAdminChanged as ERC721TokenRoleAdminChangedEvent,
  ERC721TokenRoleGranted as ERC721TokenRoleGrantedEvent,
  ERC721TokenRoleRevoked as ERC721TokenRoleRevokedEvent,
  ERC721TokenRoyaltyForToken as ERC721TokenRoyaltyForTokenEvent,
  TokensMinted as TokensMintedEvent,
  TokensMintedWithSignature as TokensMintedWithSignatureEvent,
  Transfer as TransferEvent
} from "../generated/ERC721Token/ERC721Token"
import {
  ERC721TokenApproval,
  ERC721TokenApprovalForAll,
  ERC721TokenDefaultRoyalty,
  ERC721TokenInitialized,
  ERC721TokenOwnerUpdated,
  ERC721TokenPlatformFeeInfoUpdated,
  ERC721TokenPrimarySaleRecipientUpdated,
  ERC721TokenRoleAdminChanged,
  ERC721TokenRoleGranted,
  ERC721TokenRoleRevoked,
  ERC721TokenRoyaltyForToken,
  TokensMinted,
  TokensMintedWithSignature,
  Transfer
} from "../generated/schema"

export function handleERC721TokenApproval(
  event: ERC721TokenApprovalEvent
): void {
  let entity = new ERC721TokenApproval(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.owner = event.params.owner
  entity.approved = event.params.approved
  entity.tokenId = event.params.tokenId
  entity.save()
}

export function handleERC721TokenApprovalForAll(
  event: ERC721TokenApprovalForAllEvent
): void {
  let entity = new ERC721TokenApprovalForAll(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.owner = event.params.owner
  entity.operator = event.params.operator
  entity.approved = event.params.approved
  entity.save()
}

export function handleERC721TokenDefaultRoyalty(
  event: ERC721TokenDefaultRoyaltyEvent
): void {
  let entity = new ERC721TokenDefaultRoyalty(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.newRoyaltyRecipient = event.params.newRoyaltyRecipient
  entity.newRoyaltyBps = event.params.newRoyaltyBps
  entity.save()
}

export function handleERC721TokenInitialized(
  event: ERC721TokenInitializedEvent
): void {
  let entity = new ERC721TokenInitialized(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.version = event.params.version
  entity.save()
}

export function handleERC721TokenOwnerUpdated(
  event: ERC721TokenOwnerUpdatedEvent
): void {
  let entity = new ERC721TokenOwnerUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.prevOwner = event.params.prevOwner
  entity.newOwner = event.params.newOwner
  entity.save()
}

export function handleERC721TokenPlatformFeeInfoUpdated(
  event: ERC721TokenPlatformFeeInfoUpdatedEvent
): void {
  let entity = new ERC721TokenPlatformFeeInfoUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.platformFeeRecipient = event.params.platformFeeRecipient
  entity.platformFeeBps = event.params.platformFeeBps
  entity.save()
}

export function handleERC721TokenPrimarySaleRecipientUpdated(
  event: ERC721TokenPrimarySaleRecipientUpdatedEvent
): void {
  let entity = new ERC721TokenPrimarySaleRecipientUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.recipient = event.params.recipient
  entity.save()
}

export function handleERC721TokenRoleAdminChanged(
  event: ERC721TokenRoleAdminChangedEvent
): void {
  let entity = new ERC721TokenRoleAdminChanged(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.role = event.params.role
  entity.previousAdminRole = event.params.previousAdminRole
  entity.newAdminRole = event.params.newAdminRole
  entity.save()
}

export function handleERC721TokenRoleGranted(
  event: ERC721TokenRoleGrantedEvent
): void {
  let entity = new ERC721TokenRoleGranted(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender
  entity.save()
}

export function handleERC721TokenRoleRevoked(
  event: ERC721TokenRoleRevokedEvent
): void {
  let entity = new ERC721TokenRoleRevoked(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender
  entity.save()
}

export function handleERC721TokenRoyaltyForToken(
  event: ERC721TokenRoyaltyForTokenEvent
): void {
  let entity = new ERC721TokenRoyaltyForToken(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.tokenId = event.params.tokenId
  entity.royaltyRecipient = event.params.royaltyRecipient
  entity.royaltyBps = event.params.royaltyBps
  entity.save()
}

export function handleTokensMinted(event: TokensMintedEvent): void {
  let entity = new TokensMinted(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.mintedTo = event.params.mintedTo
  entity.tokenIdMinted = event.params.tokenIdMinted
  entity.uri = event.params.uri
  entity.save()
}

export function handleTokensMintedWithSignature(
  event: TokensMintedWithSignatureEvent
): void {
  let entity = new TokensMintedWithSignature(
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
  entity.mintRequest_uri = event.params.mintRequest.uri
  entity.mintRequest_price = event.params.mintRequest.price
  entity.mintRequest_currency = event.params.mintRequest.currency
  entity.mintRequest_validityStartTimestamp =
    event.params.mintRequest.validityStartTimestamp
  entity.mintRequest_validityEndTimestamp =
    event.params.mintRequest.validityEndTimestamp
  entity.mintRequest_uid = event.params.mintRequest.uid
  entity.save()
}

export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.tokenId = event.params.tokenId
  entity.save()
}
