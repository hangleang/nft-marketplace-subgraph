import {
  InitializeCall,
  NFTRevealed as NFTRevealedEvent,
  ERC721DropTokensClaimed as ERC721DropTokensClaimedEvent,
  ERC721DropTokensLazyMinted as ERC721DropTokensLazyMintedEvent,
  ERC721DropTransfer as ERC721DropTransferEvent,
} from "../generated/templates/ERC721Drop/ERC721Drop"
import {
  Token, Collection
} from "../generated/schema"

export function handleERC721DropInitialized(
  call: InitializeCall
): void {
}

export function handleNFTRevealed(event: NFTRevealedEvent): void {

}

export function handleERC721DropTokensClaimed(
  event: ERC721DropTokensClaimedEvent
): void {
}

export function handleERC721DropTokensLazyMinted(
  event: ERC721DropTokensLazyMintedEvent
): void {
}

export function handleERC721DropTransfer(event: ERC721DropTransferEvent): void {

}