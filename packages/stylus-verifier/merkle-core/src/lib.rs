//! Logica pura de Merkle, sin nada de Stylus.
//!
//! Vive en su propio crate por dos razones:
//!
//! 1. **Se puede testear en nativo.** El crate del contrato arrastra la SDK de
//!    Stylus, que en macOS no enlaza fuera de la VM de WASM — el template oficial
//!    de `cargo stylus new` falla igual, asi que es un problema aguas arriba y no
//!    de este proyecto. Separando la logica, los tests corren igual.
//! 2. **Es la parte que hay que cruzar.** Estas tres funciones tienen que dar
//!    exactamente lo mismo que `AttestationRegistry.sol` y que
//!    `packages/shared/src/merkle.ts`. Si divergen, el benchmark compara dos
//!    cosas distintas, que es peor que no tener benchmark.

#![no_std]

use tiny_keccak::{Hasher, Keccak};

pub type Word = [u8; 32];

pub fn keccak256(datos: &[u8]) -> Word {
    let mut hasher = Keccak::v256();
    let mut salida = [0u8; 32];
    hasher.update(datos);
    hasher.finalize(&mut salida);
    salida
}

/// hoja = keccak256(keccak256(abi.encodePacked(credentialHash, subjectTokenId)))
///
/// El doble hash es deliberado: `abi.encodePacked(bytes32, uint256)` da 64 bytes,
/// el mismo tamaño que el preimage de un nodo interno, asi que con un solo hash
/// un nodo interno podria hacerse pasar por hoja (segunda preimagen).
pub fn leaf_of(credential_hash: &Word, subject_token_id: &Word) -> Word {
    let mut packed = [0u8; 64];
    packed[..32].copy_from_slice(credential_hash);
    packed[32..].copy_from_slice(subject_token_id);
    keccak256(&keccak256(&packed))
}

/// Ordenamiento de pares por valor, igual que `MerkleProof` de OpenZeppelin y que
/// `merkletreejs` con `sortPairs: true`. Asi el proof no carga flags de posicion.
pub fn hash_pair(a: &Word, b: &Word) -> Word {
    let mut concatenado = [0u8; 64];
    if a <= b {
        concatenado[..32].copy_from_slice(a);
        concatenado[32..].copy_from_slice(b);
    } else {
        concatenado[..32].copy_from_slice(b);
        concatenado[32..].copy_from_slice(a);
    }
    keccak256(&concatenado)
}

/// Verifica pertenencia al arbol. Devuelve `false` en vez de entrar en panico:
/// el llamador necesita distinguir estados, no capturar fallos.
pub fn verify_proof(root: &Word, leaf: &Word, proof: &[Word]) -> bool {
    let mut computado = *leaf;
    for nodo in proof {
        computado = hash_pair(&computado, nodo);
    }
    computado == *root
}

/// Codifica un u64 como uint256 big-endian de 32 bytes, que es como el contrato
/// recibe el `subjectTokenId`.
pub fn u256_from_u64(valor: u64) -> Word {
    let mut palabra = [0u8; 32];
    palabra[24..].copy_from_slice(&valor.to_be_bytes());
    palabra
}

#[cfg(test)]
mod tests {
    extern crate alloc;
    use super::*;
    use alloc::format;
    use alloc::string::String;
    use alloc::vec::Vec;

    fn hex_de(bytes: &Word) -> String {
        bytes.iter().map(|b| format!("{b:02x}")).collect()
    }

    fn hojas_de_prueba() -> Vec<Word> {
        (0..4)
            .map(|i| {
                let credential_hash = keccak256(format!("credencial-{i}").as_bytes());
                leaf_of(&credential_hash, &u256_from_u64((i + 1) as u64))
            })
            .collect()
    }

    /// Los valores salieron de `AttestationRegistry.leafOf` ejecutandose dentro de
    /// la EVM (`forge test --match-test test_ExportarFixtures -vv`), no de este
    /// codigo. Son los mismos que fija `packages/shared/src/merkle.test.ts`.
    #[test]
    fn reproduce_las_hojas_del_contrato_solidity() {
        let esperadas = [
            "cd03dab8748b80c87df45d98a898d953489af4772b32f9056a36c01b40f76480",
            "397a6aef30d57267f59c10c429d19bafc4988d485683e3dd5232a7fb503e5da8",
            "170aedbfd233385ec491867f1d44206e4e4897df7bc0cde9151a2c5ef690cd3c",
            "82e84cfddb87b0523c270c0e792159a94a18338fc8182c3dc0b341cc0a33dc80",
        ];

        for (i, (obtenida, esperada)) in hojas_de_prueba().iter().zip(esperadas).enumerate() {
            assert_eq!(hex_de(obtenida), esperada, "hoja {i}");
        }
    }

    #[test]
    fn el_root_coincide_con_el_del_contrato() {
        let h = hojas_de_prueba();
        let root = hash_pair(&hash_pair(&h[0], &h[1]), &hash_pair(&h[2], &h[3]));

        assert_eq!(
            hex_de(&root),
            "33dc04dfa7f2690347fc99bf26b5876276550457d06d4fc1a4e0b6c033ca7a32"
        );
    }

    #[test]
    fn el_proof_de_la_hoja_0_es_el_que_espera_el_contrato() {
        let h = hojas_de_prueba();
        let proof = [h[1], hash_pair(&h[2], &h[3])];

        assert_eq!(
            hex_de(&proof[0]),
            "397a6aef30d57267f59c10c429d19bafc4988d485683e3dd5232a7fb503e5da8"
        );
        assert_eq!(
            hex_de(&proof[1]),
            "0d2fe56c892d722b60bd81bca012cbcc506bb8fe8b32be8aa1ece3ef91ac8bc4"
        );
    }

    #[test]
    fn un_proof_valido_verifica_y_uno_alterado_no() {
        let h = hojas_de_prueba();
        let root = hash_pair(&hash_pair(&h[0], &h[1]), &hash_pair(&h[2], &h[3]));
        let proof = [h[1], hash_pair(&h[2], &h[3])];

        assert!(verify_proof(&root, &h[0], &proof));

        let intrusa = leaf_of(&keccak256(b"credencial-falsa"), &u256_from_u64(1));
        assert!(!verify_proof(&root, &intrusa, &proof));
    }

    #[test]
    fn el_tokenid_equivocado_da_otra_hoja() {
        let credential_hash = keccak256(b"credencial-0");
        let correcta = leaf_of(&credential_hash, &u256_from_u64(1));
        let equivocada = leaf_of(&credential_hash, &u256_from_u64(999));

        assert_ne!(correcta, equivocada);
    }

    #[test]
    fn el_doble_hash_separa_dominios() {
        let credential_hash = keccak256(b"credencial-0");
        let token_id = u256_from_u64(1);

        let mut packed = [0u8; 64];
        packed[..32].copy_from_slice(&credential_hash);
        packed[32..].copy_from_slice(&token_id);
        let hash_simple = keccak256(&packed);

        // Sin el doble hash, un nodo interno podria presentarse como hoja valida.
        assert_ne!(leaf_of(&credential_hash, &token_id), hash_simple);
        assert_eq!(leaf_of(&credential_hash, &token_id), keccak256(&hash_simple));
    }
}
