import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import algokit, { Config, getOrCreateKmdWalletAccount } from '@algorandfoundation/algokit-utils';
import { BlockTrempNftClient, BlockTrempNftFactory } from '../contracts/clients/BlockTrempNFTClient';
import algosdk, { makeBasicAccountTransactionSigner, makePaymentTxnWithSuggestedParamsFromObject } from 'algosdk';

const fixture = algorandFixture();
Config.configure({ populateAppCallResources: true });

let appClient: BlockTrempNftClient;
let firstBuyer: algosdk.Account;
let secondBuyer: algosdk.Account;

const HASH_1 = 'bafkreidiktfznu222xfia5z2ssrwa4ba5wz6emv47vfexwvnflc6zbikgm';
const HASH_2 = 'bufkreidiktfznu222xfia5z2ssrwa4ba5wz6emv47vfexwvnflc6zbikgm';
const mbrCost = 153_700;

describe('BlockTrempNFT', () => {
  beforeEach(fixture.beforeEach);

  beforeAll(async () => {
    await fixture.beforeEach();
    const { testAccount } = fixture.context;
    const { algorand } = fixture;

    const factory = new BlockTrempNftFactory({
      algorand,
      defaultSender: testAccount.addr,
    });

    firstBuyer = await getOrCreateKmdWalletAccount({
      name: 'first buyer' + Math.floor(Math.random() * 10),
      fundWith: algokit.algos(1000),
    }, algorand.client.algod, algorand.client.kmd);

    secondBuyer = await algokit.getOrCreateKmdWalletAccount({
      name: 'second buyer' + Math.floor(Math.random() * 10),
      fundWith: algokit.algos(1000),
    }, algorand.client.algod, algorand.client.kmd);

    const createResult = await factory.send.create.createApplication();
    appClient = createResult.appClient;
    await appClient.appClient.fundAppAccount({ amount: algokit.microAlgos(100_000) });
  });

  test('first upload', async () => {
    const { appAddress } = appClient.appClient;
    const suggestedParams = await algokit.getTransactionParams(undefined, fixture.algorand.client.algod);

    const paymentTxn = makePaymentTxnWithSuggestedParamsFromObject({
      from: firstBuyer.addr,
      to: appAddress,
      amount: mbrCost,
      suggestedParams,
    });

    const response = await appClient.send.createCertificate({
      args: {
        mbrPayment: {
          txn: paymentTxn,
          signer: makeBasicAccountTransactionSigner(firstBuyer),
        },
        ipfsHash: HASH_1,
      },
      extraFee: algokit.microAlgos(1_000),
      sender: firstBuyer.addr,
      signer: makeBasicAccountTransactionSigner(firstBuyer),
    });

    console.debug('Asset ID', response.return)
    expect(response.return).toBeDefined();

    await fixture.algorand.send.assetOptIn({ 
      sender: firstBuyer.addr, 
      signer: makeBasicAccountTransactionSigner(firstBuyer), 
      assetId: response.return!,
    });

    const balance = (
      await fixture.algorand.client.algod.accountAssetInformation(appClient.appClient.appAddress, Number(response.return!)).do()
    )['asset-holding'].amount;

    console.debug('balance', balance);
    expect(balance).toEqual(1);

  });

  test('claim', async () => {
    const data = await appClient.appClient.getBoxValueFromABIType(HASH_1, algosdk.ABIType.from('(uint64,address)')) as [bigint, string];
    const [assetId, address] = data;
    
    expect(address).toEqual(firstBuyer.addr);

    await appClient.send.claimCertificate({
      args: {
        ipfsHash: HASH_1,
      },
      boxReferences: [
        {
          appId: appClient.appId,
          name: HASH_1,
        }
      ],
      assetReferences: [assetId],
      extraFee: algokit.microAlgos(1_000),
    });
  });

  test('first upload again', async () => {
    const { appAddress } = appClient.appClient;
    const suggestedParams = await algokit.getTransactionParams(undefined, fixture.algorand.client.algod);

    const paymentTxn = makePaymentTxnWithSuggestedParamsFromObject({
      from: secondBuyer.addr,
      to: appAddress,
      amount: mbrCost,
      suggestedParams,
    });

    const response = await appClient.send.createCertificate({
      args: {
        mbrPayment: {
          txn: paymentTxn,
          signer: makeBasicAccountTransactionSigner(secondBuyer),
        },
        ipfsHash: HASH_2,
      },
      extraFee: algokit.microAlgos(1_000),
      sender: secondBuyer.addr,
      signer: makeBasicAccountTransactionSigner(secondBuyer),
    });

    console.debug('Asset ID', response.return)
    expect(response.return).toBeDefined();

    await fixture.algorand.send.assetOptIn({ 
      sender: secondBuyer.addr, 
      signer: makeBasicAccountTransactionSigner(secondBuyer), 
      assetId: response.return!,
    });

    const balance = (
      await fixture.algorand.client.algod.accountAssetInformation(appClient.appClient.appAddress, Number(response.return!)).do()
    )['asset-holding'].amount;

    console.debug('balance', balance);
    expect(balance).toEqual(1);

  });
});
