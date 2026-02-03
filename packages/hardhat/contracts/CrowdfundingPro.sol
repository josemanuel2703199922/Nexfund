// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract CrowdfundingPro is ERC721 {
    using Strings for uint256;

    enum Tier {
        Ninguno,
        Bronce,
        Plata,
        Oro
    }

    struct Withdrawal {
        string reason;
        uint256 amount;
        uint256 timestamp;
    }

    Withdrawal[] public withdrawalHistory;

    string public projectName;
    string public description;
    address public immutable owner;
    uint256 public immutable target;
    uint256 public immutable deadline;
    uint256 public totalRaised;

    mapping(address => uint256) public contributions;
    mapping(address => Tier) public donorTier;
    mapping(address => uint256) public userNFT;
    mapping(uint256 => Tier) public tokenTier;
    uint256 private _tokenIdCounter = 1;

    event ContributionReceived(address indexed contributor, uint256 amount, Tier tier);
    event RefundClaimed(address indexed donor, uint256 amount);

    constructor(
        string memory _name,
        string memory _description,
        uint256 _target,
        uint256 _days,
        address _realCreator
    ) ERC721("NexFundMedal", "NFMDL") {
        projectName = _name;
        description = _description;
        owner = _realCreator;
        target = _target;
        deadline = block.timestamp + (_days * 1 days);
    }

    function contribute() external payable {
        require(block.timestamp < deadline, "Finalizada");
        require(msg.value > 0, "Envia algo de ETH");

        contributions[msg.sender] += msg.value;
        totalRaised += msg.value;

        Tier currentTier = Tier.Ninguno;
        if (contributions[msg.sender] >= 0.1 ether) currentTier = Tier.Oro;
        else if (contributions[msg.sender] >= 0.01 ether) currentTier = Tier.Plata;
        else if (contributions[msg.sender] >= 0.001 ether) currentTier = Tier.Bronce;

        donorTier[msg.sender] = currentTier;
        emit ContributionReceived(msg.sender, msg.value, currentTier);
    }

    function claimNFT() external {
        require(donorTier[msg.sender] != Tier.Ninguno, "Debes donar primero para reclamar");
        require(userNFT[msg.sender] == 0, "Ya tienes uno");

        uint256 tokenId = _tokenIdCounter++;
        _safeMint(msg.sender, tokenId);
        userNFT[msg.sender] = tokenId;
        tokenTier[tokenId] = donorTier[msg.sender];
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "No existe el token");

        Tier tier = tokenTier[tokenId];
        string memory tierName;
        string memory gradStart;
        string memory gradEnd;
        string memory threshold;
        string memory rank;

        if (tier == Tier.Oro) {
            tierName = "ORO";
            gradStart = "#FFF7AD";
            gradEnd = "#B8860B";
            threshold = "0.1 ETH";
            rank = "1";
        } else if (tier == Tier.Plata) {
            tierName = "PLATA";
            gradStart = "#FFFFFF";
            gradEnd = "#808080";
            threshold = "0.01 ETH";
            rank = "2";
        } else {
            tierName = "BRONCE";
            gradStart = "#E2A76F";
            gradEnd = "#8B4513";
            threshold = "0.001 ETH";
            rank = "3";
        }

        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
                "<defs>",
                '<linearGradient id="medalGrad" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" style="stop-color:',
                gradStart,
                '" />',
                '<stop offset="100%" style="stop-color:',
                gradEnd,
                '" />',
                "</linearGradient>",
                "</defs>",
                '<path d="M150 0 L200 120 L250 0 H220 L200 60 L180 0 Z" fill="#4B5563" stroke="#000" stroke-width="2"/>', // Ribbon
                '<circle cx="200" cy="210" r="95" fill="rgba(0,0,0,0.1)"/>', // Outer shadow
                '<circle cx="200" cy="210" r="90" fill="url(#medalGrad)" stroke="#000" stroke-width="6"/>', // Main medal
                '<circle cx="200" cy="210" r="80" fill="none" stroke="rgba(255,255,255,0.4)" stroke-width="4"/>', // Bevel effect
                '<text x="200" y="240" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="90" fill="rgba(0,0,0,0.7)">',
                rank,
                "</text>", // Rank number
                '<text x="200" y="340" text-anchor="middle" font-family="Arial,sans-serif" font-weight="900" font-size="18" fill="#000" style="text-transform:uppercase">MEDALLA ',
                tierName,
                "</text>",
                '<text x="200" y="365" text-anchor="middle" font-family="Arial,sans-serif" font-weight="bold" font-size="11" fill="rgba(0,0,0,0.5)">',
                projectName,
                "</text>",
                "</svg>"
            )
        );

        string memory json = Base64.encode(
            bytes(
                string(
                    abi.encodePacked(
                        '{"name": "Medalla ',
                        tierName,
                        ": ",
                        projectName,
                        '", ',
                        '"description": "Otorgado por donar ',
                        threshold,
                        ' o mas", ',
                        '"image": "data:image/svg+xml;base64,',
                        Base64.encode(bytes(svg)),
                        '"}'
                    )
                )
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", json));
    }

    function claimRefund() external {
        require(block.timestamp >= deadline, "Campana en curso");
        require(totalRaised < target, "Meta alcanzada");
        uint256 amount = contributions[msg.sender];
        require(amount > 0, "No hay fondos");
        contributions[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{ value: amount }("");
        require(success, "Fallo el reembolso");
        emit RefundClaimed(msg.sender, amount);
    }

    function withdrawFunds(string memory _reason, uint256 _amount) external {
        require(msg.sender == owner, "No eres el dueno");
        require(totalRaised >= target, "Meta no alcanzada");
        require(_amount <= address(this).balance, "Saldo insuficiente");
        withdrawalHistory.push(Withdrawal({ reason: _reason, amount: _amount, timestamp: block.timestamp }));
        (bool success, ) = payable(owner).call{ value: _amount }("");
        require(success, "Fallo el retiro");
    }

    function getWithdrawalHistory() external view returns (Withdrawal[] memory) {
        return withdrawalHistory;
    }
}
