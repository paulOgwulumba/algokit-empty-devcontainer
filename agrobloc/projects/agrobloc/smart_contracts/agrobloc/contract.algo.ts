import {
  abimethod,
  arc4,
  assert,
  BoxMap,
  Contract,
  itxn,
  Txn,
  uint64,
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
  claimer: arc4.Str,

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
}> {}

export class Agrobloc extends Contract {
  public property = BoxMap<uint64, Property>({ keyPrefix: 'property' });

  public investment = BoxMap<uint64, Investment>({ keyPrefix: 'investment' });

  @abimethod({ onCreate: 'require' })
  public create_application() {}

  @abimethod()
  public list_property(
    title: string, 
    value: uint64, 
    latLong: string, 
    address: string
  ): uint64 {
    assert(value > 0);

    const response = itxn.assetConfig({
      assetName: title,
      total: 1,
      decimals: 0,
    }).submit();

    this.property(response.createdAsset.id).value = new Property({
      title: new arc4.Str(title),
      asset: new arc4.UintN64(response.createdAsset.id),
      owner: new arc4.Address(Txn.sender),
      latLong: new arc4.Str(latLong),
      address: new arc4.Str(address),
      investment: new arc4.UintN64(0),
      value: new arc4.UintN64(value),
    });

    return response.createdAsset.id;
  }

  @abimethod()
  public create_investment(
    apy: uint64,
    maturityDuration: uint64,
    ownerTitle: string,
    value: uint64,
  ): uint64 {
    assert(value > 0);

    const response = itxn.assetConfig({
      assetName: ownerTitle,
      total: 1,
      decimals: 0,
    }).submit();

    this.investment(response.createdAsset.id).value = new Investment({
      ownerTitle: new arc4.Str(ownerTitle),
      asset: new arc4.UintN64(response.createdAsset.id),
      owner: new arc4.Address(Txn.sender),
      apy: new arc4.UintN64(apy),
      maturityDuration: new arc4.UintN64(maturityDuration),
      timeClaimed: new arc4.UintN64(0),
      claimer: new arc4.Str(''),
      value: new arc4.UintN64(value),
      amountRepaid: new arc4.UintN64(0),
      amountToRepay: new arc4.UintN64(0),
    });

    return response.createdAsset.id;
  }

  public hello(name: string): string {
    return `Hello, ${name}`
  }
}
