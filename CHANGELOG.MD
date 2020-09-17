# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Fixed
### Added
* Supporting [WaaS 1.6](https://github.com/Tangany/Wallet-as-a-Service/blob/master/CHANGELOG.md#161---2020-08-12):
    * Call arbitrary readonly smart contract methods
    * Sweep Bitcoin wallet
    * Wallet substitution
    * Optional amount argument in all sending Ethereum methods
### Changed
* Universal smart contract methods `sendAsync` and `estimateFee` allow JavaScript values in `inputs` instead of exclusively string encapsulated values

## [1.0.0]
### Fixed
### Added
* Supporting [WaaS 1.5](https://tangany.com/blog/release-notes-1-5/):
  * Options to set custom values for the amount of gas or nonce
  * Fee estimation for Ethereum (including the universal smart contract interface)
  * Explore Ethereum transactions with combinations of predefined filters
  * Explore Ethereum smart contract events
  * Get status information about the Ethereum or Bitcoin full node
* Added `wait` method for asynchronous requests
### Changed

## [1.0.0-beta.9]
### Fixed
* Fixed undefined hash parameter in ethereum transaction status request
### Added
### Changed

## [1.0.0-beta.8]
### Fixed
* Fixed invalid ethereum data string in a failing E2E test
### Added
* Supporting [WaaS 1.4](https://tangany.com/blog/release-notes-1-4/):
  * Ethereum and Bitcoin signing
  * Asynchronous sending and request status
  * Universal Ethereum smart contracts
  * `ethereumGasPrice` & `useGasTank` header
### Changed

## [1.0.0-beta.7]
### Fixed
* Fixed the `Wallet` interface throwing a GeneralError instead of ConflictError on wallet naming conflicts
### Added
* Added [E2E code examples](./test/wallet.e2e.js) for a WaaS Wallet based workflow
### Changed

## [1.0.0-beta.6]
### Fixed
### Added
### Changed
* Renamed the npm package to `@tangany/waas` & deprecated the old package `@tangany/waas-js-sdk`
* Allow omitting all `Waas` arguments and authenticate through environment variables TANGANY_CLIENT_ID`, `TANGANY_CLIENT_SECRET`, `TANGANY_SUBSCRIPTION` & `TANGANY_VAULT_URL`
* 🚨 Breaking: Removed the AxiosResponse layer from all endpoints. All calls now return the HTTP response data instead of the AxiosResponse type
* 🚨 Breaking: Drop support for Node.js below version 8.6

## [1.0.0-beta.5]
### Fixed
* Moved unproductive package (moxios) to devDependencies

## [1.0.0-beta.4]
### Fixed
* Fixed the issue where each daisy-chained subclass of WaaS maintained its own exclusive limiter instance
### Added
* Added methods for fetching affinity cookies
* Added sending data from EthereumWallet
* Added `ethereumTxConfirmations` option
### Changed
* 🚨 Breaking: changed accepted function arguments in `EthErc20Wallet.send`, `EthErc20Wallet.approve`, `EthErc20Wallet.transferFrom`, `EthErc20Wallet.burn` & `EthErc20Wallet.mint` to accept object-type argument matching the style of `BitcoinWallet.send` &`EthereumWallet.send`

## [1.0.0-beta.3]
### Added
* Added an optional versioning parameter to the constructor
* Added an API throttling limiter per WaaS instance to prevent `429 Too Many Request` errors

## [1.0.0-beta.2]
### Fixed
* Removed tests from the build

## [1.0.0-beta.1]
### Fixed
* Removed sinon from dist dependencies

## [1.0.0-beta.0]
### Added
* Added support for WaaS 1.2 (Full release notes in our [Blog post](https://tangany.com/blog/release-notes-1-2/))
  * Bitcoin support
  * Ethereum ERC20 methods `approve`, `transferFrom`, `mint`, `burn`

### Changed
* 🚨 Breaking: changed accepted function arguments in `EthereumWallet.send` to match `BitcoinWallet.send`
* 🚨 Breaking: main export renamed to "Waas"

## [0.1.0]
Initial release for WaaS 1.1
