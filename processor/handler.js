'use strict';

const { TransactionHandler } = require('sawtooth-sdk/processor/handler');
const { InvalidTransaction } = require('sawtooth-sdk/processor/exceptions');
const { encode, decode } = require('./services/encoding');
const { getCollectionAddress, getMojiAddress, getSireAddress } = require('./services/addressing');
const { createHash } = require('crypto');

const FAMILY_NAME = 'cryptomoji';
const FAMILY_VERSION = '0.1';
const NAMESPACE = '5f4d76';

/**
 * A Cryptomoji specific version of a Hyperledger Sawtooth Transaction Handler.
 */
class MojiHandler extends TransactionHandler {
  /**
   * The constructor for a TransactionHandler simply registers it with the
   * validator, declaring which family name, versions, and namespaces it
   * expects to handle. We'll fill this one in for you.
   */
  constructor() {
    console.log('Initializing cryptomoji handler with namespace:', NAMESPACE);
    super(FAMILY_NAME, [FAMILY_VERSION], [NAMESPACE]);
  }

  /**
   * The apply method is where the vast majority of all the work of a
   * transaction processor happens. It will be called once for every
   * transaction, passing two objects: a transaction process request ("txn" for
   * short) and state context.
   *
   * Properties of `txn`:
   *   - txn.payload: the encoded payload sent from your client
   *   - txn.header: the decoded TransactionHeader for this transaction
   *   - txn.signature: the hex signature of the header
   *
   * Methods of `context`:
   *   - context.getState(addresses): takes an array of addresses and returns
   *     a Promise which will resolve with the requested state. The state
   *     object will have keys which are addresses, and values that are encoded
   *     state resources.
   *   - context.setState(updates): takes an update object and returns a
   *     Promise which will resolve with an array of the successfully
   *     updated addresses. The updates object should have keys which are
   *     addresses, and values which are encoded state resources.
   *   - context.deleteState(addresses): deletes the state for the passed
   *     array of state addresses. Only needed if attempting the extra credit.
   */
  apply(txn, context) {
    // Enter your solution here
    // (start by decoding your payload and checking which action it has)
    let payload = null;
    try {
      payload = decode(txn.payload);
      if (payload.action === 'CREATE_COLLECTION') {
        return createCollection(context, txn);
      }
      if (payload.action === 'SELECT_SIRE') {
        return checkCollectionsExists(context, txn, payload);
      }
    } catch (err) {
      throw new InvalidTransaction('Unable to decode payload');
    }
    throw new InvalidTransaction('Unknown action');
  }
}

const checkCollectionsExists = (context, txn, payload) => {
  const address = getCollectionAddress(txn.header.signerPublicKey);
  return context.getState([address]).then(state => {

    if (state[address].length > 0 && payload.sire) {
      return selectSire(payload.sire, txn, context);
    } else {
      throw new InvalidTransaction();
    }
  });
}

const createCollection = (context, txn) => {
  const publicKey = txn.header.signerPublicKey;
  const address = getCollectionAddress(publicKey);

  return context.getState([address]).then(state => {
    if (state[address].length > 0) {
      throw new InvalidTransaction('Owner already exists');
    }
    const mojies = createMojies(txn.signature, publicKey);

    const mojiesAddresses = getMojiAddressses(publicKey, txn.signature);
    const collection = {
      key: publicKey,
      moji: mojiesAddresses
    };
    const update = {};
    update[address] = encode(collection);
    update[mojiesAddresses[0]] = encode(mojie1(txn.signature, publicKey));
    update[mojiesAddresses[1]] = encode(mojie2(txn.signature, publicKey));
    update[mojiesAddresses[2]] = encode(mojie3(txn.signature, publicKey));
    return context.setState(update);
  });
}

const selectSire = (sireAddress, txn, context) => {
  const publicKey = txn.header.signerPublicKey;
  const address = getSireAddress(publicKey);

  return context.getState([sireAddress]).then(sireAddressState => {
    if (sireAddressState[sireAddress].length > 0) {
      return context.getState([address]).then(state => {
        const update = {};
        const sireListing = {
          owner: publicKey,
          sire: sireAddress
        }
        update[address] = encode(sireListing);
        return context.setState(update);
      });
    } else {
      throw new InvalidTransaction();
    }
  });
}

const getMojiAddressses = (publicKey, signature) => {
  return [
    getMojiAddress(publicKey, mojie1(signature, publicKey).dna),
    getMojiAddress(publicKey, mojie2(signature, publicKey).dna),
    getMojiAddress(publicKey, mojie3(signature, publicKey).dna)
  ]
}

const createMojies = (signature, publicKey) => {
  return [mojie1(signature, publicKey), mojie2(signature, publicKey), mojie3(signature, publicKey)];
}

const dna1 = (signature) => { return createHash('sha512').update(signature).digest('hex').slice(0, 36); }
const dna2 = (dna1) => { return createHash('sha512').update(dna1).digest('hex').slice(0, 36) };
const dna3 = (dna2) => { return createHash('sha512').update(dna2).digest('hex').slice(0, 36) };

const mojie1 = (signature, publicKey) => {
  return {
    "dna": dna1(signature),
    "owner": publicKey,
    "breeder": "<string, moji address>",
    "sire": "<string, moji address>",
    "bred": ["<strings, moji addresses>"],
    "sired": ["<strings, moji addresses>"]
  }
}
const mojie2 = (signature, publicKey) => {
  return {
    "dna": dna2(dna1(signature)),
    "owner": publicKey,
    "breeder": "<string, moji address>",
    "sire": "<string, moji address>",
    "bred": ["<strings, moji addresses>"],
    "sired": ["<strings, moji addresses>"]
  }
}
const mojie3 = (signature, publicKey) => {
  return {
    "dna": dna3(dna2(dna1(signature))),
    "owner": publicKey,
    "breeder": "<string, moji address>",
    "sire": "<string, moji address>",
    "bred": ["<strings, moji addresses>"],
    "sired": ["<strings, moji addresses>"]
  }
}

module.exports = MojiHandler;