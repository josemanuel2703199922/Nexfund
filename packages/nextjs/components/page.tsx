"use client";

import { useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { formatEther } from "viem";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import deployedContracts from "~~/contracts/deployedContracts";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";

export default function Perfil({ setActiveRole }: { setActiveRole: (role: any) => void }) {
  const { address: connectedAddress } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  const [nftMetadata, setNftMetadata] = useState<any>(null);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const { targetNetwork } = useTargetNetwork();
  const crowdfundingProAbi = targetNetwork.id ? (deployedContracts as any)[targetNetwork.id]?.CrowdfundingPro?.abi : [];

  const { data: projects } = useScaffoldReadContract({
    contractName: "CrowdfundingFactory",
    functionName: "getAllProjects",
  });

  const { data: contributions } = useReadContract({
    address: selectedProject as `0x${string}`,
    abi: crowdfundingProAbi,
    functionName: "contributions",
    args: connectedAddress ? [connectedAddress] : undefined,
    query: { enabled: !!selectedProject && !!connectedAddress },
  });

  const { data: userNFTId } = useReadContract({
    address: selectedProject as `0x${string}`,
    abi: crowdfundingProAbi,
    functionName: "userNFT",
    args: connectedAddress ? [connectedAddress] : undefined,
    query: { enabled: !!selectedProject && !!connectedAddress },
  });

  const { data: uri } = useReadContract({
    address: selectedProject as `0x${string}`,
    abi: crowdfundingProAbi,
    functionName: "tokenURI",
    args: userNFTId && BigInt(userNFTId.toString()) > 0n ? [BigInt(userNFTId.toString())] : undefined,
    query: { enabled: !!selectedProject && !!userNFTId && BigInt(userNFTId.toString()) > 0n },
  });

  const { writeContractAsync: claimNFT, isPending: isClaiming } = useWriteContract();

  const ethDonados = contributions ? Number(formatEther(contributions as bigint)) : 0;

  // Determinar tier según contribución
  let tier: "Ninguno" | "Bronce" | "Plata" | "Oro" = "Ninguno";
  let tierEmoji = "";
  let tierColor = "";

  if (ethDonados >= 0.1) {
    tier = "Oro";
    tierEmoji = "🥇";
    tierColor = "#FFD700"; // True Gold
  } else if (ethDonados >= 0.01) {
    tier = "Plata";
    tierEmoji = "🥈";
    tierColor = "#E5E7EB"; // Silver
  } else if (ethDonados >= 0.001) {
    tier = "Bronce";
    tierEmoji = "🥉";
    tierColor = "#CD7F32"; // Bronze
  }

  const hasNFT = userNFTId ? BigInt(userNFTId.toString()) > 0n : false;
  const puedeReclamar = tier !== "Ninguno";

  useEffect(() => {
    if (uri && typeof uri === "string" && uri.includes("base64,")) {
      try {
        const jsonPart = uri.split("base64,")[1];
        const decoded = JSON.parse(window.atob(jsonPart));
        setNftMetadata(decoded);
      } catch (e) { console.error("Error decodificando NFT:", e); }
    } else { setNftMetadata(null); }
  }, [uri]);

  if (!mounted) return null;

  return (
    /* CAMBIO APLICADO: -mt-24 empuja el cuadro hacia arriba con fuerza */
    <div className="w-full max-w-4xl mx-auto -mt-24 p-6 bg-white border-2 border-black rounded-[2rem] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black relative z-10 animate-in slide-in-from-bottom-4 duration-500">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
            MI <span className="text-blue-600">STATUS</span>
          </h2>
          <p className="font-bold text-slate-400 text-[10px] mt-1 uppercase">TODAS LAS MEDALLAS DISPONIBLES</p>
        </div>

        <select
          id="projectSelect"
          name="projectSelect"
          onChange={(e) => setSelectedProject(e.target.value)}
          className="p-2 border-2 border-black rounded-xl font-black text-xs bg-slate-100 shadow-[2px_2px_0px_0px_black] outline-none cursor-pointer"
        >
          <option value="">Selecciona un Proyecto</option>
          {(projects as any[])?.map((p) => (
            <option key={p.contractAddress} value={p.contractAddress}>{p.name}</option>
          ))}
        </select>
      </header>

      {!selectedProject ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-[2rem]">
          <p className="text-sm font-black text-slate-300 uppercase italic">Elige un proyecto para ver tus medallas</p>
        </div>
      ) : !puedeReclamar ? (
        <div className="py-12 text-center bg-red-50 border-2 border-black rounded-[2rem]">
          <p className="text-xl font-black text-red-500 uppercase italic">Debes donar al menos 0.001 ETH</p>
          <p className="text-sm font-bold text-slate-500 mt-2">Contribución actual: {Number(ethDonados.toFixed(4))} ETH</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 items-start animate-in zoom-in duration-300">
          <div className="space-y-4">
            {/* Status Circular Original (Revertido) */}
            <div
              style={{ backgroundColor: tierColor }}
              className={`flex flex-col items-center justify-center p-6 border-4 border-black rounded-full w-56 h-56 mx-auto shadow-[8px_8px_0px_0px_black] mb-6 relative overflow-hidden transition-all hover:scale-105`}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
              <span className="text-7xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] animate-pulse z-10">{tierEmoji}</span>
              <p className="font-black text-black uppercase italic text-[10px] mt-2 leading-none z-10">¡ NIVEL {tier.toUpperCase()} !</p>
              <div className="mt-2 px-3 py-1 bg-black/10 rounded-full z-10 border border-black/10">
                <p className="text-[11px] font-black text-black leading-none">{Number(ethDonados.toFixed(4))} ETH</p>
              </div>
            </div>

            <div className="bg-slate-100 p-4 rounded-2xl border-2 border-black border-dashed mb-6">
              <p className="text-[10px] font-black uppercase italic text-slate-500 mb-2">Requisitos de Medalla:</p>
              <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-black uppercase">
                <div className={tier === "Bronce" ? "text-orange-600 outline outline-1 outline-orange-200 py-1 rounded" : "text-slate-400 opacity-50"}>🥉 0.001</div>
                <div className={tier === "Plata" ? "text-slate-600 outline outline-1 outline-slate-200 py-1 rounded" : "text-slate-400 opacity-50"}>🥈 0.01</div>
                <div className="text-blue-600 bg-blue-50 py-1 rounded-lg border-2 border-blue-200">🏆 0.1 (ORO)</div>
              </div>
            </div>

            {!hasNFT && (
              <button
                onClick={async () => {
                  try {
                    await claimNFT({
                      functionName: "claimNFT",
                      address: selectedProject as `0x${string}`,
                      abi: crowdfundingProAbi,
                      args: [],
                    });
                  } catch (error) {
                    console.error("Error claiming NFT:", error);
                  }
                }}
                disabled={isClaiming}
                className="w-full py-4 bg-blue-600 text-white font-black text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_black] uppercase italic"
              >
                {isClaiming ? "MINTEANDO..." : "RECLAMAR MEDALLA"}
              </button>
            )}
          </div>

          {/* Área de la Medalla - DISEÑO OLÍMPICO REAL (Sin Cuadro) */}
          <div className="relative w-80 h-[480px] mx-auto flex flex-col items-center justify-start p-2">
            {nftMetadata ? (
              <div className="text-center animate-in zoom-in duration-700 h-full flex flex-col items-center">
                <img
                  src={nftMetadata.image}
                  alt="NFT Medalla"
                  className="w-full h-[85%] object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.3)] transition-transform hover:scale-105"
                />
                <div className="mt-4 px-6 py-2 bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_black] transform -rotate-1 hover:rotate-0 transition-all">
                  <p className="font-black italic uppercase text-lg tracking-tighter text-black leading-none">
                    {nftMetadata.name.split(": ")[1] || nftMetadata.name}
                  </p>
                </div>
              </div>
            ) : (
              /* Versión "Disponible" con Cinta Realista (Ghost Medal) */
              <div className="flex flex-col items-center justify-start w-full h-full opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-1000 group">
                {/* Ribbon/Cinta */}
                <div className="w-48 h-64 bg-blue-600 shadow-[0_8px_20px_rgba(0,0,0,0.4)] z-0 relative transform origin-top group-hover:scale-y-105 transition-transform"
                  style={{ clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 50% 75%, 0% 100%)' }}>
                  <div className="w-full h-full bg-blue-700 opacity-20 bg-[linear-gradient(90deg,transparent_45%,rgba(0,0,0,0.1)_50%,transparent_55%)]"></div>
                  <div className="absolute top-0 left-0 w-full h-full shadow-inner"></div>
                </div>

                {/* Medal Plate/Moneda */}
                <div
                  style={{ backgroundColor: tierColor }}
                  className={`-mt-16 flex flex-col items-center justify-center border-8 border-black rounded-full w-56 h-56 shadow-[0_15px_30px_rgba(0,0,0,0.4)] z-10 scale-90 group-hover:scale-100 transition-transform`}
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-black/20 to-white/40 pointer-events-none rounded-full"></div>
                  <span className="text-8xl drop-shadow-xl">{tierEmoji}</span>
                </div>

                <p className="mt-8 font-black text-sm uppercase italic text-slate-400 tracking-[0.2em]">Medalla Disponible</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN VOLVER: Ajustado al tamaño del botón */}
      <div className="mt-10 w-fit">
        <button
          onClick={() => setActiveRole(null)}
          className="px-4 py-2 border-2 border-black rounded-xl bg-slate-100 font-black uppercase text-[10px] shadow-[3px_3px_0px_0px_black] hover:bg-blue-500 hover:text-white transition-all active:translate-y-0.5"
        >
          ← VOLVER
        </button>
      </div>
    </div>
  );
}