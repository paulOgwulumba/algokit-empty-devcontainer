import {
  abimethod,
  arc4,
  assert,
  Asset,
  BoxMap,
  Contract,
  Global,
  gtxn,
  itxn,
  Txn,
  Uint64,
  uint64
} from '@algorandfoundation/algorand-typescript';

class Property extends arc4.Struct<{
  // Property title
  title: arc4.Str,

  // Property ASA
  asset: arc4.UintN64,

  // Property value
  value: arc4.UintN64,

  // Owner of property
  owner: arc4.Address,

  // Latitude and longitude
  latLong: arc4.Str,

  // Physical address of property
  address: arc4.Str,

  // Identifier for investment claimed with this property.
  // Defaults to 0.
  investment: arc4.UintN64,

  // Timestamp of creation
  createdAt: arc4.UintN64,

  // First owner
  initialOwner: arc4.Address,

  // Identifier for last investment, defaults to 0
  lastInvestment: arc4.UintN64,
}> {}

class Investment extends arc4.Struct<{
  // Annual percentage yield
  apy: arc4.UintN64,

  // Duration in years after which investment must be paid back
  maturityDuration: arc4.UintN64,

  // Unix Timestamp of time when a farmer claimed the investment.
  // Defaults to 0 
  timeClaimed: arc4.UintN64,

  // Investor
  owner: arc4.Address,

  // Investor title
  ownerTitle: arc4.Str,

  // Farmer
  // Defaults to ""
  claimer: arc4.Address,

  // Value of investment
  value: arc4.UintN64,

  // Amount repaid
  // defaults to 0
  amountRepaid: arc4.UintN64,

  // Amount to repay
  // defaults to 0
  amountToRepay: arc4.UintN64,

  // Investment ASA
  asset: arc4.UintN64,

  // Collateral 
  // Defaults to 0
  collateral: arc4.UintN64,

  // Time repayed
  // Defaults to 0
  timeRepaid: arc4.UintN64,

  // Timestamp of creation
  createdAt: arc4.UintN64,
}> {}

export class Agrobloc extends Contract {
  public property = BoxMap<uint64, Property>({ keyPrefix: 'property-' });

  public investment = BoxMap<uint64, Investment>({ keyPrefix: 'investment-' });

  @abimethod({ onCreate: 'require' })
  public create_application() {}

  @abimethod()
  public tokenize(
    title: string, 
  ): uint64 {
    const response = itxn.assetConfig({
      assetName: title,
      total: 1,
      decimals: 0,
    }).submit();

    return response.createdAsset.id;
  }

  @abimethod()
  public list_property(
    title: string, 
    value: uint64, 
    latLong: string, 
    address: string,
    asset: Asset,
  ) {
    assert(value > 0);
    assert(!this.property(asset.id).exists);

    this.property(asset.id).value = new Property({
      title: new arc4.Str(title),
      asset: new arc4.UintN64(asset.id),
      owner: new arc4.Address(Txn.sender),
      latLong: new arc4.Str(latLong),
      address: new arc4.Str(address),
      investment: new arc4.UintN64(0),
      value: new arc4.UintN64(value),
      createdAt: new arc4.UintN64(Global.latestTimestamp),
      initialOwner: new arc4.Address(Txn.sender),
      lastInvestment: new arc4.UintN64(0),
    });
  }

  @abimethod()
  public create_investment(
    paymentTxn: gtxn.PaymentTxn,
    apy: uint64,
    maturityDuration: uint64,
    ownerTitle: string,
    asset: Asset,
  ): uint64 {
    assert(paymentTxn.amount > 0);
    assert(!this.investment(asset.id).exists);

    this.investment(asset.id).value = new Investment({
      ownerTitle: new arc4.Str(ownerTitle),
      asset: new arc4.UintN64(asset.id),
      owner: new arc4.Address(Txn.sender),
      apy: new arc4.UintN64(apy),
      maturityDuration: new arc4.UintN64(maturityDuration),
      timeClaimed: new arc4.UintN64(0),
      claimer: new arc4.Address(Global.zeroAddress),
      value: new arc4.UintN64(paymentTxn.amount),
      amountRepaid: new arc4.UintN64(0),
      amountToRepay: new arc4.UintN64(0),
      collateral: new arc4.UintN64(0),
      timeRepaid: new arc4.UintN64(0),
      createdAt: new arc4.UintN64(Global.latestTimestamp),
    });

    return asset.id;
  }

