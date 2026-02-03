// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./CrowdfundingPro.sol";

contract CrowdfundingFactory {
    struct Projectoview {
        address contractAddress;
        address creator;
        string name;
        uint256 target;
        uint256 deadline;
    }

    Projectoview[] public allProjects;

    event ProjectCreated(address indexed projectAddress, address indexed creator, string name);

    function createProject(
        string memory _name,
        string memory _description,
        uint256 _targetInWei,
        uint256 _days
    ) external {
        // Recibimos el valor ya convertido a Wei desde el frontend
        CrowdfundingPro newProject = new CrowdfundingPro(_name, _description, _targetInWei, _days, msg.sender);

        allProjects.push(
            Projectoview({
                contractAddress: address(newProject),
                creator: msg.sender,
                name: _name,
                target: _targetInWei,
                deadline: block.timestamp + (_days * 1 days)
            })
        );

        emit ProjectCreated(address(newProject), msg.sender, _name);
    }

    function getAllProjects() external view returns (Projectoview[] memory) {
        return allProjects;
    }
}
