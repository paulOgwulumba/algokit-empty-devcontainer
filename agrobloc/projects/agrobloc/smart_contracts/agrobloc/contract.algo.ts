import { Contract, BoxMap, arc4, uint64 } from '@algorandfoundation/algorand-typescript'

const COST_PER_BYTE = 400;
const COST_PER_BOX = 2500;
const MBR = 100_000;

class Property extends arc4.Struct<{
  title: arc4.Str,
  asset: arc4.UintN64,
  value: arc4.UintN64,
  maxInvestmentClaimable: arc4.UintN64,

  // Owner of property
  owner: arc4.Address,

  // Latitude and longitude
  latLong: arc4.Str,

  // Identifier for investment claimed with this property.
  // Defaults to 0.
  investment: arc4.UintN64,
}> {}

class Investment extends arc4.Struct<{
  // Annual percentage yield
  apy: arc4.UintN64,

  // Duration in milliseconds after which investment must be paid back
  maturityDuration: arc4.UintN64,

  // Unix Timestamp of time when a farmer claimed the investment.
  // Defaults to 0 
  timeClaimed: arc4.UintN64,

  // Investor
  owner: arc4.Address,

  // Farmer
  claimer: arc4.Str,
}> {}

export class Agrobloc extends Contract {
  public property = BoxMap<uint64, Property>({ keyPrefix: 'property' });

  public investment = BoxMap<uint64, Property>({ keyPrefix: 'investment' });

  public hello(name: string): string {
    return `Hello, ${name}`
  }
}
