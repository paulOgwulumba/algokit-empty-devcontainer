import * as algokit from '@algorandfoundation/algokit-utils'
import { TransactionSignerAccount } from '@algorandfoundation/algokit-utils/types/account'
import { useWallet } from '@txnlab/use-wallet'
import { useSnackbar } from 'notistack'
import { useState } from 'react'
import { CrowdFundClient } from '../contracts/CrowdFund'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { makePaymentTxnWithSuggestedParamsFromObject } from 'algosdk'

interface AppCallsInterface {
  openModal: boolean
  setModalState: (value: boolean) => void
}

const CreateCrowdFund = ({ openModal, setModalState }: AppCallsInterface) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [beneficiary, setBeneficiary] = useState<string>('')
  const [targetAmount, setTargetAmount] = useState<number>(0);

  const algodConfig = getAlgodConfigFromViteEnvironment()
  const algodClient = algokit.getAlgoClient({
    server: algodConfig.server,
    port: algodConfig.port,
    token: algodConfig.token,
  })

  const { enqueueSnackbar } = useSnackbar()
  const { signer, activeAddress } = useWallet()

  const sendAppCall = async () => {
    setLoading(true)
    let appAddress = '';

    // Please note, in typical production scenarios,
    // you wouldn't want to use deploy directly from your frontend.
    // Instead, you would deploy your contract on your backend and reference it by id.
    // Given the simplicity of the starter contract, we are deploying it on the frontend
    // for demonstration purposes.
    const appClient = new CrowdFundClient(
      {
        sender: { signer, addr: activeAddress } as TransactionSignerAccount,
        resolveBy: 'id',
        id: 0,
      },
      algodClient,
    );

    await appClient.create
        .createApplication({ targetAmount: algokit.algos(targetAmount).microAlgos, beneficiary })
        .then((res) => {
            console.log(res);
            appAddress = res.appAddress
            enqueueSnackbar(`The smart contract was created successfully with App ID: ${res.appId}`, { variant: 'success' })
        })
        .catch((e: Error) => {
            enqueueSnackbar(`Error deploying the contract: ${e.message}`, { variant: 'error' })
            setLoading(false)
            return;
        })
    
    const suggestedParams = await algokit.getTransactionParams(undefined, algodClient);
    const topUpTxn = makePaymentTxnWithSuggestedParamsFromObject({
      from: activeAddress!,
      to: appAddress,
      amount: algokit.microAlgos(100_000).microAlgos,
      suggestedParams,
    });

    await algokit.sendTransaction({
      transaction: topUpTxn,
      from: { signer, addr: activeAddress! }
    }, algodClient);

    setLoading(false)
  }

  return (
    <dialog id="appcalls_modal" className={`modal ${openModal ? 'modal-open' : ''} bg-slate-200`}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-lg">Provide the details of your crowdfund</h3>
        <br />
        <br />
        <label>Beneficiary address</label>
        <br />
        <input
          type="text"
          placeholder="Provide the address of the beneficiary"
          className="input input-bordered w-full"
          value={beneficiary}
          onChange={(e) => {
            setBeneficiary(e.target.value)
          }}
        />
        <br />
        <button 
            className="btn" 
            onClick={() => setBeneficiary(activeAddress || '')}
        >
            Use own address
        </button>
        <br />
        <br />
        <label>Target amount</label>
        <br />
        <input
          type="number"
          placeholder="Provide the target amount"
          className="input input-bordered w-full"
          value={targetAmount}
          onChange={(e) => {
            setTargetAmount(parseInt(e.target.value || '0'))
          }}
        />
        <div className="modal-action ">
          <button className="btn" onClick={() => setModalState(!openModal)}>
            Close
          </button>
          <button disabled={!beneficiary || targetAmount <= 0} className={`btn`} onClick={sendAppCall}>
            {loading ? <span className="loading loading-spinner" /> : 'Create crowd-fund'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default CreateCrowdFund;
