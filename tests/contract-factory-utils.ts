import { newMockEvent } from "matchstick-as"
import { ethereum, Address, Bytes, BigInt } from "@graphprotocol/graph-ts"
import {
  ImplementationAdded,
  ImplementationApproved,
  ProxyDeployed,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked
} from "../generated/ContractFactory/ContractFactory"

export function createImplementationAddedEvent(
  implementation: Address,
  contractType: Bytes,
  version: BigInt
): ImplementationAdded {
  let implementationAddedEvent = changetype<ImplementationAdded>(newMockEvent())

  implementationAddedEvent.parameters = new Array()

  implementationAddedEvent.parameters.push(
    new ethereum.EventParam(
      "implementation",
      ethereum.Value.fromAddress(implementation)
    )
  )
  implementationAddedEvent.parameters.push(
    new ethereum.EventParam(
      "contractType",
      ethereum.Value.fromFixedBytes(contractType)
    )
  )
  implementationAddedEvent.parameters.push(
    new ethereum.EventParam(
      "version",
      ethereum.Value.fromUnsignedBigInt(version)
    )
  )

  return implementationAddedEvent
}

export function createImplementationApprovedEvent(
  implementation: Address,
  isApproved: boolean
): ImplementationApproved {
  let implementationApprovedEvent = changetype<ImplementationApproved>(
    newMockEvent()
  )

  implementationApprovedEvent.parameters = new Array()

  implementationApprovedEvent.parameters.push(
    new ethereum.EventParam(
      "implementation",
      ethereum.Value.fromAddress(implementation)
    )
  )
  implementationApprovedEvent.parameters.push(
    new ethereum.EventParam(
      "isApproved",
      ethereum.Value.fromBoolean(isApproved)
    )
  )

  return implementationApprovedEvent
}

export function createProxyDeployedEvent(
  contractType: Bytes,
  data: Bytes,
  proxy: Address,
  deployer: Address
): ProxyDeployed {
  let proxyDeployedEvent = changetype<ProxyDeployed>(newMockEvent())

  proxyDeployedEvent.parameters = new Array()

  proxyDeployedEvent.parameters.push(
    new ethereum.EventParam(
      "contractType",
      ethereum.Value.fromFixedBytes(contractType)
    )
  )
  proxyDeployedEvent.parameters.push(
    new ethereum.EventParam("data", ethereum.Value.fromBytes(data))
  )
  proxyDeployedEvent.parameters.push(
    new ethereum.EventParam("proxy", ethereum.Value.fromAddress(proxy))
  )
  proxyDeployedEvent.parameters.push(
    new ethereum.EventParam("deployer", ethereum.Value.fromAddress(deployer))
  )

  return proxyDeployedEvent
}

export function createRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): RoleAdminChanged {
  let roleAdminChangedEvent = changetype<RoleAdminChanged>(newMockEvent())

  roleAdminChangedEvent.parameters = new Array()

  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  )

  return roleAdminChangedEvent
}

export function createRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleGranted {
  let roleGrantedEvent = changetype<RoleGranted>(newMockEvent())

  roleGrantedEvent.parameters = new Array()

  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleGrantedEvent
}

export function createRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleRevoked {
  let roleRevokedEvent = changetype<RoleRevoked>(newMockEvent())

  roleRevokedEvent.parameters = new Array()

  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleRevokedEvent
}
