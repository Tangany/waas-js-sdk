# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
### Fixed
### Added 

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
