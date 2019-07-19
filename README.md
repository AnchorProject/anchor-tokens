# ANCT and DOCT token contracts
Anchor and DockToken token contracts.
=========

# Installation

**NodeJS 8.x+ along with build-essential must be installed as a prerequisite.**
```
$ npm install
```

# Running tests

```
$ npm run testrpc
$ npm run test
```

# Contracts ecosystem details

```
./EToken2 folder contains following 6 contracts as a single, standalone files for easier compilation.

EToken2.sol ByteCode identical with deployed 0x331d077518216c07C87f4f18bA64cd384c411F84 contract, verified on etherscan.io
Ambi2.sol ByteCode identical with deployed 0x48681684FfcC808C10E519364d31B73662B3e333 contract, verified on etherscan.io
EToken2Emitter.sol ByteCode identical with deployed 0xE8C051e1647A19Fbb0F94e3Cd3FcE074AE3C333D contract, verified on etherscan.io
EventsHistory.sol ByteCode identical with deployed 0x60bf91ac87fEE5A78c28F7b67701FBCFA79C18EC contract, verified on etherscan.io
RegistryICAP.sol ByteCode identical with deployed 0x96a51938CFB22565E0d40694Fe103675c63AE218 contract, verified on etherscan.io
MultiAssetEmitter.sol ByteCode identical with deployed 0x4E8703a59FEc01A97d4d2D76271E4F086dbB52Fc contract, verified on etherscan.io


EToken2 is the main asset platform.
    It talks to EventsHistory to store events, which in turn asks MultiAssetEmitter and EToken2Emitter for event definitions.
        EventsHistory uses Ambi for admin access checks, admin is Ambisafe.
    It talks to RegistryICAP to resolve ICAP addresses.
        RegistryICAP uses Ambi for admin access checks, admin is Ambisafe.
    It uses Ambi2 for admin access checks, admin is Ambisafe.
    It talks to AssetProxy (deployed separately for every asset) which in turn talks to Asset (deployed separately).

AssetProxy is the ERC20 to EToken2 interface contract, entry point for asset users.

Ambi implementation is not revealed because it doesn't affect particular Asset lifecycle after asset being issued.

===================== Anchor =====================

AssetProxy.sol renamed to Anchor and deployed at 0x5456BC77Dd275c45c3C15f0cF936b763cF57c3B5, verified on etherscan.io;
AssetWithManager.sol deployed at 0xbd130533bd891Ba1f2dE25cf3Bf198342e58D520, verified on etherscan.io;

===================== DockToken ==================

AssetProxy.sol renamed to DockToken and deployed at 0x0F0b41BBeDD1750eE3A7d581fE124420fC9f6508, verified on etherscan.io;
AssetWithManager.sol deployed at 0x8a7F38FB4049e03B1Dc3Fac82208fEbB2530F8fC, verified on etherscan.io;

==================================================


Calls flow: Caller ->
            Anchor.func(...) ->
            AssetWithManager._performFunc(..., Caller.address) ->
            Anchor._forwardFunc(..., Caller.address) ->
            EToken2.proxyFunc(..., symbol, Caller.address)
```

# Contributing ![JS Code Style](https://img.shields.io/badge/js--style-extends--google-green.svg "JS Code Style") ![Solidity Code Style](https://img.shields.io/badge/sol--style-ambisafe-red.svg "Solidity Code Style")

Before commiting anything, install a pre-commit hook:
```
$ cp pre-commit .git/hooks/ && chmod a+x .git/hooks/pre-commit
```

In order to validate consistency of your changes run:
```
$ npm run validate
```

## Code Style

JS: based on Google, though with only single indentations even for arguments.

Solidity: based on solhint default, though with some rules disabled.
