// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ProofOfNadBadge is ERC721 {
    address public signer;
    uint256 public nextTokenId = 1;

    mapping(address => mapping(uint256 => bool)) public hasMinted;
    mapping(uint256 => string) private _tokenURIs;

    constructor(address _signer) ERC721("ProofOfNadBadge", "PON") {
        signer = _signer;
    }

    function mintBadge(
        uint256 badgeId,
        string memory metadataURI,
        bytes calldata signature
    ) external {
        require(!hasMinted[msg.sender][badgeId], "Already minted");

        bytes32 messageHash = getMessageHash(msg.sender, badgeId, metadataURI);
        require(
            recoverSigner(messageHash, signature) == signer,
            "Invalid signature"
        );

        uint256 tokenId = nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _tokenURIs[tokenId] = metadataURI;
        hasMinted[msg.sender][badgeId] = true;
    }

    function getMessageHash(
        address user,
        uint256 badgeId,
        string memory metadataURI
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(user, badgeId, metadataURI));
    }

    function recoverSigner(
        bytes32 message,
        bytes memory sig
    ) public pure returns (address) {
        bytes32 ethSignedMessage = keccak256(
            abi.encodePacked("\x19Ethereum Signed Message:\n32", message)
        );
        (bytes32 r, bytes32 s, uint8 v) = splitSignature(sig);
        return ecrecover(ethSignedMessage, v, r, s);
    }

    function splitSignature(
        bytes memory sig
    ) internal pure returns (bytes32 r, bytes32 s, uint8 v) {
        require(sig.length == 65, "Invalid signature length");
        assembly {
            r := mload(add(sig, 32))
            s := mload(add(sig, 64))
            v := byte(0, mload(add(sig, 96)))
        }
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        require(
            from == address(0) || to == address(0),
            "Soulbound: non-transferable"
        );
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
}
