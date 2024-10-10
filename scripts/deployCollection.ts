
import * as fs from "fs";
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient, Cell, WalletContractV4 } from "@ton/ton";
import NFTCollection from "../wrappers/NFTCollection";
import { loadIni } from "../libs/config";

export async function run() {
  // open wallet v4 (notice the correct wallet version here)
  const config = loadIni("config.ini")
  // initialize ton rpc client on testnet
  const network = config.network;
  const endpoint = await getHttpEndpoint({ network });
  const client = new TonClient({ endpoint });

  const mnemonic = config.words;
  const key = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });

  // prepare minter's initial code and data cells for deployment
  const collectionCode = Cell.fromBoc(fs.readFileSync("build/nft-collection.cell"))[0];
  const itemCode = Cell.fromBoc(fs.readFileSync("build/nft-item.cell"))[0];
  
  const nftCollection = NFTCollection.createForDeploy(
    collectionCode,
    NFTCollection.initData(
        wallet.address,
        "utonic nft collection",
        itemCode,
        1,
        1000,
        wallet.address
    )
  );

  // exit if contract is already deployed
  console.log("contract address:", nftCollection.address.toString());
  if (await client.isContractDeployed(nftCollection.address)) {
    return console.log("contract already deployed");
  }

  // open wallet and read the current seqno of the wallet
  const walletContract = client.open(wallet);
  const walletSender = walletContract.sender(key.secretKey);
  const seqno = await walletContract.getSeqno();

  // send the deploy transaction
  const nftCollectionContract = client.open(nftCollection);
  await nftCollectionContract.sendDeploy(walletSender);

  // wait until confirmed
  let currentSeqno = seqno;
  while (currentSeqno == seqno) {
    console.log("waiting for deploy transaction to confirm...");
    await sleep(1500);
    currentSeqno = await walletContract.getSeqno();
  }
  console.log("deploy transaction confirmed!");
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
