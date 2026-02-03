import * as dotenv from "dotenv";
dotenv.config();
import { Wallet } from "ethers";
import password from "@inquirer/password";
import { spawn } from "child_process";
import { config } from "hardhat";

/**
 * Unencrypts the private key and runs the hardhat deploy command
 */
async function main() {
  const networkIndex = process.argv.indexOf("--network");
  const networkName = networkIndex !== -1 ? process.argv[networkIndex + 1] : config.defaultNetwork;

  if (networkName === "localhost" || networkName === "hardhat") {
    // Deploy command on the localhost network
    const hardhat = spawn("hardhat", ["deploy", ...process.argv.slice(2)], {
      stdio: "inherit",
      env: process.env,
      shell: process.platform === "win32",
    });

    hardhat.on("exit", code => {
      process.exit(code || 0);
    });
    return;
  }

  const encryptedKey = process.env.DEPLOYER_PRIVATE_KEY_ENCRYPTED;
  const privateKey = process.env.DEPLOYER_PRIVATE_KEY;

  if (privateKey) {
    process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY = privateKey;
  } else if (encryptedKey) {
    const pass = await password({ message: "Enter password to decrypt private key:" });

    try {
      const wallet = await Wallet.fromEncryptedJson(encryptedKey, pass);
      process.env.__RUNTIME_DEPLOYER_PRIVATE_KEY = wallet.privateKey;
    } catch (e) {
      console.error("Failed to decrypt private key. Wrong password?");
      process.exit(1);
    }
  } else {
    console.log("🚫️ You don't have a deployer account. Run `yarn generate` or `yarn account:import` first");
    return;
  }

  const hardhat = spawn("hardhat", ["deploy", ...process.argv.slice(2)], {
    stdio: "inherit",
    env: process.env,
    shell: process.platform === "win32",
  });

  hardhat.on("exit", code => {
    process.exit(code || 0);
  });
}

main().catch(console.error);
