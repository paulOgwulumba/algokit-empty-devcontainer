import { Contract } from '@algorandfoundation/algorand-typescript'

const COST_PER_BYTE = 400;
const COST_PER_BOX = 2500;
const MBR = 100_000;

export class Agrobloc extends Contract {
  public hello(name: string): string {
    return `Hello, ${name}`
  }
}
