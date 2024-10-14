import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell, TupleItemSlice } from "@ton/core";
import { encodeOffChainContent } from "../libs/cells";
import { ITEM_OP_GET_STATIC_DATA, ITEM_OP_UPDATE_CONTENT, ITEM_OP_SWITCH_UPDATE_CONTENT } from "./opcodes";
export default class BadgeItem implements Contract {

  static initData(
    ownerAddress: Address,
    content: Cell,
    badgeItemCode: Cell,
    numerator: number,
    denominator: number,
    destination: Address,
  ): Cell {

    const royalty = beginCell()
      .storeUint(numerator, 16)
      .storeUint(denominator, 16)
      .storeAddress(destination)
      .endCell()
    
    return beginCell()
      .storeAddress(ownerAddress)
      .storeUint(1, 64)
      .storeRef(content)
      .storeRef(badgeItemCode)
      .storeRef(royalty)
      .endCell()
  }

  static createForDeploy(code: Cell, data: Cell): BadgeItem {
    const workchain = 0; // deploy to workchain 0
    const address = contractAddress(workchain, { code, data });
    return new BadgeItem(address, { code, data });
  }

  constructor(readonly address: Address, readonly init?: { code: Cell, data: Cell }) {}

  async sendDeploy(provider: ContractProvider, via: Sender) {
    await provider.internal(via, {
      value: "0.1", // send TON to contract for rent
      bounce: false
    });
  }

  async sendValue(provider: ContractProvider, via: Sender, value: string) {
    await provider.internal(via, {
      value, // send TON to contract for rent
    });
  }

  async sendSwitchUpdateContent(provider: ContractProvider, via: Sender, enable: boolean, responseAddress: Address, value: string) {
    const messageBody = beginCell()
      .storeUint(ITEM_OP_SWITCH_UPDATE_CONTENT, 32) // op 
      .storeUint(0, 64) // query id
      .storeUint(BigInt(enable), 1)
      .storeAddress(responseAddress)
      .endCell();
    await provider.internal(via, {
      value,
      body: messageBody
    });
  }
  
  async sendUpdateContent(provider: ContractProvider, via: Sender, content: Cell, responseAddress: Address, value: string) {
    const messageBody = beginCell()
      .storeUint(ITEM_OP_UPDATE_CONTENT, 32) // op 
      .storeUint(0, 64) // query id
      .storeRef(content)
      .storeAddress(responseAddress)
      .endCell();
    await provider.internal(via, {
      value,
      body: messageBody
    });
  }

  async sendGetStaticData(provider: ContractProvider, via: Sender, value: string) {
    const messageBody = beginCell()
      .storeUint(ITEM_OP_GET_STATIC_DATA, 32) // op 
      .storeUint(0, 64) // query id
      .endCell();
    await provider.internal(via, {
      value,
      body: messageBody
    });
  }

  async getBadgeData(provider: ContractProvider) {
    const { stack } = await provider.get("get_badge_data", []);
    const init = stack.readBigNumber();
    const index = stack.readBigNumber();
    const collectionAddress = stack.readAddress();
    const ownerAddress = stack.readCell();
    const enableUpdateContent = stack.readBigNumber();
    const content = stack.readCell();
    return {
        init,
        index,
        collectionAddress,
        ownerAddress,
        enableUpdateContent,
        content
    };
  }

}