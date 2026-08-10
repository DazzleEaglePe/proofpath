// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AttestationRegistry} from "./AttestationRegistry.sol";

/// @title GasBenchmark
/// @notice Envoltorio para medir el gas de la verificacion — 01-CONTRACTS-SPEC.md §4.
///
/// @dev POR QUE EXISTE ESTE CONTRATO:
///
///      `verifyProof` es `view`, y de una llamada `view` no se puede medir gas
///      real: no genera transaccion. Comparar un gas snapshot local de Foundry
///      contra una transaccion de Stylus en Sepolia seria comparar peras con
///      manzanas, y un jurado tecnico lo nota.
///
///      Este envoltorio escribe el resultado en storage, con lo que la llamada
///      pasa a ser una transaccion real y medible. Se despliega uno equivalente
///      apuntando al verificador Stylus, se ejecuta la MISMA verificacion con la
///      MISMA profundidad de proof en la MISMA red, y se comparan los dos
///      recibos.
///
///      El costo del SSTORE aparece en las dos mediciones, asi que se cancela en
///      la comparacion.
contract GasBenchmark {
    AttestationRegistry public immutable registry;

    /// Se escribe para forzar una transaccion real. El valor no interesa.
    bool public ultimoResultado;
    uint256 public corridas;

    constructor(address registry_) {
        registry = AttestationRegistry(registry_);
    }

    function medirSolidity(
        uint256 batchId,
        bytes32 credentialHash,
        uint256 subjectTokenId,
        bytes32[] calldata proof
    ) external {
        ultimoResultado = registry.verifyProof(batchId, credentialHash, subjectTokenId, proof);
        corridas++;
    }
}

/// @notice Mismo envoltorio, pero contra el verificador Stylus.
/// @dev Los contratos Stylus son interoperables con EVM: se los llama por
///      interfaz como a cualquier contrato. Esto se usa SOLO para el benchmark;
///      `AttestationRegistry` no llama al verificador Stylus en produccion
///      (01-CONTRACTS-SPEC §4: mantenerlos independientes).
interface IStylusVerifier {
    function verifyCredential(
        bytes32 root,
        bytes32 credentialHash,
        uint256 subjectTokenId,
        bytes32[] calldata proof
    ) external view returns (bool);
}

contract GasBenchmarkStylus {
    IStylusVerifier public immutable verifier;

    bool public ultimoResultado;
    uint256 public corridas;

    constructor(address verifier_) {
        verifier = IStylusVerifier(verifier_);
    }

    function medirStylus(
        bytes32 root,
        bytes32 credentialHash,
        uint256 subjectTokenId,
        bytes32[] calldata proof
    ) external {
        ultimoResultado = verifier.verifyCredential(root, credentialHash, subjectTokenId, proof);
        corridas++;
    }
}
