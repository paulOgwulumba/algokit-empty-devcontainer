import { Config } from '@algorandfoundation/algokit-utils'
import { registerDebugEventHandlers } from '@algorandfoundation/algokit-utils-debug'
import { algorandFixture } from '@algorandfoundation/algokit-utils/testing'
import algosdk, { ABIType, Address } from 'algosdk'
import { beforeAll, beforeEach, describe, expect, test } from 'vitest'
import { AgroblocFactory } from '../artifacts/agrobloc/AgroblocClient'
import { AlgoAmount } from '@algorandfoundation/algokit-utils/types/amount'

describe('Agrobloc contract', () => {
  const localnet = algorandFixture()
  beforeAll(() => {
    Config.configure({
      debug: true,
      // traceAll: true,
    })
    registerDebugEventHandlers()
  })
  beforeEach(localnet.newScope)

  const deploy = async (account: Address) => {
    const factory = localnet.algorand.client.getTypedAppFactory(AgroblocFactory, {
      defaultSender: account,
    })

    // const { appClient } = await factory.deploy({
    //   onUpdate: 'append',
    //   onSchemaBreak: 'append',
    // })
    const { appClient } = await factory.send.create.createApplication({
      args: {}
    });

    const dispenser = await appClient.algorand.account.localNetDispenser();

    localnet.algorand.send.payment({
      sender: dispenser.addr,
      receiver: appClient.appAddress,
      amount: new AlgoAmount({ algos: 20}),
    })

    return { client: appClient }
  }

  test('says hello', async () => {
    const { testAccount } = localnet.context
    const { client } = await deploy(testAccount)

    const dispenser = await client.algorand.account.localNetDispenser();

    // const result = await cli({ args: { name: 'World' } })
    

    // expect(result.return).toBe('Hello, World')
    const result = await client.send.tokenize({ 
      args: { title: 'Ougadougou' }, 
      extraFee: new AlgoAmount({ microAlgos: 1000 }) 
    });

    const createdAsset = result.return;

    expect(createdAsset).toBeDefined();

    console.debug(createdAsset);

    const newResult = await client.send.listProperty({ 
      args: { 
        title: "Ougadougou", 
        asset: createdAsset!, 
        value: 10_000_000,
        latLong: '124 lat, 123 long',
        address: 'Over there',
      } 
    });

    const newResult2 = await client.send.tokenize({ 
      args: { title: 'Odogwu' }, 
      extraFee: new AlgoAmount({ microAlgos: 1000 }) 
    });

    const createdAsset2 = newResult2.return;

    expect(createdAsset2).toBeDefined();

    console.debug(createdAsset2);

    const paymentTxn = await client.algorand.createTransaction.payment({
      amount: (4).algo(),
      receiver: client.appAddress,
      sender: dispenser,
      signer: dispenser,
    });

    await client.send.createInvestment({ 
      args: { 
        paymentTxn: { txn: paymentTxn, signer: dispenser.signer }, 
        asset: createdAsset2!, 
        apy: 25,
        maturityDuration: 0,
        ownerTitle: 'Wonderfu'
      },
      sender: dispenser,
      signer: dispenser,
    });

    const boxes2 = await client.appClient.getBoxValuesFromABIType(
      // algosdk.ABIType.from('(string,uint64,uint64,address,string,string,uint64)'),
      algosdk.ABIType.from('(uint64,uint64,uint64,address,string,address,uint64,uint64,uint64,uint64,uint64)'),
      (name) => {
        const rawName = name.name;
        return rawName.startsWith('investment-');
      }
    );
    console.debug(boxes2);

    await client.send.claimInvestment({
      args: {
        collateral: createdAsset!,
        investment: createdAsset2!,
      },
      extraFee: new AlgoAmount({ microAlgos: 1000 }) 
    });

    const paymentTxn2 = await client.algorand.createTransaction.payment({
      amount: (1).algo(),
      receiver: client.appAddress,
      sender: testAccount,
      signer: testAccount,
    });

    await client.send.repayInvestment({ 
      args: { 
        payment: { txn: paymentTxn2, signer: testAccount.signer }, 
        investment: createdAsset2!,
      },
      extraFee: new AlgoAmount({ microAlgos: 1000 }) 
    });

    // const paymentTxn3 = await client.algorand.createTransaction.payment({
    //   amount: (3).algo(),
    //   receiver: client.appAddress,
    //   sender: testAccount,
    //   signer: testAccount,
    // });

    // await client.send.repayInvestment({ 
    //   args: { 
    //     payment: { txn: paymentTxn3, signer: testAccount.signer }, 
    //     investment: createdAsset2!,
    //   },
    //   extraFee: new AlgoAmount({ microAlgos: 1000 }) 
    // });

    const boxes = await client.appClient.getBoxValuesFromABIType(
      // algosdk.ABIType.from('(string,uint64,uint64,address,string,string,uint64)'),
      algosdk.ABIType.from('(uint64,uint64,uint64,address,string,address,uint64,uint64,uint64,uint64,uint64)'),
      (name) => {
        const rawName = name.name;
        return rawName.startsWith('investment-');
      }
    );
    console.debug(boxes);

    const boxes3 = await client.appClient.getBoxValuesFromABIType(
      algosdk.ABIType.from('(string,uint64,uint64,address,string,string,uint64)'),
      // algosdk.ABIType.from('(uint64,uint64,uint64,address,string,address,uint64,uint64,uint64,uint64,uint64)'),
      (name) => {
        const rawName = name.name;
        return rawName.startsWith('property-');
      }
    );
    console.debug(boxes3);

    await client.send.claimOverdueInvestment({
      args: {
        investment: createdAsset2!,
      },
      extraFee: new AlgoAmount({ microAlgos: 1000 }),
      sender: dispenser,
      signer: dispenser,
    })

    
  })
})
