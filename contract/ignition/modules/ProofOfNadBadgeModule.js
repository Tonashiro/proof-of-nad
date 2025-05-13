require("dotenv").config();
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("ProofOfNadBadgeModule", (m) => {
  const signer = m.getParameter("signer", process.env.SIGNER_ADDRESS);

  const badge = m.contract("ProofOfNadBadge", [signer]);

  return { badge };
});
