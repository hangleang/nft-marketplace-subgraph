import {
  ImplementationAdded as ImplementationAddedEvent,
  ImplementationApproved as ImplementationApprovedEvent,
  ProxyDeployed as ProxyDeployedEvent,
  ContractFactoryRoleAdminChanged as ContractFactoryRoleAdminChangedEvent,
  ContractFactoryRoleGranted as ContractFactoryRoleGrantedEvent,
  ContractFactoryRoleRevoked as ContractFactoryRoleRevokedEvent
} from "../generated/ContractFactory/ContractFactory"
import {
  ImplementationAdded,
  ImplementationApproved,
  ProxyDeployed,
  ContractFactoryRoleAdminChanged,
  ContractFactoryRoleGranted,
  ContractFactoryRoleRevoked
} from "../generated/schema"

export function handleImplementationAdded(
  event: ImplementationAddedEvent
): void {
  let entity = new ImplementationAdded(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.implementation = event.params.implementation
  entity.contractType = event.params.contractType
  entity.version = event.params.version
  entity.save()
}

export function handleImplementationApproved(
  event: ImplementationApprovedEvent
): void {
  let entity = new ImplementationApproved(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.implementation = event.params.implementation
  entity.isApproved = event.params.isApproved
  entity.save()
}

export function handleProxyDeployed(event: ProxyDeployedEvent): void {
  let entity = new ProxyDeployed(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.implementation = event.params.implementation
  entity.proxy = event.params.proxy
  entity.deployer = event.params.deployer
  entity.save()
}

export function handleContractFactoryRoleAdminChanged(
  event: ContractFactoryRoleAdminChangedEvent
): void {
  let entity = new ContractFactoryRoleAdminChanged(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.role = event.params.role
  entity.previousAdminRole = event.params.previousAdminRole
  entity.newAdminRole = event.params.newAdminRole
  entity.save()
}

export function handleContractFactoryRoleGranted(
  event: ContractFactoryRoleGrantedEvent
): void {
  let entity = new ContractFactoryRoleGranted(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender
  entity.save()
}

export function handleContractFactoryRoleRevoked(
  event: ContractFactoryRoleRevokedEvent
): void {
  let entity = new ContractFactoryRoleRevoked(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  )
  entity.role = event.params.role
  entity.account = event.params.account
  entity.sender = event.params.sender
  entity.save()
}
