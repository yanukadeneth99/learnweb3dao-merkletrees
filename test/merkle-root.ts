import { expect } from "chai";
import { ethers } from "hardhat";
import keccak256 from "keccak256";
import MerkleTree from "merkletreejs";

function encodeLeaf(address: string, spots: number) {
  return ethers.utils.defaultAbiCoder.encode(
    ["address", "uint64"],
    [address, spots]
  );
}

describe("Check if merkle root is working", () => {
  it("Should be able to verify if a given address is in whitelist or not", async () => {
    // Get a bunch of test addressess
    const [owner, addr1, addr2, addr3, addr4, addr5] =
      await ethers.getSigners();

    // Create an array of elements you wish to encode in the merkle tree
    const list = [
      encodeLeaf(owner.address, 2),
      encodeLeaf(addr1.address, 2),
      encodeLeaf(addr2.address, 2),
      encodeLeaf(addr3.address, 2),
      encodeLeaf(addr4.address, 2),
      encodeLeaf(addr5.address, 2),
    ];

    // Make the Merkle tree from keccak256 and sort
    const merkleTree = new MerkleTree(list, keccak256, {
      hashLeaves: true,
      sortPairs: true,
    });

    // Compute Merkle Root
    const root = merkleTree.getHexRoot();

    // Deploy the contract
    const Whitelist = await ethers.getContractFactory("Whitelist");
    const whitelist = await Whitelist.deploy(root);
    await whitelist.deployed();

    // Compute Proof of contract owner
    const leaf = keccak256(list[0]);
    const proof = merkleTree.getHexProof(leaf);

    // Testing Contract owner
    let verified = await whitelist.checkInWhitelist(proof, 2);
    expect(verified).to.equal(true);

    // Testing my address to be false
    const leaf2 = keccak256("0x24c7e0dbb21d245e04ff3271bd0624d2d61d4aba");
    const proof2 = merkleTree.getHexProof(leaf2);

    verified = await whitelist.checkInWhitelist(proof2, 2);
    expect(verified).to.equal(false);

    // Testing in another valid address
    const leaf3 = keccak256(list[2]);
    const proof3 = merkleTree.getHexProof(leaf3);

    verified = await whitelist.checkInWhitelist(proof3, 2);
    expect(verified).to.equal(true); // says its false
  });
});
