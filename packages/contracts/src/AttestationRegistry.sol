// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title AttestationRegistry
/// @notice El corazon del sistema. Una ONG cierra un programa con N voluntarios y
///         emite las N credenciales en UNA sola transaccion publicando el Merkle
///         root. Cada joven prueba la suya con un Merkle proof.
///         Ver 01-CONTRACTS-SPEC.md §3.
contract AttestationRegistry {
    struct Batch {
        address issuer;
        bytes32 merkleRoot;
        uint64 issuedAt;
        uint32 size; // cantidad de credenciales, afirmada por el issuer
        string schemaId; // ej. "proofpath.experience.v1"
    }

    mapping(uint256 => Batch) public batches;

    /// @notice credentialHash => revocada. La revocacion es global, no por batch.
    mapping(bytes32 => bool) public revoked;

    /// @notice Allowlist de issuers. Sustituye al IssuerRegistry para reducir
    ///         superficie de despliegue y testing.
    mapping(address => bool) public trustedIssuers;

    uint256 public nextBatchId;
    address public owner;

    event BatchIssued(
        uint256 indexed batchId, address indexed issuer, bytes32 merkleRoot, uint32 size, string schemaId
    );
    event CredentialRevoked(bytes32 indexed credentialHash, address indexed issuer);
    event TrustedIssuerSet(address indexed issuer, bool trusted);

    error NotTrustedIssuer(address caller);
    error NotOwner();
    error EmptyBatch();
    error BatchNotFound(uint256 batchId);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlyTrustedIssuer() {
        if (!trustedIssuers[msg.sender]) revert NotTrustedIssuer(msg.sender);
        _;
    }

    constructor() {
        owner = msg.sender;
        nextBatchId = 1;
    }

    function setTrustedIssuer(address issuer, bool trusted) external onlyOwner {
        trustedIssuers[issuer] = trusted;
        emit TrustedIssuerSet(issuer, trusted);
    }

    /// @notice Registra un batch completo en una sola tx. `BatchIssued` es el evento
    ///         que se muestra en Arbiscan durante la demo: ver `size` ahi es el momento
    ///         de impacto del pitch.
    function issueBatch(bytes32 root, uint32 size, string calldata schemaId)
        external
        onlyTrustedIssuer
        returns (uint256)
    {
        if (size == 0) revert EmptyBatch();

        uint256 batchId = nextBatchId++;
        batches[batchId] = Batch({
            issuer: msg.sender,
            merkleRoot: root,
            issuedAt: uint64(block.timestamp),
            size: size,
            schemaId: schemaId
        });

        emit BatchIssued(batchId, msg.sender, root, size, schemaId);
        return batchId;
    }

    function revoke(bytes32 credentialHash) external onlyTrustedIssuer {
        revoked[credentialHash] = true;
        emit CredentialRevoked(credentialHash, msg.sender);
    }

    /// @notice Construccion de la hoja del Merkle. DEFINICION NORMATIVA: el backend
    ///         debe producir exactamente esto o la verificacion falla en silencio.
    /// @dev Doble hash a proposito. `abi.encodePacked(bytes32, uint256)` da 64 bytes,
    ///      el mismo tamaño que el preimage de un nodo interno: con un solo hash, un
    ///      nodo interno podria hacerse pasar por hoja (segunda preimagen). Hashear
    ///      dos veces separa los dominios.
    ///      `subjectTokenId` va como uint256 de 32 bytes, nunca como string.
    function leafOf(bytes32 credentialHash, uint256 subjectTokenId) public pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encodePacked(credentialHash, subjectTokenId))));
    }

    /// @notice Verifica pertenencia al batch Y que la credencial no este revocada.
    /// @dev Devuelve `false` en vez de revertir: el front necesita distinguir estados,
    ///      no capturar excepciones.
    function verifyProof(uint256 batchId, bytes32 credentialHash, uint256 subjectTokenId, bytes32[] calldata proof)
        external
        view
        returns (bool)
    {
        if (revoked[credentialHash]) return false;

        bytes32 root = batches[batchId].merkleRoot;
        if (root == bytes32(0)) return false; // batch inexistente

        return MerkleProof.verify(proof, root, leafOf(credentialHash, subjectTokenId));
    }

    /// @notice Lectura del batch que si revierte, para cuando el llamador necesita
    ///         distinguir "no existe" de "existe vacio".
    function getBatch(uint256 batchId) external view returns (Batch memory) {
        Batch memory b = batches[batchId];
        if (b.issuer == address(0)) revert BatchNotFound(batchId);
        return b;
    }
}
