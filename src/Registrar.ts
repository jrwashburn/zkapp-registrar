import {
  Account,
  Bool,
  DeployArgs,
  method,
  Permissions,
  PrivateKey,
  PublicKey,
  SmartContract,
} from 'snarkyjs';

export class Registrar extends SmartContract {
  deploy(args: DeployArgs) {
    super.deploy(args);
  }

  init() {
    super.init();
    this.setPermissions({
      ...Permissions.default(),
      setTokenSymbol: Permissions.signature(),
      send: Permissions.proof(),
      receive: Permissions.proof(),
    });
    this.tokenSymbol.set('VOTER');
    //this.requireSignature();
  }

  getTokenID() {
    return this.token.id;
  }

  //TODO temporarily accepting voterPriavetKey - better solution should be signature from sender
  @method RegisterToVote(voter: PublicKey, voterSecret: PrivateKey) {
    Account(voter, this.token.id).isNew.assertEquals(Bool(true));
    voterSecret.toPublicKey().assertEquals(voter);
    this.token.mint({
      address: voter,
      amount: 1,
    });
  }
  /* TODO prototype signed votes
  @method RegisterToVote(voter: PublicKey, voterMessage: String, voterSignature: Signature) {
    validateVoterBalance();
    validateVoterMessage();
    validateIssueSnapshot();
    issueVoterToken();
  }


*/
  @method DelegateVote(
    voter: PublicKey,
    voterPrivateKey: PrivateKey,
    delegate: PublicKey
  ) {
    //temporary solution - need to get signature support from wallet
    voterPrivateKey.toPublicKey().assertEquals(voter);
    //ensure delegate exists / has registered to vote and is not delegated
    //Mina.getAccount(delegate, this.tokenId).balance.assertGte(UInt64.one);
    this.token.send({
      from: voter,
      to: delegate,
      amount: 1,
    }).approve;
  }

  /* TODO prototype vote
  @method Vote (
    voter: PublicKey,
    vote: PublicKey,
    voterMessage: String,
    voterSignature: Signature,
    voteAmount: Field
  ) {
    validateVoterBalance();
    validateVoterMessage();
    validateIssueSnapshot();
    voteIssue()
    this.token.send({
      from: voter,
      to: voteAddress,
      amount: voteAmount,
    }).approve;
  }
*/
  /* TODO prototype issue registration
  @method CreateIssueSnapshot (
    petitioner: PublicKey,
    issue: String,
    registrationEndTimeslot:
    delegationStartTimeslot:
    delegationEndTimeslot:
    voteStartTimeslot:
    voteEndTimeslot:
  ) {
    validateVoterSlotReservation();
      //available if vote has expired and slot not burned
    validatePetitionerParticipates(); //bootstrap participation?
    validateIssueLanguage();
    createVoteAccount('YES')
    createVoteAccount('NO')
    allocateVoteSlot()
    burnPriorVoters() //very expensive....consider

  }
*/
}
