const Reverter = require('../deps/test/helpers/reverter');
const AssertExpectations = require('../deps/test/helpers/assertExpectations');
const bytes32 = require('../deps/test/helpers/bytes32');

const Listener = artifacts.require('Listener');
const EToken2Testable = artifacts.require('EToken2Testable');
const RegistryICAPTestable = artifacts.require('RegistryICAPTestable');
const Stub = artifacts.require('Stub');
const UserContract = artifacts.require('UserContract');
const AssetProxy = artifacts.require('AssetProxy');
const AssetWithManager = artifacts.require('AssetWithManager');
const Mock = artifacts.require('Mock');
const Ambi2 = artifacts.require('Ambi2');

const assetBase = require('./assetBase');
const assetRecoveryTokens = require('./assetRecoveryTokens');

contract('AssetWithManager', function(accounts) {
  const reverter = new Reverter(web3);
  afterEach('revert', reverter.revert);

  const ADDRESS_ZERO = `0x${'0'.repeat(40)}`;
  const ambi2 = new web3.eth.Contract(Ambi2.abi, ADDRESS_ZERO);
  let asset;
  let ambi2mock;
  let mock;
  let assertExpectations;
  let assertExpectationsAmbi2;

  const OWNER = accounts[5];
  const TRUE = bytes32(1);
  const FALSE = bytes32(0);

  const USER = accounts[0];
  const AMOUNT = 1;

  const ADMIN = web3.utils.fromAscii('admin');
  const MANAGER = web3.utils.fromAscii('manager');
  const SYMBOL_STRING = 'TEST';
  const SYMBOL2_STRING = 'TEST2';
  const SYMBOL = web3.utils.fromAscii(SYMBOL_STRING);
  const SYMBOL2 = web3.utils.fromAscii(SYMBOL2_STRING);
  const NAME = 'Test Name';
  const DESCRIPTION = 'Test Description';
  const VALUE = 1001;
  const VALUE2 = 30000;
  const BASE_UNIT = 2;
  const IS_REISSUABLE = false;

  const assertAllExpectations = async () => {
    await assertExpectations();
    await assertExpectationsAmbi2();
  };

  const expectRole = (from, to, role, result) => {
    return ambi2mock.expectStaticCall(
      from,
      0,
      ambi2.methods.hasRole(from, role, to).encodeABI(),
      result);
  };

  before('setup others', async function() {
    this.Listener = Listener;
    this.UserContract = UserContract;
    this.userContract = await UserContract.new();
    this.AssetProxy = AssetProxy;
    this.assetProxy = await AssetProxy.new();
    ambi2mock = await Mock.new();
    mock = await Mock.new();
    this.etoken2 = await EToken2Testable.new();
    const instance = await AssetWithManager.new();
    asset = instance;
    this.asset = instance;
    this.assetProxyRecovery = await AssetProxy.new();
    this.assetRecovery = await AssetWithManager.new();

    this.ICAP = await RegistryICAPTestable.new();
    await this.etoken2.setupEventsHistory((await Stub.new()).address);
    await this.etoken2.setupRegistryICAP(this.ICAP.address);
    await this.etoken2.issueAsset(
      SYMBOL, VALUE, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    await this.etoken2.issueAsset(
      SYMBOL2, VALUE2, NAME, DESCRIPTION, BASE_UNIT, IS_REISSUABLE);
    await this.etoken2.__enableProxyCheck();
    await this.ICAP.registerAsset('TST', SYMBOL);
    await this.ICAP.registerInstitution('XREG', accounts[2]);
    await this.ICAP.registerInstitutionAsset(
      'TST', 'XREG', accounts[2], {from: accounts[2]});

    await this.assetProxyRecovery.init(
      this.etoken2.address, SYMBOL2_STRING, NAME);
    await this.assetProxyRecovery.proposeUpgrade(
      this.assetRecovery.address);
    await this.assetRecovery.init(
      this.assetProxyRecovery.address);

    await this.assetProxy.init(this.etoken2.address, SYMBOL_STRING, NAME);
    await this.assetProxy.proposeUpgrade(asset.address);
    await asset.init(this.assetProxy.address);
    await ambi2mock.expect(
      asset.address,
      0,
      ambi2.methods.claimFor(asset.address, OWNER).encodeABI(),
      TRUE);
    await asset.setupAmbi2(ambi2mock.address, {from: OWNER});
    assertExpectations = new AssertExpectations(assert, mock);
    assertExpectationsAmbi2 = new AssertExpectations(assert, ambi2mock);
    for (let i = 0; i < 10; i++) {
      await expectRole(asset.address, accounts[i], MANAGER, FALSE);
    }
    await expectRole(asset.address, this.assetProxy.address, MANAGER, FALSE);
    await expectRole(asset.address, this.userContract.address, MANAGER, FALSE);
    await reverter.snapshot();
  });

  it('should have default getters with correct values', async function() {
    assert.isTrue(await asset.isTransferAllowed());
  });

  it('should NOT allow to disallow transfers without admin role', async function() {
    await expectRole(asset.address, OWNER, ADMIN, FALSE);
    assert.isFalse(await asset.setTransferAllowed.call(false, {from: OWNER}));
    await asset.setTransferAllowed(false, {from: OWNER});
    assert.isTrue(await asset.isTransferAllowed());
    await assertAllExpectations();
  });

  it('should allow to disallow transfers with admin role', async function() {
    await expectRole(asset.address, OWNER, ADMIN, TRUE);
    assert.isTrue(await asset.setTransferAllowed.call(false, {from: OWNER}));
    await asset.setTransferAllowed(false, {from: OWNER});
    assert.isFalse(await asset.isTransferAllowed());
    await assertAllExpectations();
  });

  it('should NOT allow to allow transfers without admin role', async function() {
    await expectRole(asset.address, OWNER, ADMIN, TRUE);
    await asset.setTransferAllowed(false, {from: OWNER});
    await expectRole(asset.address, OWNER, ADMIN, FALSE);
    assert.isFalse(await asset.setTransferAllowed.call(true, {from: OWNER}));
    await asset.setTransferAllowed(true, {from: OWNER});
    assert.isFalse(await asset.isTransferAllowed());
    await assertAllExpectations();
  });

  it('should allow to allow transfers with admin role', async function() {
    await expectRole(asset.address, OWNER, ADMIN, TRUE);
    await asset.setTransferAllowed(false, {from: OWNER});
    assert.isTrue(await asset.setTransferAllowed.call(true, {from: OWNER}));
    await asset.setTransferAllowed(true, {from: OWNER});
    assert.isTrue(await asset.isTransferAllowed());
    await assertAllExpectations();
  });

  it('should NOT allow to do transfer by not manager', async function() {
    await expectRole(asset.address, OWNER, ADMIN, TRUE);
    await asset.setTransferAllowed(false, {from: OWNER});
    await expectRole(asset.address, USER, MANAGER, FALSE);
    await this.etoken2.setProxy(this.assetProxy.address, SYMBOL);
    const userBalance = await this.assetProxy.balanceOf(USER);
    assert.isFalse(
      await this.assetProxy.transfer.call(OWNER, AMOUNT, {from: USER}));
    await this.assetProxy.transfer(OWNER, AMOUNT, {from: USER});
    assert.equal(
      (await this.assetProxy.balanceOf(OWNER)).valueOf(), 0);
    assert.equal(
      (await this.assetProxy.balanceOf(USER)).toString(),
      userBalance.toString());
    await assertAllExpectations();
  });

  it('should allow to do transfer by manager', async function() {
    await expectRole(asset.address, OWNER, ADMIN, TRUE);
    await asset.setTransferAllowed(false, {from: OWNER});
    await expectRole(asset.address, USER, MANAGER, TRUE);
    await this.etoken2.setProxy(this.assetProxy.address, SYMBOL);
    const userBalance = await this.assetProxy.balanceOf(USER);
    assert.isTrue(
      await this.assetProxy.transfer.call(OWNER, AMOUNT, {from: USER}));
    await this.assetProxy.transfer(OWNER, AMOUNT, {from: USER});
    assert.equal(
      (await this.assetProxy.balanceOf(OWNER)).toString(), AMOUNT);
    assert.equal(
      (await this.assetProxy.balanceOf(USER)).toString(),
      userBalance.subn(AMOUNT).toString());
    await assertAllExpectations();
  });

  it('should NOT allow to do allowance transfer by not manager', async function() {
    await expectRole(asset.address, OWNER, ADMIN, TRUE);
    await asset.setTransferAllowed(false, {from: OWNER});
    await expectRole(asset.address, OWNER, MANAGER, FALSE);
    await this.etoken2.setProxy(this.assetProxy.address, SYMBOL);
    const userBalance = await this.assetProxy.balanceOf(USER);
    await this.assetProxy.approve(OWNER, AMOUNT);
    assert.isFalse(
      await this.assetProxy.transferFrom.call(
        USER, OWNER, AMOUNT, {from: OWNER}));
    await this.assetProxy.transferFrom(USER, OWNER, AMOUNT, {from: OWNER});
    assert.equal(
      (await this.assetProxy.balanceOf(OWNER)).toString(), 0);
    assert.equal(
      (await this.assetProxy.balanceOf(USER)).toString(),
      userBalance.toString());
    await assertAllExpectations();
  });

  it('should allow to do allowance transfer by manager', async function() {
    await expectRole(asset.address, OWNER, ADMIN, TRUE);
    await asset.setTransferAllowed(false, {from: OWNER});
    await expectRole(asset.address, OWNER, MANAGER, TRUE);
    await this.etoken2.setProxy(this.assetProxy.address, SYMBOL);
    const userBalance = await this.assetProxy.balanceOf(USER);
    assert.isTrue(
      await this.assetProxy.transferFrom.call(
        USER, OWNER, AMOUNT, {from: OWNER}));
    await this.assetProxy.transferFrom(USER, OWNER, AMOUNT, {from: OWNER});
    assert.equal(
      (await this.assetProxy.balanceOf(OWNER)).toString(), AMOUNT);
    assert.equal(
      (await this.assetProxy.balanceOf(USER)).toString(),
      userBalance.subn(AMOUNT).toString());
    await assertAllExpectations();
  });

  assetBase(accounts);
  assetRecoveryTokens(accounts);
});
