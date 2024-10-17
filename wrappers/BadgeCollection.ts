import { Contract, ContractProvider, Sender, Address, Cell, contractAddress, beginCell, TupleItemSlice, TupleItemInt, TupleItemCell } from "@ton/core";
import { encodeOffChainContent } from "../libs/cells";
import { COLLECITON_OP_GET_ROYALTY_PARAMS, COLLECTION_OP_MINT, COLLECTION_OP_SWITCH_ITEM_UPDATE_CONTENT, COLLECTION_OP_UPDATE_CONTENT, COLLECTION_OP_UPDATE_ITEM_CONTENT, COLLECTION_OP_UPDATE_OWNER, COLLECTION_OP_UPDATE_ROYALTY } from "./opcodes";
export default class BadgeCollection implements Contract {

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

  static createForDeploy(code: Cell, data: Cell): BadgeCollection {
    const workchain = 0; // deploy to workchain 0
    const address = contractAddress(workchain, { code, data });
    return new BadgeCollection(address, { code, data });
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

  async sendMint(provider: ContractProvider, via: Sender, badgeContent: Cell, value: string) {
    const messageBody = beginCell()
      .storeUint(COLLECTION_OP_MINT, 32) // op 
      .storeUint(0, 64) // query id
      .storeRef(badgeContent)
      .endCell();
    await provider.internal(via, {
      value,
      body: messageBody
    });
  }

  async sendUpdateContent(provider: ContractProvider, via: Sender, content: Cell, value: string) {
    const messageBody = beginCell()
      .storeUint(COLLECTION_OP_UPDATE_CONTENT, 32) // op 
      .storeUint(0, 64) // query id
      .storeRef(content)
      .endCell();
    await provider.internal(via, {
      value,
      body: messageBody
    });
  }

  async sendUpdateOwner(provider: ContractProvider, via: Sender, newOwner: Address, value: string) {
    const messageBody = beginCell()
      .storeUint(COLLECTION_OP_UPDATE_OWNER, 32) // op 
      .storeUint(0, 64) // query id
      .storeAddress(newOwner)
      .endCell();
    await provider.internal(via, {
      value,
      body: messageBody
    });
  }

  async sendUpdateRoyalty(provider: ContractProvider, via: Sender, numerator: number, denominator: number, destination: Address, value: string) {
    const messageBody = beginCell()
      .storeUint(COLLECTION_OP_UPDATE_ROYALTY, 32) // op 
      .storeUint(0, 64) // query id
      .storeUint(numerator, 16)
      .storeUint(denominator, 16)
      .storeAddress(destination)
      .endCell();
    await provider.internal(via, {
      value,
      body: messageBody
    });
  }

  async sendUpdateItemContent(provider: ContractProvider, via: Sender, itemAddress: Address, content: Cell, responseAddress: Address, value: string) {
    const messageBody = beginCell()
      .storeUint(COLLECTION_OP_UPDATE_ITEM_CONTENT, 32) // op 
      .storeUint(0, 64) // query id
      .storeAddress(itemAddress)
      .storeRef(content)
      .storeAddress(responseAddress)
      .endCell();
    await provider.internal(via, {
      value,
      body: messageBody
    });
  }

  async sendSwitchItemUpdateContent(provider: ContractProvider, via: Sender, itemAddress: Address, enable: boolean, responseAddress: Address, value: string) {
    const messageBody = beginCell()
      .storeUint(COLLECTION_OP_SWITCH_ITEM_UPDATE_CONTENT, 32) // op 
      .storeUint(0, 64) // query id
      .storeUint(BigInt(enable), 1)
      .storeAddress(itemAddress)
      .storeAddress(responseAddress)
      .endCell();
    await provider.internal(via, {
      value,
      body: messageBody
    });
  }

  async sendGetRoyaltyParams(provider: ContractProvider, via: Sender, value: string) {
    const messageBody = beginCell()
      .storeUint(COLLECITON_OP_GET_ROYALTY_PARAMS, 32) // op 
      .storeUint(0, 64) // query id
      .endCell();
    await provider.internal(via, {
      value,
      body: messageBody
    });
  }

  async getAllData(provider: ContractProvider) {
    const { stack } = await provider.get("get_all_data", []);
    const ownerAddress = stack.readAddress();
    const nextItemIndex = stack.readBigNumber();
    const content = stack.readCell();
    const badgeItemCode = stack.readCell();
    const royalty = stack.readCell();
    return {
        ownerAddress,
        nextItemIndex,
        content,
        badgeItemCode,
        royalty
    };
  }

  async getCollectionData(provider: ContractProvider) {
    const { stack } = await provider.get("get_collection_data", []);
    const nextItemIndex = stack.readBigNumber();
    const content = stack.readCell();
    const ownerAddress = stack.readAddress();
    return {
        nextItemIndex,
        content,
        ownerAddress,
    };
  }

  async getRoyaltyParams(provider: ContractProvider) {
    const { stack } = await provider.get("royalty_params", []);
    const numerator = stack.readBigNumber();
    const denominator = stack.readBigNumber();
    const destination = stack.readAddress();
    return {
      numerator,
      denominator,
      destination
    };
  }

  async getBadgeContent(provider: ContractProvider, itemIdx: bigint, individualBadgeContent: Cell) {
    const { stack } = await provider.get("get_badge_content", [
      {
        type: 'int',
        value: itemIdx
      } as TupleItemInt,
      {
        type: 'cell',
        cell: individualBadgeContent
      } as TupleItemCell,
    ]);
    const cell = stack.readCell();
    return cell;
  }

  async getBadgeAddressByUser(provider: ContractProvider, userAddress: Address) {
    const { stack } = await provider.get("get_badge_address_by_user_address", [
        {
          type: 'slice',
          cell: 
              beginCell()
                  .storeAddress(userAddress)
              .endCell()
      } as TupleItemSlice
    ]);
    return stack.readAddress();
  }

}