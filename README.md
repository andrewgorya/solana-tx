# Solana Transactions

This repository provides a set of scripts and utilities for interacting with Solana transactions. It includes functionality for creating, signing, and sending transactions on the Solana blockchain.

## Features
- Generate and manage Solana keypairs
- Create and sign transactions
- Send transactions to the Solana network
- Fetch and decode transaction details
- Support for both mainnet and testnet environments

## Installation

Ensure you have [Node.js](https://nodejs.org/) and [Solana CLI](https://docs.solana.com/cli/install-solana-cli) installed.

```sh
npm install
```

## Usage

### 1. Generate a New Keypair
```sh
node scripts/generateKeypair.js
```
This will create a new Solana keypair and save it as a JSON file.

### 2. Create and Sign a Transaction
```sh
node scripts/createTransaction.js
```
This script constructs and signs a transaction before broadcasting it to the network.

### 3. Send a Transaction
```sh
node scripts/sendTransaction.js
```
This will send a transaction using an existing keypair.

### 4. Fetch and Decode a Transaction
```sh
node scripts/getTransaction.js <TRANSACTION_SIGNATURE>
```
Replace `<TRANSACTION_SIGNATURE>` with an actual transaction signature to retrieve and decode transaction details.

## Configuration

Update the `.env` file with the following variables:

```ini
SOLANA_NETWORK=https://api.mainnet-beta.solana.com  # Change to testnet or devnet if needed
PRIVATE_KEY_PATH=./keypair.json
```

## Dependencies
- [@solana/web3.js](https://github.com/solana-labs/solana-web3.js)
- dotenv
- fs

Install dependencies using:
```sh
npm install
```

## License
This project is licensed under the MIT License.
