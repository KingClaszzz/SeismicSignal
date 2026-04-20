// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "./common/Ownable.sol";

contract SeismicProjectRegistry is Ownable {
    enum ProjectStatus {
        NONE,
        PENDING,
        APPROVED,
        FEATURED,
        REJECTED,
        ARCHIVED
    }

    struct Project {
        uint256 id;
        address submitter;
        string name;
        string slug;
        string category;
        string appUrl;
        string metadataURI;
        ProjectStatus status;
        uint64 createdAt;
        uint64 updatedAt;
    }

    uint256 public nextProjectId = 1;

    mapping(uint256 => Project) private projects;
    mapping(bytes32 => uint256) public projectIdBySlugHash;

    error EmptyField(string field);
    error InvalidProjectId();
    error SlugAlreadyExists();
    error UnauthorizedProjectEditor();

    event ProjectSubmitted(uint256 indexed projectId, address indexed submitter, string slug);
    event ProjectUpdated(uint256 indexed projectId, string appUrl, string metadataURI);
    event ProjectStatusChanged(uint256 indexed projectId, ProjectStatus status);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function submitProject(
        string calldata name,
        string calldata slug,
        string calldata category,
        string calldata appUrl,
        string calldata metadataURI
    ) external returns (uint256 projectId) {
        _requireNonEmpty(name, "name");
        _requireNonEmpty(slug, "slug");
        _requireNonEmpty(category, "category");
        _requireNonEmpty(appUrl, "appUrl");
        _requireNonEmpty(metadataURI, "metadataURI");

        bytes32 slugHash = keccak256(bytes(slug));
        if (projectIdBySlugHash[slugHash] != 0) revert SlugAlreadyExists();

        projectId = nextProjectId++;
        uint64 nowTs = uint64(block.timestamp);

        projects[projectId] = Project({
            id: projectId,
            submitter: msg.sender,
            name: name,
            slug: slug,
            category: category,
            appUrl: appUrl,
            metadataURI: metadataURI,
            status: ProjectStatus.PENDING,
            createdAt: nowTs,
            updatedAt: nowTs
        });

        projectIdBySlugHash[slugHash] = projectId;

        emit ProjectSubmitted(projectId, msg.sender, slug);
    }

    function updateProject(
        uint256 projectId,
        string calldata appUrl,
        string calldata metadataURI
    ) external {
        if (!exists(projectId)) revert InvalidProjectId();
        if (!_canEdit(projectId, msg.sender)) revert UnauthorizedProjectEditor();
        _requireNonEmpty(appUrl, "appUrl");
        _requireNonEmpty(metadataURI, "metadataURI");

        Project storage project = projects[projectId];
        project.appUrl = appUrl;
        project.metadataURI = metadataURI;
        project.updatedAt = uint64(block.timestamp);

        emit ProjectUpdated(projectId, appUrl, metadataURI);
    }

    function setProjectStatus(uint256 projectId, ProjectStatus newStatus) external onlyOwner {
        if (!exists(projectId)) revert InvalidProjectId();

        Project storage project = projects[projectId];
        project.status = newStatus;
        project.updatedAt = uint64(block.timestamp);

        emit ProjectStatusChanged(projectId, newStatus);
    }

    function getProject(uint256 projectId) external view returns (Project memory) {
        if (!exists(projectId)) revert InvalidProjectId();
        return projects[projectId];
    }

    function exists(uint256 projectId) public view returns (bool) {
        return projects[projectId].id != 0;
    }

    function _canEdit(uint256 projectId, address editor) internal view returns (bool) {
        return editor == owner || editor == projects[projectId].submitter;
    }

    function _requireNonEmpty(string calldata value, string memory field) internal pure {
        if (bytes(value).length == 0) revert EmptyField(field);
    }
}

