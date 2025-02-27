import { getHttpEndpoint } from "@orbs-network/ton-access";
import { mnemonicToWalletKey } from "ton-crypto";
import { TonClient, WalletContractV4, Address } from "@ton/ton";
import BadgeCollection from "../wrappers/BadgeCollection"; // this is the interface class we just implemented
import { loadIni } from "../libs/config";
import { encodeOffChainContent } from "../libs/cells";
import BadgeItem from "../wrappers/BadgeItem";

export async function run() {
  const config = loadIni("config.ini");
  // initialize ton rpc client on testnet
  const endpoint = await getHttpEndpoint({ network: config.network });
  const client = new TonClient({ endpoint });

  // open wallet v4 (notice the correct wallet version here)
  const mnemonic = config.words;
  const key = await mnemonicToWalletKey(mnemonic.split(" "));
  const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
//   if (!await client.isContractDeployed(wallet.address)) {
//     return console.log("wallet is not deployed");
//   }

  // open wallet and read the current seqno of the wallet
  const walletContract = client.open(wallet);
  const walletSender = walletContract.sender(key.secretKey);
  const seqno = await walletContract.getSeqno();

  // open Counter instance by address
  const badgeCollectionAddressStr = config.badge_collection;
  const badgeCollectionAddress = Address.parse(badgeCollectionAddressStr); // replace with your address from step 8
  const badgeCollection = new BadgeCollection(badgeCollectionAddress);
  const badgeCollectionContract = client.open(badgeCollection);
  
  const userAddress = Address.parse(config.user_address)
  const badgeItemAddress = await badgeCollectionContract.getBadgeAddressByUser(userAddress)

  console.log('badge item address: ', badgeItemAddress.toString())

  const badgeItemContent = config.badge_item_content;
  const badgeContentCell = encodeOffChainContent(badgeItemContent);

  await badgeCollectionContract.sendUpdateItemContent(walletSender, badgeItemAddress, badgeContentCell, wallet.address, "0.02");

  // wait until confirmed
  let currentSeqno = seqno;
  while (currentSeqno == seqno) {
    console.log("waiting for transaction to confirm...");
    await sleep(1500);
    currentSeqno = await walletContract.getSeqno();
  }
  console.log("transaction confirmed!");
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