  @abimethod()
  public claim_investment(investment: uint64, collateral: uint64) {
    const investment_to_claim = this.investment(investment);
    assert(investment_to_claim.exists);
    assert(investment_to_claim.value.timeClaimed.native === 0);
    assert(investment_to_claim.value.claimer.native === Global.zeroAddress);

    const property = this.property(collateral);
    assert(property.exists);
    assert(property.value.owner.native === Txn.sender);
    assert(property.value.investment.native === 0);
    assert(property.value.value.native * 3 / 4 >= investment_to_claim.value.value.native);

    itxn.payment({
      receiver: Txn.sender,
      amount: investment_to_claim.value.value.native,
    }).submit();

    property.value = new Property({
      title: property.value.title,
      asset: property.value.asset,
      owner: property.value.owner,
      latLong: property.value.latLong,
      address: property.value.address,
      investment: investment_to_claim.value.asset,
      value: property.value.value,
      createdAt: property.value.createdAt,
      initialOwner: property.value.initialOwner,
      lastInvestment: investment_to_claim.value.asset,
    });

    const amountToRepay = Uint64(investment_to_claim.value.value.native +  investment_to_claim.value.apy.native / 100 * investment_to_claim.value.value.native)

    investment_to_claim.value = new Investment({
      ownerTitle: investment_to_claim.value.ownerTitle,
      asset: investment_to_claim.value.asset,
      owner: investment_to_claim.value.owner,
      apy: investment_to_claim.value.apy,
      maturityDuration: investment_to_claim.value.maturityDuration,
      timeClaimed: new arc4.UintN64(Global.latestTimestamp),
      claimer: new arc4.Address(Txn.sender),
      value: investment_to_claim.value.value,
      amountRepaid: new arc4.UintN64(0),
      amountToRepay: new arc4.UintN64(amountToRepay),
      collateral: new arc4.UintN64(collateral),
      timeRepaid: investment_to_claim.value.timeRepaid,
      createdAt: investment_to_claim.value.createdAt,
    });
  }

  @abimethod()
  public repay_investment(
    payment: gtxn.PaymentTxn,
    investment: uint64
  ) {
    const investment_to_repay = this.investment(investment);
    assert(investment_to_repay.exists);
    assert(investment_to_repay.value.claimer.native === Txn.sender);
    assert(
      payment.amount <= investment_to_repay.value.amountToRepay.native - investment_to_repay.value.amountRepaid.native
    );
    assert(payment.receiver === Global.currentApplicationAddress);
    assert(payment.amount > 0);

    const isOverdue = 
      Global.latestTimestamp > (investment_to_repay.value.timeClaimed.native + investment_to_repay.value.maturityDuration.native);

    assert(!isOverdue);

    itxn.payment({
      receiver: investment_to_repay.value.owner.native,
      amount: payment.amount,
    }).submit();

    const amountRepaid = Uint64(investment_to_repay.value.amountRepaid.native + payment.amount);

    investment_to_repay.value = new Investment({
      ownerTitle: investment_to_repay.value.ownerTitle,
      asset: investment_to_repay.value.asset,
      owner: investment_to_repay.value.owner,
      apy: investment_to_repay.value.apy,
      maturityDuration: investment_to_repay.value.maturityDuration,
      timeClaimed: investment_to_repay.value.timeClaimed,
      claimer: investment_to_repay.value.claimer,
      value: investment_to_repay.value.value,
      amountRepaid: new arc4.UintN64(amountRepaid),
      amountToRepay: investment_to_repay.value.amountToRepay,
      collateral: investment_to_repay.value.collateral,
      timeRepaid: new arc4.UintN64(Global.latestTimestamp),
      createdAt: investment_to_repay.value.createdAt,
    });

    if (amountRepaid === investment_to_repay.value.amountToRepay.native) {
      const collateral = this.property(investment_to_repay.value.collateral.native);

      assert(collateral.exists);
      assert(collateral.value.investment.native === investment_to_repay.value.asset.native);

      collateral.value = new Property({
        title: collateral.value.title,
        asset: collateral.value.asset,
        owner: collateral.value.owner,
        latLong: collateral.value.latLong,
        address: collateral.value.address,
        investment: new arc4.UintN64(0),
        value: collateral.value.value,
        createdAt: collateral.value.createdAt,
        initialOwner: collateral.value.initialOwner,
        lastInvestment: collateral.value.lastInvestment,
      })
    }
  }

