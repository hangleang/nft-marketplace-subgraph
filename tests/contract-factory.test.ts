import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { Address, Bytes, BigInt } from "@graphprotocol/graph-ts"
import { ImplementationAdded } from "../generated/schema"
import { ImplementationAdded as ImplementationAddedEvent } from "../generated/ContractFactory/ContractFactory"
import { handleImplementationAdded } from "../src/contract-factory"
import { createImplementationAddedEvent } from "./contract-factory-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let implementation = Address.fromString(
      "0x0000000000000000000000000000000000000001"
    )
    let contractType = Bytes.fromI32(1234567890)
    let version = BigInt.fromI32(234)
    let newImplementationAddedEvent = createImplementationAddedEvent(
      implementation,
      contractType,
      version
    )
    handleImplementationAdded(newImplementationAddedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("ImplementationAdded created and stored", () => {
    assert.entityCount("ImplementationAdded", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "ImplementationAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "implementation",
      "0x0000000000000000000000000000000000000001"
    )
    assert.fieldEquals(
      "ImplementationAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "contractType",
      "1234567890"
    )
    assert.fieldEquals(
      "ImplementationAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "version",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
