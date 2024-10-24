// src/components/Home.tsx
import { useWallet } from '@txnlab/use-wallet'
import React, { useState } from 'react'
import ConnectWallet from './components/ConnectWallet'
import Transact from './components/Transact'
import AppCalls from './components/AppCalls'
import CreateCrowdFund from './components/CreateCrowdFund'
import FundOrDeleteCrowdFund from './components/FundOrDeleteCrowdFund'

interface HomeProps {}

const Home: React.FC<HomeProps> = () => {
  const [openWalletModal, setOpenWalletModal] = useState<boolean>(false)
  const [openDemoModal, setOpenDemoModal] = useState<boolean>(false)
  const [appCallsDemoModal, setAppCallsDemoModal] = useState<boolean>(false)
  const [createCrowdfundModal, setCreateCrowdfundModal] = useState<boolean>(false)
  const { activeAddress } = useWallet()

  const toggleWalletModal = () => {
    setOpenWalletModal(!openWalletModal)
  }

  const toggleAppCallsModal = () => {
    setAppCallsDemoModal(!appCallsDemoModal)
  }

  const toggleCreateCrowdFundModal = () => {
    setCreateCrowdfundModal(!createCrowdfundModal)
  }

  return (
    <div className="hero min-h-screen bg-teal-400">
      <div className="hero-content text-center rounded-lg p-6 max-w-md bg-white mx-auto">
        <div className="max-w-md">
          <h1 className="text-4xl">
            Welcome to <div className="font-bold">Crowdfund 🙂</div>
          </h1>

          <div className="grid">
            <div className="divider" />
            <button data-test-id="connect-wallet" className="btn m-2" onClick={toggleWalletModal}>
              Wallet Connection
            </button>

            {activeAddress && (
              <button data-test-id="transactions-demo" className="btn m-2" onClick={toggleCreateCrowdFundModal}>
                Create new CrowdFund
              </button>
            )}

          {activeAddress && (
              <button data-test-id="transactions-demo" className="btn m-2" onClick={toggleAppCallsModal}>
                Interact with existing CrowdFund
              </button>
            )}
          </div>

          <ConnectWallet openModal={openWalletModal} closeModal={toggleWalletModal} />
          <Transact openModal={openDemoModal} setModalState={setOpenDemoModal} />
          <FundOrDeleteCrowdFund openModal={appCallsDemoModal} setModalState={setAppCallsDemoModal} />
          <CreateCrowdFund openModal={createCrowdfundModal} setModalState={setCreateCrowdfundModal} />
        </div>
      </div>
    </div>
  )
}

export default Home
