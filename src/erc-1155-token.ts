import {
  InitializeCall,
  ERC1155TokenTokensMinted as ERC1155TokenTokensMintedEvent,
  ERC1155TokenTokensMintedWithSignature as ERC1155TokenTokensMintedWithSignatureEvent,
  ERC1155TokenTransferBatch as ERC1155TokenTransferBatchEvent,
  ERC1155TokenTransferSingle as ERC1155TokenTransferSingleEvent,
} from "../generated/templates/ERC1155Token/ERC1155Token"
import {
  Token,
  Collection
} from "../generated/schema"

export function handleERC1155TokenInitialized(
  call: InitializeCall
): void {
}


export function handleERC1155TokenTokensMinted(
  event: ERC1155TokenTokensMintedEvent
): void {
}

export function handleERC1155TokenTokensMintedWithSignature(
  event: ERC1155TokenTokensMintedWithSignatureEvent
): void {
}

export function handleERC1155TokenTransferBatch(
  event: ERC1155TokenTransferBatchEvent
): void {
  
}

export function handleERC1155TokenTransferSingle(
  event: ERC1155TokenTransferSingleEvent
): void {
  
}
