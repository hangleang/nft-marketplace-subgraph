import { ProxyDeployed as ProxyDeployedEvent } from "../generated/ContractFactory/ContractFactory"
import { createOrLoadCollection } from "./modules/collection"

export function handleProxyDeployed(event: ProxyDeployedEvent): void {
  const collectionAddress = event.params.proxy

  createOrLoadCollection(collectionAddress, event.block.timestamp)
}