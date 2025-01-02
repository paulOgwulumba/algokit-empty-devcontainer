import { Contract } from '@algorandfoundation/tealscript';

/**
 * Metadata indexed to unique ipfs hash
 */
type Metadata = {
  /**
   * ASA Id of NFT created for the IPFS hash
   */
  asaId: uint64;

  /**
   * Address of the account the NFT is created for
   */
  address: Address;
}

const COST_PER_BYTE = 400;
const COST_PER_BOX = 2500;

export class BlockTrempNFT extends Contract {
  /** The boxes that keep track of all created NFTs */
  certificateBoxes = BoxMap<bytes, Metadata>();

  /**
   * This method mints the certificate ASA for the user and 
   * returns the ASA ID.
   * @param ipfsHash The hash for the certificate.
   * @param mbrPayment Payment for the minimum balance requirement for the
   * box storage where a reference to the ASA would be persisted in.
   * @returns The ID of the asset.
   */
  createCertificate(ipfsHash: string, mbrPayment: PayTxn): AssetReference {
    assert(!this.certificateBoxes(ipfsHash).exists);

    const totalCost = COST_PER_BOX + (COST_PER_BYTE * (64 + 64));

    assert(mbrPayment.amount >= totalCost);
    assert(mbrPayment.receiver === this.app.address);
    assert(mbrPayment.sender === this.txn.sender);


    const ipfsUrl = 'ipfs://' + ipfsHash;

    const assetID = sendAssetCreation({
      configAssetTotal: 1,
      configAssetDecimals: 0,
      configAssetName: 'Blocktremp Certificate',
      configAssetUnitName: 'BCERT',
      configAssetURL: ipfsUrl,
    });

    const metadata: Metadata = {
      asaId: assetID.id,
      address: this.txn.sender,
    };

    this.certificateBoxes(ipfsHash).value = metadata;

    return assetID;
  }

  claimCertificate(ipfsHash: string, assetID: AssetReference) {
    assert(this.certificateBoxes(ipfsHash).exists);

    const box = this.certificateBoxes(ipfsHash);

    assert(box.value.address === this.txn.sender);
    // assert(this.app.)
  }
}