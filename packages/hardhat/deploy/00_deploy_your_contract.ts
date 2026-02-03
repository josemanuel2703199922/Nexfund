import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { parseEther } from "viem";

const deployCrowdfundingSystem: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // 1. DESPLEGAR LA FACTORY
  // Es el contrato principal que gestionará todo.
  const factory = await deploy("CrowdfundingFactory", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });

  console.log("✅ CrowdfundingFactory desplegada en:", factory.address);

  // 2. DESPLEGAR CONTRATO "SEMILLA" DE CROWDFUNDINGPRO
  // ¿Por qué hacemos esto? 
  // Para que Scaffold-ETH genere automáticamente los Hooks en el Frontend.
  // Sin esto, useScaffoldWriteContract("CrowdfundingPro") no funcionaría.
  await deploy("CrowdfundingPro", {
    from: deployer,
    // Argumentos: Nombre, Descripción, Meta (ETH), Días, Dueño
    args: ["Proyecto Semilla", "Descripción inicial para generar ABI", parseEther("1"), BigInt(30), deployer],
    log: true,
    autoMine: true,
  });

  console.log("✅ ABI de CrowdfundingPro registrado en el Frontend");
};

export default deployCrowdfundingSystem;
deployCrowdfundingSystem.tags = ["CrowdfundingFactory", "CrowdfundingPro"];