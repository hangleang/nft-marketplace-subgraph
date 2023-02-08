import { ProxyDeployed as ProxyDeployedEvent } from "../generated/ContractFactory/ContractFactory"
import { NFTs } from "../generated/templates"
import { createOrLoadCollection } from "./modules/collection"

export function handleProxyDeployed(event: ProxyDeployedEvent): void {
  // address of the new collection contract
  NFTs.create(event.params.proxy);

  // create collection entity
  createOrLoadCollection(event.params.proxy, event.block.timestamp)
}