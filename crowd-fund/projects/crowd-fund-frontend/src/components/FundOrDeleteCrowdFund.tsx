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

const FundOrDeleteCrowdFund = ({ openModal, setModalState }: AppCallsInterface) => {
  const [loading, setLoading] = useState<boolean>(false)
  const [appId, setAppId] = useState<number>(0);

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

    // Please note, in typical production scenarios,
    // you wouldn't want to use deploy directly from your frontend.
    // Instead, you would deploy your contract on your backend and reference it by id.
    // Given the simplicity of the starter contract, we are deploying it on the frontend
    // for demonstration purposes.
    const appClient = new CrowdFundClient(
      {
        sender: { signer, addr: activeAddress } as TransactionSignerAccount,
        resolveBy: 'id',
        id: appId,
      },
      algodClient,
    );

    await appClient.delete
        .deleteApplication({}, { sendParams: { fee: algokit.microAlgos(2_000) } })
        .then((res) => {
            enqueueSnackbar(`The smart contract was deleted successfully`, { variant: 'success' })
        })
        .catch((e: Error) => {
            enqueueSnackbar(`Error deleting the contract: ${e.message}`, { variant: 'error' })
            setLoading(false)
            return;
        })
    setLoading(false)
  }

  const topUpSmartContract = async () => {
    setLoading(true);

    const appClient = new CrowdFundClient(
        {
          sender: { signer, addr: activeAddress } as TransactionSignerAccount,
          resolveBy: 'id',
          id: appId,
        },
        algodClient,
      );
    
    const appAddress = (await appClient.appClient.getAppReference()).appAddress;

    const amountStr = prompt('How many algos do you want to deposit in the crowd fund?');
    const amount = parseInt(amountStr || '');

    if (isNaN(amount) || !amount) {
        enqueueSnackbar(`Invalid amount provided: ${amount}`, { variant: 'error' })
        setLoading(false)
        return;
    }

    const suggestedParams = await algokit.getTransactionParams(undefined, algodClient);
    const topUpTxn = makePaymentTxnWithSuggestedParamsFromObject({
      from: activeAddress!,
      to: appAddress,
      amount: algokit.algos(amount).microAlgos,
      suggestedParams,
    });

    try {
        await algokit.sendTransaction({
            transaction: topUpTxn,
            from: { signer, addr: activeAddress! }
          }, algodClient);
        enqueueSnackbar(`The smart contract was funded with ${amount} algos successfully`, { variant: 'success' })
    } catch (error) {
        enqueueSnackbar(`Error funding smar contract: ${error}`, { variant: 'error' })
        setLoading(false)
        return;
    }
    setLoading(false)
  };

  return (
    <dialog id="appcalls_modal" className={`modal ${openModal ? 'modal-open' : ''} bg-slate-200`}>
      <form method="dialog" className="modal-box">
        <h3 className="font-bold text-lg">Interact with the crowdfund</h3>
        <br />
        <br />
        <br />
        <label>Application ID</label>
        <br />
        <input
          type="number"
          placeholder="Provide the application ID"
          className="input input-bordered w-full"
          value={appId}
          onChange={(e) => {
            setAppId(parseInt(e.target.value || '0'))
          }}
        />
        <div className="modal-action ">
          <button disabled={!appId} className={`btn`} onClick={topUpSmartContract}>
            {loading ? <span className="loading loading-spinner" /> : 'Fund crowd-fund'}
          </button>
        </div>
        <div className="modal-action ">
          <button className="btn" onClick={() => {
            setModalState(!openModal)
            setLoading(false)
            }}>
            Close
          </button>
          <button disabled={!appId} className={`btn`} onClick={sendAppCall}>
            {loading ? <span className="loading loading-spinner" /> : 'Delete crowd-fund'}
          </button>
        </div>
      </form>
    </dialog>
  )
}

export default FundOrDeleteCrowdFund;
