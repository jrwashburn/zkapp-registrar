import { Registrar } from './Registrar';
import {
  Account,
  AccountUpdate,
  isReady,
  Mina,
  PrivateKey,
  PublicKey,
  shutdown,
} from 'snarkyjs';

const proofsEnabled = false;

describe('RegisterToVote', () => {
  let deployerAccount: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: Registrar,
    voter1: PublicKey,
    voter2: PublicKey,
    voter1Secret: PrivateKey,
    voter2Secret: PrivateKey;

  beforeAll(async () => {
    await isReady;
    console.time('Starting local blockchain');
    const Local = Mina.LocalBlockchain({ proofsEnabled });
    Mina.setActiveInstance(Local);
    console.timeLog('Starting local blockchain');
    deployerAccount = Local.testAccounts[0].privateKey;
    if (proofsEnabled) {
      console.time('Compiling contract');
      await Registrar.compile();
      console.timeLog('Compiling contract');
    }

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new Registrar(zkAppAddress);
    voter1Secret = PrivateKey.random();
    //voter1Secret = Local.testAccounts[0].privateKey
    voter2Secret = PrivateKey.random();
    voter1 = voter1Secret.toPublicKey();
    voter2 = voter2Secret.toPublicKey();

    console.time('deploying contract');
    const registrar = new Registrar(zkAppAddress);
    const deploy_txn = await Local.transaction(deployerAccount, () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      registrar.deploy({ zkappKey: zkAppPrivateKey });
    });
    console.time('proving transaction');
    await deploy_txn.prove();
    console.timeLog('proving transaction');
    console.time('signing and sending transaction');
    await deploy_txn.sign([zkAppPrivateKey]).send();
    console.timeLog('signing and sending transaction');
    console.timeLog('deploying contract');
    console.log('Ready to test');
  });

  afterAll(() => {
    // `shutdown()` internally calls `process.exit()` which will exit the running Jest process early.
    // Specifying a timeout of 0 is a workaround to defer `shutdown()` until Jest is done running all tests.
    // This should be fixed with https://github.com/MinaProtocol/mina/issues/10943
    setTimeout(shutdown, 0);
  });

  it('attempts to mint token for publickey', async () => {
    console.time('RegisterToVote');
    const txn = await Mina.transaction(deployerAccount, () => {
      if (Account(voter1).isNew.get()) {
        AccountUpdate.fundNewAccount(deployerAccount);
        //AccountUpdate.fundNewAccount(deployerAccount);
        //AccountUpdate.fundNewAccount(deployerAccount);
        console.log('funding 1 account');
      }
      console.time('calling zkApp');
      zkApp.RegisterToVote(voter1, voter1Secret);
      console.timeLog('calling zkApp');
    });
    console.time('proving transaction');
    await txn.prove();
    console.timeLog('proving transaction');
    console.time('sending transaction');
    await txn.send();
    console.timeLog('sending transaction');
    console.timeLog('RegisterToVote');
    //console.log(txn.toPretty());
    //let voter1Account = getAccount(voter1, zkApp.getTokenID());
    //expect(voter1Account.balance).toEqual(1);
  });

  it('fails to re-mint another token for the same public key on the smart contract', async () => {
    const txn = await Mina.transaction(deployerAccount, () => {
      //AccountUpdate.fundNewAccount(deployerAccount);
      if (Account(voter1).isNew.get()) {
        AccountUpdate.fundNewAccount(deployerAccount);
      }
      zkApp.RegisterToVote(voter1, voter1Secret);
    });
    await txn.prove();
    await expect(txn.send()).rejects.toThrow();
    //let voter1Account = Mina.getAccount(voter1, zkApp.getTokenID());
    //expect(voter1Account.balance).toEqual(UInt64.one);
  });

  it('creates another voter successfully', async () => {
    const txn = await Mina.transaction(deployerAccount, () => {
      //AccountUpdate.fundNewAccount(deployerAccount);
      if (Account(voter1).isNew.get()) {
        AccountUpdate.fundNewAccount(deployerAccount);
      }
      zkApp.RegisterToVote(voter2, voter2Secret);
    });
    await txn.prove();
    await txn.send();
    //let voter2Account = Mina.getAccount(voter2, zkApp.getTokenID());
    //expect(voter2Account.balance).toEqual(UInt64.one);
  });

  it('delegates to another public key', async () => {
    const txn = await Mina.transaction(deployerAccount, () => {
      zkApp.DelegateVote(voter1, voter1Secret, voter2);
    });
    await txn.prove();
    await txn.sign([voter1Secret]).send();
    //let voter1Account = Mina.getAccount(voter1, Field(tokenId));
    //let voter2Account = Mina.getAccount(voter2, Field(tokenId));
    //expect(voter1Account.balance).toEqual(UInt64.zero);
    //expect(voter2Account.balance).toEqual(UInt64.zero);
  });

  it('votes the delegated amount', async () => {
    console.log('NOT IMPLEMENTED');
    //TODO
  });
});
