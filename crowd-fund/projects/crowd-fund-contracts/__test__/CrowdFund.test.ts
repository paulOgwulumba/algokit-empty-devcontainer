import { describe, test, expect, beforeAll, beforeEach } from '@jest/globals';
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing';
import * as algokit from '@algorandfoundation/algokit-utils';
import { CrowdFundClient } from '../contracts/clients/CrowdFundClient';
import algosdk, { makePaymentTxnWithSuggestedParamsFromObject } from 'algosdk';

const fixture = algorandFixture();
algokit.Config.configure({ populateAppCallResources: true });

let appClient: CrowdFundClient;
let algod: algosdk.Algodv2;
let beneficiary: algosdk.Account;
let creator: algosdk.Account;
let secondFunder: algosdk.Account;

describe('CrowdFund', () => {
  beforeEach(fixture.beforeEach);

  beforeAll(async () => {
    await fixture.beforeEach();
    const { testAccount } = fixture.context;
    const { algorand } = fixture;

    algod = algorand.client.algod;
    beneficiary = await algokit.getOrCreateKmdWalletAccount(
      {
        name: 'beneficiary',
        fundWith: algokit.algos(0),
      }, 
      algod, 
      algorand.client.kmd
    );

    creator = testAccount;

    secondFunder = await algokit.getOrCreateKmdWalletAccount(
      {
        name: 'second-funder',
        fundWith: algokit.algos(100),
      }, 
      algod, 
      algorand.client.kmd
    );

    appClient = new CrowdFundClient(
      {
        sender: testAccount,
        resolveBy: 'id',
        id: 0,
      },
      algorand.client.algod
    );

    await appClient.create.createApplication({
      beneficiary: beneficiary.addr,
      targetAmount: algokit.algos(10).microAlgos,
    });

    appClient.appClient.fundAppAccount({ amount: algokit.microAlgos(100_000) });
  });

  test('target amount', async () => {
    const globalState = await appClient.appClient.getGlobalState();
    const targetAmount = globalState.targetAmount.value;

    expect(targetAmount).toEqual(algokit.algos(10).microAlgos);
  });

  test('fund and premature delete', async () => {
    const suggestedParams = await algokit.getTransactionParams(undefined, algod);
    const appAddress = (await appClient.appClient.getAppReference()).appAddress;

    const paymentTxn = makePaymentTxnWithSuggestedParamsFromObject({
      from: secondFunder.addr,
      to: appAddress,
      amount: algokit.algos(5).microAlgos,
      suggestedParams,
    });

    const signedTxn = paymentTxn.signTxn(secondFunder.sk);
    await algod.sendRawTransaction(signedTxn).do();

    await expect(
      appClient.delete.deleteApplication({}, { sendParams: { fee: algokit.microAlgos(2_000) } })
    ).rejects.toThrow();
  });

  test('fund and non-creator delete', async () => {
    const suggestedParams = await algokit.getTransactionParams(undefined, algod);
    const appAddress = (await appClient.appClient.getAppReference()).appAddress;

    const paymentTxn = makePaymentTxnWithSuggestedParamsFromObject({
      from: creator.addr,
      to: appAddress,
      amount: algokit.algos(5).microAlgos,
      suggestedParams,
    });

    const signedTxn = paymentTxn.signTxn(creator.sk);
    await algod.sendRawTransaction(signedTxn).do();

    await expect(
      appClient.delete.deleteApplication({}, { sender: secondFunder, sendParams: { fee: algokit.microAlgos(2_000) } })
    ).rejects.toThrow();
  });

  test('delete and beneficiary credited', async () => {
    const beneficiaryBalanceBeforeDelete = (await algod.accountInformation(beneficiary.addr).do()).amount;

    await appClient.delete.deleteApplication({}, { sendParams: { fee: algokit.microAlgos(2_000) } });

    const beneficiaryBalanceAfterDelete = (await algod.accountInformation(beneficiary.addr).do()).amount;

    expect(beneficiaryBalanceAfterDelete).toBeGreaterThan(beneficiaryBalanceBeforeDelete);
  });
});
