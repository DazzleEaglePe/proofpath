//! Verificacion de Merkle proofs en Stylus — 01-CONTRACTS-SPEC.md §4.
//!
//! **Alcance: solo la verificacion. Nada mas.**
//!
//! Es la pieza mas pequeña y autocontenida del sistema: sin estandares que
//! respetar, sin storage, y es hashing puro — exactamente donde Stylus le gana a
//! Solidity, porque el hashing es compute-bound.
//!
//! Este archivo es solo la cascara ABI. La logica vive en el crate `merkle-core`,
//! que no depende de la SDK y por eso se puede testear en nativo: alli estan los
//! tests que cruzan estos valores contra `AttestationRegistry.sol` y contra
//! `packages/shared/src/merkle.ts`.
//!
//! El contrato NO se integra con `AttestationRegistry` (01-CONTRACTS-SPEC §4):
//! se mantienen independientes y se comparan off-chain. Integrarlos añade riesgo
//! sin ganar puntos.

// `test` entra en la excepcion a proposito: sin eso, el binario de tests nativo
// no tiene `main` y el linker de macOS falla buscando los simbolos del host WASM.
#![cfg_attr(not(any(test, feature = "export-abi")), no_main)]
extern crate alloc;

use alloc::vec::Vec;
use merkle_core::{leaf_of, verify_proof, Word};
use stylus_sdk::{
    alloy_primitives::{FixedBytes, U256},
    prelude::*,
};

#[storage]
#[entrypoint]
pub struct ProofPathVerifier;

#[public]
impl ProofPathVerifier {
    /// Construccion de la hoja. Espejo exacto de `AttestationRegistry.leafOf`.
    pub fn leaf_of(
        &self,
        credential_hash: FixedBytes<32>,
        subject_token_id: U256,
    ) -> FixedBytes<32> {
        FixedBytes::from(leaf_of(
            &palabra(credential_hash),
            &subject_token_id.to_be_bytes::<32>(),
        ))
    }

    /// Verifica que la hoja pertenezca al arbol del `root`.
    ///
    /// Devuelve `false` en vez de revertir, igual que la version en Solidity: el
    /// llamador necesita distinguir estados, no capturar excepciones.
    pub fn verify_proof(
        &self,
        root: FixedBytes<32>,
        leaf: FixedBytes<32>,
        proof: Vec<FixedBytes<32>>,
    ) -> bool {
        let nodos: Vec<Word> = proof.into_iter().map(palabra).collect();
        verify_proof(&palabra(root), &palabra(leaf), &nodos)
    }

    /// Camino completo desde la credencial: arma la hoja y verifica el proof.
    ///
    /// Es la firma que se mide contra `AttestationRegistry.verifyProof` para el
    /// benchmark de gas, porque hace exactamente el mismo trabajo.
    pub fn verify_credential(
        &self,
        root: FixedBytes<32>,
        credential_hash: FixedBytes<32>,
        subject_token_id: U256,
        proof: Vec<FixedBytes<32>>,
    ) -> bool {
        let hoja = leaf_of(
            &palabra(credential_hash),
            &subject_token_id.to_be_bytes::<32>(),
        );
        let nodos: Vec<Word> = proof.into_iter().map(palabra).collect();
        verify_proof(&palabra(root), &hoja, &nodos)
    }
}

fn palabra(valor: FixedBytes<32>) -> Word {
    valor.into()
}
