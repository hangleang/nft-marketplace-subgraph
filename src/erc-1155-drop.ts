import {
  InitializeCall,
  TokensClaimed as TokensClaimedEvent,
  TokensLazyMinted as TokensLazyMintedEvent,
  TransferBatch as TransferBatchEvent,
  TransferSingle as TransferSingleEvent,
} from "../generated/templates/ERC1155Drop/ERC1155Drop"
import {
  Token,
  Collection
} from "../generated/schema"

export function handleERC1155DropInitialized(
  call: InitializeCall
): void {
}

export function handleTokensClaimed(event: TokensClaimedEvent): void {

}

export function handleTokensLazyMinted(event: TokensLazyMintedEvent): void {

}

export function handleTransferBatch(event: TransferBatchEvent): void {

}

export function handleTransferSingle(event: TransferSingleEvent): void {

}
