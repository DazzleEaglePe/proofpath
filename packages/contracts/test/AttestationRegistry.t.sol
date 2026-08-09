// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AttestationRegistry} from "../src/AttestationRegistry.sol";

contract AttestationRegistryTest is Test {
    AttestationRegistry internal registry;

    address internal issuer = address(0x06);
    address internal intruso = address(0xBAD);

    string internal constant SCHEMA = "proofpath.experience.v1";

    // Arbol de 4 hojas => proof de profundidad 2, que es representativo de un batch real.
    bytes32[4] internal leaves;
    bytes32 internal root;

    bytes32 internal constant HASH_0 = keccak256("credencial-0");
    bytes32 internal constant HASH_1 = keccak256("credencial-1");
    bytes32 internal constant HASH_2 = keccak256("credencial-2");
    bytes32 internal constant HASH_3 = keccak256("credencial-3");

    event BatchIssued(
        uint256 indexed batchId, address indexed issuer, bytes32 merkleRoot, uint32 size, string schemaId
    );

    function setUp() public {
        registry = new AttestationRegistry();
        registry.setTrustedIssuer(issuer, true);

        leaves[0] = registry.leafOf(HASH_0, 1);
        leaves[1] = registry.leafOf(HASH_1, 2);
        leaves[2] = registry.leafOf(HASH_2, 3);
        leaves[3] = registry.leafOf(HASH_3, 4);

        bytes32 n01 = _hashPair(leaves[0], leaves[1]);
        bytes32 n23 = _hashPair(leaves[2], leaves[3]);
        root = _hashPair(n01, n23);
    }

    /// @dev Ordenamiento de pares por valor, igual que OZ MerkleProof y que
    ///      `merkletreejs` con `sortPairs: true`. Si el backend usa otra convencion,
    ///      el proof no cuadra.
    function _hashPair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }

    /// @dev Proof de la hoja 0: su hermana y el subarbol derecho.
    function _proofForLeaf0() internal view returns (bytes32[] memory proof) {
        proof = new bytes32[](2);
        proof[0] = leaves[1];
        proof[1] = _hashPair(leaves[2], leaves[3]);
    }

    function _issue() internal returns (uint256 batchId) {
        vm.prank(issuer);
        batchId = registry.issueBatch(root, 4, SCHEMA);
    }

    function test_IssueBatch_EmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit BatchIssued(1, issuer, root, 4, SCHEMA);

        vm.prank(issuer);
        uint256 batchId = registry.issueBatch(root, 4, SCHEMA);

        assertEq(batchId, 1, "el primer batchId arranca en 1");

        AttestationRegistry.Batch memory b = registry.getBatch(batchId);
        assertEq(b.issuer, issuer);
        assertEq(b.merkleRoot, root);
        assertEq(b.size, 4);
        assertEq(b.schemaId, SCHEMA);
    }

    function test_VerifyProof_ValidProofReturnsTrue() public {
        uint256 batchId = _issue();
        assertTrue(registry.verifyProof(batchId, HASH_0, 1, _proofForLeaf0()));
    }

    function test_VerifyProof_RevokedReturnsFalse() public {
        uint256 batchId = _issue();
        assertTrue(registry.verifyProof(batchId, HASH_0, 1, _proofForLeaf0()), "valida antes de revocar");

        vm.prank(issuer);
        registry.revoke(HASH_0);

        assertFalse(registry.verifyProof(batchId, HASH_0, 1, _proofForLeaf0()), "revocada => false");
    }

    function test_VerifyProof_ProofInvalidoDevuelveFalseSinRevertir() public {
        uint256 batchId = _issue();

        // Mismo proof pero con el tokenId equivocado: la hoja cambia y no pertenece.
        assertFalse(registry.verifyProof(batchId, HASH_0, 999, _proofForLeaf0()));

        // Batch que no existe.
        assertFalse(registry.verifyProof(42, HASH_0, 1, _proofForLeaf0()));
    }

    function test_IssueBatch_RevertsIfNotTrusted() public {
        vm.prank(intruso);
        vm.expectRevert(abi.encodeWithSelector(AttestationRegistry.NotTrustedIssuer.selector, intruso));
        registry.issueBatch(root, 4, SCHEMA);
    }

    function test_IssueBatch_RevertsIfEmpty() public {
        vm.prank(issuer);
        vm.expectRevert(AttestationRegistry.EmptyBatch.selector);
        registry.issueBatch(root, 0, SCHEMA);
    }

    /// @dev Imprime las hojas, el root y el proof de la hoja 0 para fijarlos como
    ///      constantes en merkle.test.ts del paquete shared. Es el cruce
    ///      entre el contrato y el backend: si el TypeScript no reproduce estos
    ///      valores exactos, la verificacion falla en silencio.
    ///      Correr con: forge test --match-test test_ExportarFixtures -vv
    function test_ExportarFixturesParaElBackend() public {
        emit log_named_bytes32("leaf0", leaves[0]);
        emit log_named_bytes32("leaf1", leaves[1]);
        emit log_named_bytes32("leaf2", leaves[2]);
        emit log_named_bytes32("leaf3", leaves[3]);
        emit log_named_bytes32("root", root);

        bytes32[] memory proof = _proofForLeaf0();
        emit log_named_bytes32("proof0[0]", proof[0]);
        emit log_named_bytes32("proof0[1]", proof[1]);
    }

    /// @dev El doble hash separa el dominio de hojas del de nodos internos. Sin el,
    ///      un nodo interno podria presentarse como hoja valida (segunda preimagen).
    function test_LeafOf_DobleHashSeparaDominios() public view {
        bytes32 simple = keccak256(abi.encodePacked(HASH_0, uint256(1)));
        assertTrue(registry.leafOf(HASH_0, 1) != simple, "la hoja no puede ser el hash simple");
        assertEq(registry.leafOf(HASH_0, 1), keccak256(bytes.concat(simple)));
    }
}
