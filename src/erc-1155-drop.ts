import {
  ApprovalForAll as ApprovalForAllEvent,
  DefaultRoyalty as DefaultRoyaltyEvent,
  ERC1155DropInitialized as ERC1155DropInitializedEvent,
  MaxTotalSupplyUpdated as MaxTotalSupplyUpdatedEvent,
  MaxWalletClaimCountUpdated as MaxWalletClaimCountUpdatedEvent,
  OwnerUpdated as OwnerUpdatedEvent,
  ERC1155DropPlatformFeeInfoUpdated as ERC1155DropPlatformFeeInfoUpdatedEvent,
  PrimarySaleRecipientUpdated as PrimarySaleRecipientUpdatedEvent,
  ERC1155DropRoleAdminChanged as ERC1155DropRoleAdminChangedEvent,
  ERC1155DropRoleGranted as ERC1155DropRoleGrantedEvent,
  ERC1155DropRoleRevoked as ERC1155DropRoleRevokedEvent,
  RoyaltyForToken as RoyaltyForTokenEvent,
  SaleRecipientForTokenUpdated as SaleRecipientForTokenUpdatedEvent,
  TokensClaimed as TokensClaimedEvent,
  TokensLazyMinted as TokensLazyMintedEvent,
  TransferBatch as TransferBatchEvent,
  TransferSingle as TransferSingleEvent,
  URI as URIEvent,
  WalletClaimCountUpdated as WalletClaimCountUpdatedEvent
} from "../generated/ERC1155Drop/ERC1155Drop"
import {
  ApprovalForAll,
  DefaultRoyalty,
  ERC1155DropInitialized,
  MaxTotalSupplyUpdated,
  MaxWalletClaimCountUpdated,
  OwnerUpdated,
  ERC1155DropPlatformFeeInfoUpdated,
  PrimarySaleRecipientUpdated,
  ERC1155DropRoleAdminChanged,
  ERC1155DropRoleGranted,
  ERC1155DropRoleRevoked,
  RoyaltyForToken,
  SaleRecipientForTokenUpdated,
  TokensClaimed,
  TokensLazyMinted,
  TransferBatch,
  TransferSingle,
  URI,
  WalletClaimCountUpdated
} from "../generated/schema"

export function handleApprovalForAll(event: ApprovalForAllEvent): void {
  let entity = new ApprovalForAll(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.account = event.params.account
  entity.operator = event.params.operator
  entity.approved = event.params.approved
  entity.save()
}

export function handleDefaultRoyalty(event: DefaultRoyaltyEvent): void {
  let entity = new DefaultRoyalty(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.newRoyaltyRecipient = event.params.newRoyaltyRecipient
  entity.newRoyaltyBps = event.params.newRoyaltyBps
  entity.save()
}

export function handleERC1155DropInitialized(
  event: ERC1155DropInitializedEvent
): void {
  let entity = new ERC1155DropInitialized(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.version = event.params.version
  entity.save()
}

export function handleMaxTotalSupplyUpdated(
  event: MaxTotalSupplyUpdatedEvent
): void {
  let entity = new MaxTotalSupplyUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.tokenId = event.params.tokenId
  entity.maxTotalSupply = event.params.maxTotalSupply
  entity.save()
}

export function handleMaxWalletClaimCountUpdated(
  event: MaxWalletClaimCountUpdatedEvent
): void {
  let entity = new MaxWalletClaimCountUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.tokenId = event.params.tokenId
  entity.count = event.params.count
  entity.save()
}

export function handleOwnerUpdated(event: OwnerUpdatedEvent): void {
  let entity = new OwnerUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.prevOwner = event.params.prevOwner
  entity.newOwner = event.params.newOwner
  entity.save()
}

export function handleERC1155DropPlatformFeeInfoUpdated(
  event: ERC1155DropPlatformFeeInfoUpdatedEvent
): void {
  let entity = new ERC1155DropPlatformFeeInfoUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.platformFeeRecipient = event.params.platformFeeRecipient
  entity.platformFeeBps = event.params.platformFeeBps
  entity.save()
}

export function handlePrimarySaleRecipientUpdated(
  event: PrimarySaleRecipientUpdatedEvent
): void {
  let entity = new PrimarySaleRecipientUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.recipient = event.params.recipient
  entity.save()
}

export function handleERC1155DropRoleAdminChanged(
  event: ERC1155DropRoleAdminChangedEvent
): void {
  let entity = new ERC1155DropRoleAdminChanged(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.role = event.params.role
  entity.previousAdminRole = event.params.previousAdminRole
  entity.newAdminRole = event.params.newAdminRole
  entity.save()
}

export function handleERC1155DropRoleGranted(
  event: ERC1155DropRoleGrantedEvent
): void {
  let entity = new ERC1155DropRoleGranted(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender
  entity.save()
}

export function handleERC1155DropRoleRevoked(
  event: ERC1155DropRoleRevokedEvent
): void {
  let entity = new ERC1155DropRoleRevoked(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender
  entity.save()
}

export function handleRoyaltyForToken(event: RoyaltyForTokenEvent): void {
  let entity = new RoyaltyForToken(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.tokenId = event.params.tokenId
  entity.royaltyRecipient = event.params.royaltyRecipient
  entity.royaltyBps = event.params.royaltyBps
  entity.save()
}

export function handleSaleRecipientForTokenUpdated(
  event: SaleRecipientForTokenUpdatedEvent
): void {
  let entity = new SaleRecipientForTokenUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.tokenId = event.params.tokenId
  entity.saleRecipient = event.params.saleRecipient
  entity.save()
}

export function handleTokensClaimed(event: TokensClaimedEvent): void {
  let entity = new TokensClaimed(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.claimConditionIndex = event.params.claimConditionIndex
  entity.tokenId = event.params.tokenId
  entity.claimer = event.params.claimer
  entity.receiver = event.params.receiver
  entity.quantityClaimed = event.params.quantityClaimed
  entity.save()
}

export function handleTokensLazyMinted(event: TokensLazyMintedEvent): void {
  let entity = new TokensLazyMinted(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.startTokenId = event.params.startTokenId
  entity.endTokenId = event.params.endTokenId
  entity.baseURI = event.params.baseURI
  entity.save()
}

export function handleTransferBatch(event: TransferBatchEvent): void {
  let entity = new TransferBatch(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.operator = event.params.operator
  entity.from = event.params.from
  entity.to = event.params.to
  entity.ids = event.params.ids
  entity.values = event.params.values
  entity.save()
}

export function handleTransferSingle(event: TransferSingleEvent): void {
  let entity = new TransferSingle(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.operator = event.params.operator
  entity.from = event.params.from
  entity.to = event.params.to
  entity.id = event.params.id
  entity.value = event.params.value
  entity.save()
}

export function handleURI(event: URIEvent): void {
  let entity = new URI(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.value = event.params.value
  entity.id = event.params.id
  entity.save()
}

export function handleWalletClaimCountUpdated(
  event: WalletClaimCountUpdatedEvent
): void {
  let entity = new WalletClaimCountUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.tokenId = event.params.tokenId
  entity.wallet = event.params.wallet
  entity.count = event.params.count
  entity.save()
}
