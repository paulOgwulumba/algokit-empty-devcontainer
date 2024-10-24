import { Contract } from '@algorandfoundation/tealscript';

export class CrowdFund extends Contract {
  /**
   * This represents the beneficiary address of the
   * Crowd Fund.
   */
  beneficiary = GlobalStateKey<Address>();

  /**
   * This represents the target amount of the Crowd
   * Fund.
   */
  targetAmount = GlobalStateKey<uint64>();

  createApplication(beneficiary: Address, targetAmount: uint64): void {
    this.beneficiary.value = beneficiary;
    this.targetAmount.value = targetAmount;
  }

  deleteApplication(): void {
    assert(this.txn.sender === this.app.creator, 'Only the creator can delete this application.');
    assert(this.app.address.balance >= this.targetAmount.value, 'Target amount must be achieved or exceeded.');

    sendPayment({
      amount: 0,
      receiver: this.beneficiary.value,
      sender: this.app.address,
      closeRemainderTo: this.beneficiary.value,
    });
  }
}