  @abimethod()
  public delete_investment(investment: uint64) {
    const investment_to_delete = this.investment(investment);
    assert(investment_to_delete.exists);
    assert(investment_to_delete.value.timeClaimed.native === 0);
    assert(investment_to_delete.value.claimer.native === Global.zeroAddress);
    assert(investment_to_delete.value.owner.native === Txn.sender);
    assert(investment_to_delete.value.collateral.native === 0)

    itxn.payment({
      receiver: Txn.sender,
      amount: investment_to_delete.value.value.native,
    }).submit();

    investment_to_delete.delete();
  }

  @abimethod()
  public claim_overdue_investment(investment: uint64) {
    const investment_to_claim = this.investment(investment);
    assert(investment_to_claim.exists);
    assert(investment_to_claim.value.owner.native === Txn.sender);
    assert(investment_to_claim.value.claimer.native !== Global.zeroAddress);
    assert(investment_to_claim.value.amountToRepay.native > 0);
    assert(investment_to_claim.value.amountRepaid.native < investment_to_claim.value.amountToRepay.native);

    const isOverdue = Global.latestTimestamp >
      investment_to_claim.value.timeClaimed.native + investment_to_claim.value.maturityDuration.native;

    assert(isOverdue);
    const collateral = this.property(investment_to_claim.value.collateral.native);

    assert(collateral.value.investment.native === investment_to_claim.value.asset.native);

    collateral.value = new Property({
      title: collateral.value.title,
      asset: collateral.value.asset,
      owner: new arc4.Address(Txn.sender),
      latLong: collateral.value.latLong,
      address: collateral.value.address,
      investment: new arc4.UintN64(0),
      value: collateral.value.value,
      createdAt: collateral.value.createdAt,
      initialOwner: collateral.value.initialOwner,
      lastInvestment: collateral.value.lastInvestment,
    });

    investment_to_claim.value = new Investment({
      ownerTitle: investment_to_claim.value.ownerTitle,
      asset: investment_to_claim.value.asset,
      owner: investment_to_claim.value.owner,
      apy: investment_to_claim.value.apy,
      maturityDuration: investment_to_claim.value.maturityDuration,
      timeClaimed: investment_to_claim.value.timeClaimed,
      claimer: investment_to_claim.value.claimer,
      value: investment_to_claim.value.value,
      amountRepaid: investment_to_claim.value.amountToRepay,
      amountToRepay: new arc4.UintN64(0),
      collateral: investment_to_claim.value.collateral,
      timeRepaid: investment_to_claim.value.timeRepaid,
      createdAt: investment_to_claim.value.createdAt,
    });
  }

  @abimethod()
  public delete_property(property: uint64) {
    const property_to_delete = this.property(property);

    assert(property_to_delete.exists);
    assert(property_to_delete.value.owner.native === Txn.sender);
    assert(property_to_delete.value.investment.native === 0);

    property_to_delete.delete();
  }
}
