import { Contract, BoxMap, arc4, uint64 } from '@algorandfoundation/algorand-typescript'

const COST_PER_BYTE = 400;
const COST_PER_BOX = 2500;
const MBR = 100_000;

class Property extends arc4.Struct<{
  title: arc4.Str,
  asset: arc4.UintN64,
  value: arc4.UintN64,
  maxInvestmentClaimable: arc4.UintN64,
  owner: arc4.Address,
  latLong: arc4.Str,

  // Identifier for investment claimed with this property.
  // Defaults to 0.
  investment: arc4.UintN64,
}> {}

class Investment extends arc4.Struct<{
  apy: arc4.UintN64,

  // Duration in milliseconds after which investment must be paid back
  maturityDuration: arc4.UintN64,

  // Unix Timestamp of time when a farmer claimed the investment.
  // Defaults to 0 
  timeClaimed: arc4.UintN64,
}> {}

export class Agrobloc extends Contract {
  public property = BoxMap<uint64, Property>({ keyPrefix: 'property' }); 

  public hello(name: string): string {
    return `Hello, ${name}`
  }
}
