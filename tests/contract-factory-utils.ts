import { newMockEvent } from "matchstick-as"
import { ethereum, Address, Bytes, BigInt } from "@graphprotocol/graph-ts"
import {
  ImplementationAdded,
  ImplementationApproved,
  ProxyDeployed,
  ContractFactoryRoleAdminChanged,
  ContractFactoryRoleGranted,
  ContractFactoryRoleRevoked
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
  implementation: Address,
  proxy: Address,
  deployer: Address
): ProxyDeployed {
  let proxyDeployedEvent = changetype<ProxyDeployed>(newMockEvent())

  proxyDeployedEvent.parameters = new Array()

  proxyDeployedEvent.parameters.push(
    new ethereum.EventParam(
      "implementation",
      ethereum.Value.fromAddress(implementation)
    )
  )
  proxyDeployedEvent.parameters.push(
    new ethereum.EventParam("proxy", ethereum.Value.fromAddress(proxy))
  )
  proxyDeployedEvent.parameters.push(
    new ethereum.EventParam("deployer", ethereum.Value.fromAddress(deployer))
  )

  return proxyDeployedEvent
}

export function createContractFactoryRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): ContractFactoryRoleAdminChanged {
  let contractFactoryRoleAdminChangedEvent = changetype<
    ContractFactoryRoleAdminChanged
  >(newMockEvent())

  contractFactoryRoleAdminChangedEvent.parameters = new Array()

  contractFactoryRoleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  contractFactoryRoleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  )
  contractFactoryRoleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  )

  return contractFactoryRoleAdminChangedEvent
}

export function createContractFactoryRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): ContractFactoryRoleGranted {
  let contractFactoryRoleGrantedEvent = changetype<ContractFactoryRoleGranted>(
    newMockEvent()
  )

  contractFactoryRoleGrantedEvent.parameters = new Array()

  contractFactoryRoleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  contractFactoryRoleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  contractFactoryRoleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return contractFactoryRoleGrantedEvent
}

export function createContractFactoryRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): ContractFactoryRoleRevoked {
  let contractFactoryRoleRevokedEvent = changetype<ContractFactoryRoleRevoked>(
    newMockEvent()
  )

  contractFactoryRoleRevokedEvent.parameters = new Array()

  contractFactoryRoleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  contractFactoryRoleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  contractFactoryRoleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return contractFactoryRoleRevokedEvent
}
