// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";
import {TalentPassSBT} from "../src/TalentPassSBT.sol";
import {AttestationRegistry} from "../src/AttestationRegistry.sol";

/// @notice Despliegue a Arbitrum Sepolia. Ver 01-CONTRACTS-SPEC.md §5.
///
/// El relayer es una wallet unica del backend que paga todo el gas: es el minter
/// del SBT y el issuer del registry. En produccion esto seria un paymaster
/// ERC-4337; para el MVP un relayer simple alcanza y es honesto de explicar.
///
/// Correr con:
///   forge script script/Deploy.s.sol:Deploy \
///     --rpc-url $ARBITRUM_SEPOLIA_RPC --broadcast --verify -vvvv
contract Deploy is Script {
    function run() external {
        uint256 pk = vm.envUint("RELAYER_PRIVATE_KEY");
        address relayer = vm.addr(pk);

        console2.log("Desplegando con el relayer:", relayer);
        console2.log("Balance (wei):", relayer.balance);

        vm.startBroadcast(pk);

        TalentPassSBT pass = new TalentPassSBT(relayer);
        AttestationRegistry registry = new AttestationRegistry();

        // Allowlist del issuer de demo. Sin esto, issueBatch revierte.
        registry.setTrustedIssuer(relayer, true);

        vm.stopBroadcast();

        console2.log("");
        console2.log("Copiar al .env del backend:");
        console2.log("TALENTPASS_ADDRESS=%s", address(pass));
        console2.log("ATTESTATION_REGISTRY_ADDRESS=%s", address(registry));
    }
}
