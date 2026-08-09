// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/// @title TalentPassSBT
/// @notice SBT (ERC-721 no transferible) que representa la identidad del talento.
///         Uno por persona. Ver 01-CONTRACTS-SPEC.md §2.
/// @dev No se porta a Stylus: es storage puro y Stylus no aporta nada aqui.
contract TalentPassSBT is ERC721 {
    /// @notice wallet => tokenId. 0 significa que no tiene pass.
    mapping(address => uint256) public tokenIdOf;

    /// @notice tokenId => CID de IPFS del perfil publico.
    mapping(uint256 => string) private _tokenURIs;

    uint256 private _nextTokenId;

    /// @notice El relayer del backend. Paga el gas y es el unico que puede acuñar.
    address public minter;

    event TalentPassMinted(address indexed holder, uint256 indexed tokenId, string cid);
    event TalentPassUpdated(uint256 indexed tokenId, string cid);

    error AlreadyHasPass(address holder);
    error SoulboundTransferBlocked();
    error NotMinter();

    modifier onlyMinter() {
        if (msg.sender != minter) revert NotMinter();
        _;
    }

    constructor(address minter_) ERC721("ProofPath TalentPass", "TPASS") {
        minter = minter_;
        _nextTokenId = 1;
    }

    /// @notice Acuña el TalentPass. Revierte si `to` ya tiene uno.
    function mint(address to, string calldata cid) external onlyMinter returns (uint256) {
        if (tokenIdOf[to] != 0) revert AlreadyHasPass(to);

        uint256 tokenId = _nextTokenId++;
        tokenIdOf[to] = tokenId;
        _tokenURIs[tokenId] = cid;

        _safeMint(to, tokenId);
        emit TalentPassMinted(to, tokenId, cid);
        return tokenId;
    }

    /// @notice Actualiza el CID del perfil cuando se le agregan credenciales.
    function setTokenURI(uint256 tokenId, string calldata cid) external onlyMinter {
        _requireOwned(tokenId);
        _tokenURIs[tokenId] = cid;
        emit TalentPassUpdated(tokenId, cid);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        return _tokenURIs[tokenId];
    }

    /// @dev Hook de OZ v5 (no `_beforeTokenTransfer`, que es v4).
    ///      Permite acuñar (`from == 0`) y bloquea todo lo demas: transferencias
    ///      y tambien el burn, que en el MVP se decidio no soportar.
    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (from != address(0)) revert SoulboundTransferBlocked();
        return super._update(to, tokenId, auth);
    }
}
