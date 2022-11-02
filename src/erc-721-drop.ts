import {
  Approval as ApprovalEvent,
  ERC721DropApprovalForAll as ERC721DropApprovalForAllEvent,
  ERC721DropDefaultRoyalty as ERC721DropDefaultRoyaltyEvent,
  ERC721DropInitialized as ERC721DropInitializedEvent,
  ERC721DropMaxTotalSupplyUpdated as ERC721DropMaxTotalSupplyUpdatedEvent,
  ERC721DropMaxWalletClaimCountUpdated as ERC721DropMaxWalletClaimCountUpdatedEvent,
  NFTRevealed as NFTRevealedEvent,
  ERC721DropOwnerUpdated as ERC721DropOwnerUpdatedEvent,
  ERC721DropPlatformFeeInfoUpdated as ERC721DropPlatformFeeInfoUpdatedEvent,
  ERC721DropPrimarySaleRecipientUpdated as ERC721DropPrimarySaleRecipientUpdatedEvent,
  ERC721DropRoleAdminChanged as ERC721DropRoleAdminChangedEvent,
  ERC721DropRoleGranted as ERC721DropRoleGrantedEvent,
  ERC721DropRoleRevoked as ERC721DropRoleRevokedEvent,
  ERC721DropRoyaltyForToken as ERC721DropRoyaltyForTokenEvent,
  ERC721DropTokensClaimed as ERC721DropTokensClaimedEvent,
  ERC721DropTokensLazyMinted as ERC721DropTokensLazyMintedEvent,
  ERC721DropTransfer as ERC721DropTransferEvent,
  ERC721DropWalletClaimCountUpdated as ERC721DropWalletClaimCountUpdatedEvent
} from "../generated/ERC721Drop/ERC721Drop"
import {
  Approval,
  ERC721DropApprovalForAll,
  ERC721DropDefaultRoyalty,
  ERC721DropInitialized,
  ERC721DropMaxTotalSupplyUpdated,
  ERC721DropMaxWalletClaimCountUpdated,
  NFTRevealed,
  ERC721DropOwnerUpdated,
  ERC721DropPlatformFeeInfoUpdated,
  ERC721DropPrimarySaleRecipientUpdated,
  ERC721DropRoleAdminChanged,
  ERC721DropRoleGranted,
  ERC721DropRoleRevoked,
  ERC721DropRoyaltyForToken,
  ERC721DropTokensClaimed,
  ERC721DropTokensLazyMinted,
  ERC721DropTransfer,
  ERC721DropWalletClaimCountUpdated
} from "../generated/schema"

export function handleApproval(event: ApprovalEvent): void {
  let entity = new Approval(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.owner = event.params.owner
  entity.approved = event.params.approved
  entity.tokenId = event.params.tokenId
  entity.save()
}

export function handleERC721DropApprovalForAll(
  event: ERC721DropApprovalForAllEvent
): void {
  let entity = new ERC721DropApprovalForAll(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.owner = event.params.owner
  entity.operator = event.params.operator
  entity.approved = event.params.approved
  entity.save()
}

export function handleERC721DropDefaultRoyalty(
  event: ERC721DropDefaultRoyaltyEvent
): void {
  let entity = new ERC721DropDefaultRoyalty(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.newRoyaltyRecipient = event.params.newRoyaltyRecipient
  entity.newRoyaltyBps = event.params.newRoyaltyBps
  entity.save()
}

export function handleERC721DropInitialized(
  event: ERC721DropInitializedEvent
): void {
  let entity = new ERC721DropInitialized(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.version = event.params.version
  entity.save()
}

export function handleERC721DropMaxTotalSupplyUpdated(
  event: ERC721DropMaxTotalSupplyUpdatedEvent
): void {
  let entity = new ERC721DropMaxTotalSupplyUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.maxTotalSupply = event.params.maxTotalSupply
  entity.save()
}

export function handleERC721DropMaxWalletClaimCountUpdated(
  event: ERC721DropMaxWalletClaimCountUpdatedEvent
): void {
  let entity = new ERC721DropMaxWalletClaimCountUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.count = event.params.count
  entity.save()
}

export function handleNFTRevealed(event: NFTRevealedEvent): void {
  let entity = new NFTRevealed(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.endTokenId = event.params.endTokenId
  entity.revealedURI = event.params.revealedURI
  entity.save()
}

export function handleERC721DropOwnerUpdated(
  event: ERC721DropOwnerUpdatedEvent
): void {
  let entity = new ERC721DropOwnerUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.prevOwner = event.params.prevOwner
  entity.newOwner = event.params.newOwner
  entity.save()
}

export function handleERC721DropPlatformFeeInfoUpdated(
  event: ERC721DropPlatformFeeInfoUpdatedEvent
): void {
  let entity = new ERC721DropPlatformFeeInfoUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.platformFeeRecipient = event.params.platformFeeRecipient
  entity.platformFeeBps = event.params.platformFeeBps
  entity.save()
}

export function handleERC721DropPrimarySaleRecipientUpdated(
  event: ERC721DropPrimarySaleRecipientUpdatedEvent
): void {
  let entity = new ERC721DropPrimarySaleRecipientUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.recipient = event.params.recipient
  entity.save()
}

export function handleERC721DropRoleAdminChanged(
  event: ERC721DropRoleAdminChangedEvent
): void {
  let entity = new ERC721DropRoleAdminChanged(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.role = event.params.role
  entity.previousAdminRole = event.params.previousAdminRole
  entity.newAdminRole = event.params.newAdminRole
  entity.save()
}

export function handleERC721DropRoleGranted(
  event: ERC721DropRoleGrantedEvent
): void {
  let entity = new ERC721DropRoleGranted(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender
  entity.save()
}

export function handleERC721DropRoleRevoked(
  event: ERC721DropRoleRevokedEvent
): void {
  let entity = new ERC721DropRoleRevoked(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender
  entity.save()
}

export function handleERC721DropRoyaltyForToken(
  event: ERC721DropRoyaltyForTokenEvent
): void {
  let entity = new ERC721DropRoyaltyForToken(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.tokenId = event.params.tokenId
  entity.royaltyRecipient = event.params.royaltyRecipient
  entity.royaltyBps = event.params.royaltyBps
  entity.save()
}

export function handleERC721DropTokensClaimed(
  event: ERC721DropTokensClaimedEvent
): void {
  let entity = new ERC721DropTokensClaimed(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.claimConditionIndex = event.params.claimConditionIndex
  entity.claimer = event.params.claimer
  entity.receiver = event.params.receiver
  entity.startTokenId = event.params.startTokenId
  entity.quantityClaimed = event.params.quantityClaimed
  entity.save()
}

export function handleERC721DropTokensLazyMinted(
  event: ERC721DropTokensLazyMintedEvent
): void {
  let entity = new ERC721DropTokensLazyMinted(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.startTokenId = event.params.startTokenId
  entity.endTokenId = event.params.endTokenId
  entity.baseURI = event.params.baseURI
  entity.encryptedBaseURI = event.params.encryptedBaseURI
  entity.save()
}

export function handleERC721DropTransfer(event: ERC721DropTransferEvent): void {
  let entity = new ERC721DropTransfer(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.tokenId = event.params.tokenId
  entity.save()
}

export function handleERC721DropWalletClaimCountUpdated(
  event: ERC721DropWalletClaimCountUpdatedEvent
): void {
  let entity = new ERC721DropWalletClaimCountUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.wallet = event.params.wallet
  entity.count = event.params.count
  entity.save()
}
