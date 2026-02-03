import { expect } from "chai";
import { ethers } from "hardhat";

describe("Crowdfunding Pro - Sistema de Transparencia", function () {
  let factory: any;
  let owner: any;
  let donor: any;

  beforeEach(async () => {
    // owner será quien cree el proyecto a través de la factory
    [owner, donor] = await ethers.getSigners();
    const FactoryContract = await ethers.getContractFactory("CrowdfundingFactory");
    factory = await FactoryContract.deploy();
    await factory.waitForDeployment();
  });

  it("Debería permitir al creador retirar fondos justificadamente tras alcanzar la meta", async function () {
    // 1. Crear proyecto (Meta: 1 ETH)
    await factory.connect(owner).createProject("Donation Platform", "Seguimiento de fondos", 1n, 30n);
    const projects = await factory.getAllProjects();
    const projectAddress = projects[0].contractAddress;
    const project = await ethers.getContractAt("CrowdfundingPro", projectAddress);

    // 2. Donante contribuye 1.5 ETH (Supera la meta de 1 ETH)
    await project.connect(donor).contribute({ value: ethers.parseEther("1.5") });

    // Verificamos que el balance del contrato sea 1.5 ETH
    const balanceContrato = await ethers.provider.getBalance(projectAddress);
    expect(balanceContrato).to.equal(ethers.parseEther("1.5"));

    // 3. Intento de retiro: El dueño retira para un gasto específico
    const razonRetiro = "Pago de hosting y dominio .eth";
    const montoRetiro = ethers.parseEther("0.4");

    // Guardamos el balance del dueño antes del retiro para comparar
    const balanceOwnerAntes = await ethers.provider.getBalance(owner.address);

    // Ejecutar retiro
    const tx = await project.connect(owner).withdrawFunds(razonRetiro, montoRetiro);
    await tx.wait();

    // 4. VERIFICACIONES DE TRANSPARENCIA

    // A. Verificar historial en el contrato
    const historial = await project.getWithdrawalHistory();
    expect(historial.length).to.equal(1);
    expect(historial[0].reason).to.equal(razonRetiro);
    expect(historial[0].amount).to.equal(montoRetiro);
    expect(historial[0].timestamp).to.be.gt(0); // Debe tener una fecha válida

    // B. Verificar que el dinero llegó a la billetera del dueño
    const balanceOwnerDespues = await ethers.provider.getBalance(owner.address);
    // Debe ser mayor que antes (menos el gas de la transacción)
    expect(balanceOwnerDespues).to.be.gt(balanceOwnerAntes);

    console.log("✅ Meta alcanzada verificada");
    console.log("✅ Historial de seguimiento guardado:", historial[0].reason);
    console.log("✅ Transferencia de fondos exitosa al dueño");
  });

  it("Debería fallar si alguien que no es el dueño intenta retirar", async function () {
    await factory.createProject("Proyecto Fallido", "Test de seguridad", 1n, 30n);
    const projects = await factory.getAllProjects();
    const project = await ethers.getContractAt("CrowdfundingPro", projects[0].contractAddress);

    // Donar para que haya balance
    await project.connect(donor).contribute({ value: ethers.parseEther("1.1") });

    // El donante intenta retirar fondos (debe dar error)
    await expect(project.connect(donor).withdrawFunds("Robo de fondos", ethers.parseEther("0.1"))).to.be.revertedWith(
      "No eres el dueno",
    );

    console.log("✅ Seguridad de roles verificada: Solo el dueño puede retirar");
  });
});
