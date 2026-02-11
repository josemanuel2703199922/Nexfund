"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import type { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import {
  useAccount,
  useBalance,
  usePublicClient,
  useReadContract,
  useWatchContractEvent,
  useWriteContract,
} from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { notification } from "~~/utils/scaffold-eth";

interface Projectoview {
  contractAddress: string;
  creator: string;
  name: string;
  target: bigint;
  deadline: bigint;
}

// Estilos para quitar las flechas de los inputs numéricos
const hideSpinnersStyle = `
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  input[type=number] {
    -moz-appearance: textfield;
  }
`;

const Home: NextPage = () => {
  const { address: connectedAddress, isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);
  const [activeRole, setActiveRole] = useState<"donor" | "admin" | "profile" | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectTarget, setProjectTarget] = useState("0.001");
  const [projectDays, setProjectDays] = useState("30");
  const [donationAmount, setDonationAmount] = useState<Record<string, string>>({});
  const [withdrawReason, setWithdrawReason] = useState<Record<string, string>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    data: projects,
    isLoading: isLoadingProjects,
    error: projectsError,
  } = useScaffoldReadContract({
    contractName: "CrowdfundingFactory",
    functionName: "getAllProjects",
    watch: true,
  });

  useEffect(() => {
    if (projectsError) {
      console.error("Error cargando proyectos:", projectsError);
      notification.error("Error al cargar proyectos del contrato");
    }
  }, [projectsError]);

  const { writeContractAsync: createProject, isMining: isCreating } = useScaffoldWriteContract({
    contractName: "CrowdfundingFactory",
  });

  const { writeContractAsync: interactWithProject } = useScaffoldWriteContract({
    contractName: "CrowdfundingPro",
  });

  const filteredProjects = (projects as Projectoview[])?.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="flex flex-col items-center flex-grow pt-6 px-4 bg-[#F8FAFC] min-h-screen text-[#1E293B]">
      <style>{hideSpinnersStyle}</style>
      <div className="max-w-[95%] w-full">
        {mounted && (
          <div className="relative flex flex-col items-center mb-16 border-b border-slate-100 pb-12">
            <h1 className="text-7xl md:text-8xl font-black text-[#0F172A] tracking-tighter italic uppercase underline decoration-blue-600 decoration-[10px] underline-offset-8">
              NEX<span className="text-blue-600">FUND</span>
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mt-6">
              Decentralized Crowdfunding Platform
            </p>
          </div>
        )}

        {!activeRole ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-4">
            {[
              { role: "donor", emoji: "🎁", label: "Donante", color: "hover:border-green-400" },
              { role: "admin", emoji: "🏗️", label: "Creador", color: "hover:border-blue-500" },
              { role: "profile", emoji: "👤", label: "Perfil", color: "hover:border-purple-500" },
            ].map(btn => (
              <div
                key={btn.role}
                onClick={() => setActiveRole(btn.role as any)}
                className={`group cursor-pointer bg-white p-10 rounded-[3rem] border-2 border-slate-100 ${btn.color} transition-all text-center shadow-sm hover:shadow-xl transform hover:-translate-y-2`}
              >
                <div className="text-8xl mb-4 group-hover:scale-110 transition-transform">{btn.emoji}</div>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter">{btn.label}</h2>
              </div>
            ))}
          </div>
        ) : activeRole === "profile" ? (
          <Perfil setActiveRole={setActiveRole} />
        ) : (
          <div className="space-y-8 pb-12">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveRole(null)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all shadow-sm"
              >
                ← Menú
              </button>
              <div className="relative flex-grow max-w-xs">
                <input
                  id="searchTerm"
                  name="searchTerm"
                  type="text"
                  placeholder="Buscar..."
                  className="w-full px-10 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs outline-none focus:border-blue-500 transition-all shadow-sm"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                <span className="absolute left-3 top-2 opacity-30 text-xs">🔍</span>
              </div>
            </div>

            {activeRole === "admin" && (
              <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <h2 className="text-sm font-black mb-4 uppercase italic text-blue-600">🚀 Nuevo Proyecto</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1 italic">Nombre</label>
                    <input
                      id="projectName"
                      name="projectName"
                      className="w-full h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs"
                      placeholder="Nombre..."
                      value={projectName}
                      onChange={e => setProjectName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1 italic">Meta (ETH)</label>
                    <input
                      id="projectTarget"
                      name="projectTarget"
                      className="w-full h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs"
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      placeholder="Ej: 0.1 (Medalla Oro)"
                      value={projectTarget}
                      onChange={e => setProjectTarget(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-1 italic">Días</label>
                    <input
                      id="projectDays"
                      name="projectDays"
                      className="w-full h-10 px-4 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs"
                      type="number"
                      value={projectDays}
                      onChange={e => setProjectDays(e.target.value)}
                    />
                  </div>
                  <button
                    className={`h-10 text-white rounded-xl font-black uppercase text-[9px] shadow-md transition-all ${isCreating || !isConnected || !projectName || Number(projectDays) <= 0 ? "bg-slate-300" : "bg-blue-600 hover:bg-blue-700"}`}
                    disabled={isCreating || !isConnected || !projectName || Number(projectDays) <= 0}
                    onClick={async () => {
                      try {
                        // Normalizamos el valor para manejar comas (,) típicas en teclados españoles
                        const normalizedTarget = projectTarget.replace(",", ".");
                        await createProject({
                          functionName: "createProject",
                          args: [projectName, "Campaña Activa", parseEther(normalizedTarget), BigInt(projectDays)],
                        });
                        notification.success("¡Proyecto en línea!");
                        setProjectName("");
                      } catch (e: any) {
                        console.error(e);
                        notification.error(`Error al crear proyecto: ${e.message || "Verifica tu billetera"}`);
                      }
                    }}
                  >
                    {isCreating ? "..." : "Lanzar"}
                  </button>
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoadingProjects ? (
                <div className="col-span-full text-center py-10 font-black text-slate-300 uppercase italic">
                  Escaneando...
                </div>
              ) : projectsError ? (
                <div className="col-span-full text-center py-10 font-black text-red-500 uppercase italic">
                  Error de conexión con el contrato
                </div>
              ) : filteredProjects?.length === 0 ? (
                <div className="col-span-full text-center py-10 font-black text-slate-400 uppercase italic">
                  No hay proyectos activos
                </div>
              ) : (
                filteredProjects?.map((project, index) => (
                  <ProjectCard
                    key={project.contractAddress || index}
                    project={project}
                    role={activeRole}
                    connectedAddress={connectedAddress}
                    interactWithProject={interactWithProject}
                    states={{ donationAmount, setDonationAmount, withdrawReason, setWithdrawReason }}
                    mounted={mounted}
                  />
                ))
              )}
            </div>

            <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 mt-10">
              <h2 className="text-lg font-black mb-4 uppercase italic tracking-tighter">
                📊 Auditoría General del Sistema
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-[9px] font-black text-slate-400 text-left uppercase italic">
                        Proyecto
                      </th>
                      <th className="px-4 py-2 text-[9px] font-black text-slate-400 text-left uppercase italic">
                        Acción / Razón
                      </th>
                      <th className="px-4 py-2 text-[9px] font-black text-slate-400 text-right uppercase italic">
                        Monto
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProjects?.map((p, idx) => <GlobalAuditRow key={p.contractAddress || idx} project={p} />)}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

const GlobalAuditRow = ({ project }: { project: Projectoview }) => {
  const validAddr =
    project?.contractAddress && project.contractAddress.startsWith("0x")
      ? (project.contractAddress as `0x${string}`)
      : undefined;
  const { targetNetwork } = useTargetNetwork();

  const crowdfundingProAbi = useMemo(() => {
    return (targetNetwork.id ? (deployedContracts as any)[targetNetwork.id]?.CrowdfundingPro?.abi : []) || [];
  }, [targetNetwork.id]);

  const { data: withdrawals } = useReadContract({
    address: validAddr,
    abi: crowdfundingProAbi,
    functionName: "getWithdrawalHistory",
    query: { enabled: !!validAddr },
  });

  const [events, setEvents] = useState<any[]>([]);
  const publicClient = usePublicClient();
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate fetches
    if (hasFetchedRef.current || !publicClient || !validAddr || crowdfundingProAbi.length === 0) return;

    const fetchLogs = async () => {
      try {
        const contributionAbi = crowdfundingProAbi.find(
          (item: any) => item.type === "event" && item.name === "ContributionReceived",
        );
        const refundAbi = crowdfundingProAbi.find(
          (item: any) => item.type === "event" && item.name === "RefundClaimed",
        );
        const fromBlock = 0n;

        const [contributionLogs, refundLogs] = await Promise.all([
          publicClient.getLogs({
            address: validAddr,
            event: contributionAbi,
            fromBlock: fromBlock,
          }),
          refundAbi
            ? publicClient.getLogs({
                address: validAddr,
                event: refundAbi,
                fromBlock: fromBlock,
              })
            : Promise.resolve([]),
        ]);

        const allLogs = [...contributionLogs, ...refundLogs].sort(
          (a: any, b: any) => Number(b.blockNumber) - Number(a.blockNumber) || Number(b.logIndex) - Number(a.logIndex),
        );

        setEvents(allLogs);
        hasFetchedRef.current = true;
      } catch (error) {
        console.error("Error fetching event logs:", error);
      }
    };
    fetchLogs();
  }, [publicClient, validAddr, crowdfundingProAbi, targetNetwork.id]);

  useWatchContractEvent({
    address: validAddr,
    abi: crowdfundingProAbi as any,
    eventName: "ContributionReceived",
    onLogs: newLogs => {
      setEvents(prev => [...newLogs, ...prev]);
    },
  });

  useWatchContractEvent({
    address: validAddr,
    abi: crowdfundingProAbi as any,
    eventName: "RefundClaimed",
    onLogs: newLogs => {
      setEvents(prev => [...newLogs, ...prev]);
    },
  });

  if (!validAddr) return null;

  return (
    <>
      {Array.isArray(withdrawals) &&
        withdrawals.map((w: any, i: number) => (
          <tr key={`w-${project.contractAddress}-${i}`} className="bg-amber-50/50 rounded-xl text-[11px]">
            <td className="px-4 py-3 font-bold uppercase italic border-l-4 border-amber-500 text-slate-500">
              {project.name}
            </td>
            <td className="px-4 py-3">
              <span className="font-black text-amber-600 uppercase italic">RETIRO #{w.id?.toString()}:</span>
              <span className="ml-2 font-bold text-slate-700 italic">&quot;{w.reason}&quot;</span>
            </td>
            <td className="px-4 py-3 text-right font-black text-amber-700">-{formatEther(w.amount || 0n)} ETH</td>
          </tr>
        ))}
      {Array.isArray(events) &&
        events.map((event: any, i: number) => {
          const isRefund = event.eventName === "RefundClaimed";
          return (
            <tr
              key={`${event.transactionHash}-${i}`}
              className={`${isRefund ? "bg-red-50/50" : "bg-slate-50"} rounded-xl text-[11px]`}
            >
              <td className="px-4 py-2 font-bold uppercase italic text-slate-300">{project.name}</td>
              <td className={`px-4 py-2 font-medium italic ${isRefund ? "text-red-500" : "text-slate-500"}`}>
                {isRefund ? (
                  <>REEMBOLSO enviado a: {event.args?.donor?.slice(0, 6)}...</>
                ) : (
                  <>Aporte recibido de: {event.args?.contributor?.slice(0, 6)}...</>
                )}
              </td>
              <td className={`px-4 py-2 text-right font-black ${isRefund ? "text-red-600" : "text-blue-600"}`}>
                {isRefund ? "-" : "+"}
                {Number(Number(formatEther(event.args?.amount || 0n)).toFixed(4))} ETH
              </td>
            </tr>
          );
        })}
    </>
  );
};

const ProjectCard = ({ project, role, connectedAddress, interactWithProject, states, mounted }: any) => {
  const addr = project.contractAddress as `0x${string}`;
  const isOwner = connectedAddress?.toLowerCase() === project.creator?.toLowerCase();
  const [loading, setLoading] = useState(false);
  const { targetNetwork } = useTargetNetwork();
  const { data: userBalance } = useBalance({ address: connectedAddress, query: { enabled: !!connectedAddress } });
  const crowdfundingProAbi = targetNetwork.id
    ? (deployedContracts as any)[targetNetwork.id as keyof typeof deployedContracts]?.CrowdfundingPro?.abi
    : [];

  const { data: balanceData } = useBalance({ address: addr, query: { enabled: !!addr } });
  const currentBalance = balanceData ? Number(balanceData.formatted) : 0;

  const { data: totalRaised } = useReadContract({
    address: addr,
    abi: crowdfundingProAbi,
    functionName: "totalRaised",
    query: { enabled: !!addr },
  });

  const { data: withdrawals } = useReadContract({
    address: addr,
    abi: crowdfundingProAbi,
    functionName: "getWithdrawalHistory",
    query: { enabled: !!addr },
  });

  const raised = totalRaised ? Number(formatEther(totalRaised as bigint)) : 0;
  const targetEth = project.target ? Number(formatEther(project.target as bigint)) : 0;
  const isSuccess = raised >= targetEth;
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    setIsExpired(Date.now() / 1000 > Number(project.deadline));
  }, [project.deadline]);

  const percent = targetEth > 0 ? Math.min((raised / targetEth) * 100, 100) : 0;

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 flex flex-col min-h-[550px] transition-all hover:shadow-lg overflow-hidden">
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-center mb-4">
          <span
            className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${isExpired && !isSuccess ? "bg-red-600 text-white border-red-700" : isSuccess ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-green-50 text-green-600 border-green-100"}`}
          >
            {isExpired && !isSuccess ? "❌ Fracasó" : isSuccess ? "💰 Éxito" : "🚀 Activo"}
          </span>
          {mounted && project.deadline && (
            <p className="text-[10px] font-black text-red-600">
              {new Date(Number(project.deadline) * 1000).toLocaleDateString()}
            </p>
          )}
        </div>

        <h3 className="text-xl font-black text-[#1E293B] mb-4 uppercase italic leading-tight truncate">
          {project.name}
        </h3>

        <div className="mb-6 p-3 bg-slate-50 rounded-2xl flex justify-around items-center border border-slate-100 shadow-inner min-h-[90px]">
          {[
            { t: 0.001, e: "🥉" },
            { t: 0.01, e: "🥈" },
            { t: 0.1, e: "🥇" },
          ].map(m => (
            <div
              key={m.t}
              className={`flex flex-col items-center transition-all duration-500 ${raised >= m.t ? "opacity-100 scale-125 animate-bounce" : "opacity-20 grayscale"}`}
            >
              <span className="text-2xl mb-1">{m.e}</span>
              <span className={`text-[7px] font-black uppercase ${raised >= m.t ? "text-blue-600" : "text-slate-400"}`}>
                {m.t} ETH
              </span>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-end">
            <div className="flex flex-col text-xl font-black">
              <span className="text-[7px] font-black uppercase text-slate-300 italic mb-[-2px]">Recaudado / Meta</span>
              <span>
                {Number(raised.toFixed(4))}
                <span className="text-slate-300 mx-1">/</span>
                <span className="text-blue-500">{Number(targetEth.toFixed(4))}</span>
              </span>
            </div>
            <span className="text-sm font-black text-blue-600 font-mono">{percent.toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${isSuccess ? "bg-green-500" : isExpired && !isSuccess ? "bg-red-500" : "bg-blue-600"}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-50">
          <h4 className="text-[8px] font-black uppercase text-slate-400 mb-2 italic text-center">
            Auditoría de Fondos
          </h4>
          <div className="max-h-32 overflow-y-auto space-y-2">
            {Array.isArray(withdrawals) && withdrawals.length > 0 ? (
              (withdrawals as any[]).map((w, idx) => (
                <div key={idx} className="bg-amber-50/60 p-2 rounded-xl border border-amber-100 text-center">
                  <p className="font-black italic text-[11px] text-slate-800 uppercase leading-none">
                    &quot;{w.reason}&quot;
                  </p>
                  <p className="font-black text-amber-600 text-[13px] mt-1">{formatEther(w.amount || 0n)} ETH</p>
                </div>
              ))
            ) : (
              <p className="text-[8px] text-center text-slate-300 italic font-black uppercase">
                Sin retiros registrados
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 pt-0">
        <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
          {role === "admin" && isOwner ? (
            <div className="space-y-2">
              {isSuccess && currentBalance > 0 ? (
                <>
                  <input
                    id={`withdrawReason-${addr}`}
                    name={`withdrawReason-${addr}`}
                    placeholder="Motivo del retiro..."
                    className="w-full h-8 bg-white border border-slate-200 rounded-lg px-3 text-[10px] font-bold"
                    value={states.withdrawReason[addr] || ""}
                    onChange={e => states.setWithdrawReason({ ...states.withdrawReason, [addr]: e.target.value })}
                  />
                  <button
                    className="w-full h-8 bg-slate-900 text-white rounded-lg font-black text-[9px] uppercase shadow-sm"
                    disabled={loading || !states.withdrawReason[addr]}
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await interactWithProject({
                          functionName: "withdrawFunds",
                          address: addr,
                          args: [states.withdrawReason[addr], parseEther(currentBalance.toString())],
                        });
                        states.setWithdrawReason({ ...states.withdrawReason, [addr]: "" });
                        notification.success("Retiro auditado con éxito");
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Retirar y Auditar
                  </button>
                </>
              ) : (
                <div className="text-center py-2 bg-slate-100 rounded-lg text-[8px] font-black uppercase text-slate-400 italic">
                  {isSuccess ? "Sin saldo disponible" : "Esperando Meta..."}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {!isExpired && !isSuccess ? (
                <div className="flex gap-2">
                  <input
                    id={`donationAmount-${addr}`}
                    name={`donationAmount-${addr}`}
                    type="number"
                    step="0.001"
                    className="w-[40%] h-10 bg-white border border-slate-200 rounded-xl px-3 font-black text-xs"
                    placeholder="Ej: 0.1 Oro"
                    value={states.donationAmount[addr] || ""}
                    onChange={e => states.setDonationAmount({ ...states.donationAmount, [addr]: e.target.value })}
                  />
                  <button
                    className="w-[60%] h-10 bg-green-600 text-white rounded-xl font-black text-[9px] uppercase shadow-sm"
                    disabled={loading || !states.donationAmount[addr]}
                    onClick={async () => {
                      if (userBalance && parseEther(states.donationAmount[addr]) > userBalance.value) {
                        notification.error("No tienes fondos suficientes en tu billetera");
                        return;
                      }
                      setLoading(true);
                      try {
                        await interactWithProject({
                          functionName: "contribute",
                          address: addr,
                          value: parseEther(states.donationAmount[addr]),
                        });
                        states.setDonationAmount({ ...states.donationAmount, [addr]: "" });
                        notification.success("¡Donación recibida!");
                      } catch (e) {
                        console.error(e);
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    Donar
                  </button>
                </div>
              ) : isExpired && !isSuccess ? (
                <button
                  className="w-full h-10 bg-red-600 text-white rounded-xl font-black text-[9px] uppercase shadow-md hover:bg-red-700"
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await interactWithProject({ functionName: "claimRefund", address: addr });
                      notification.success("Reembolso listo");
                    } catch (e) {
                      console.error(e);
                      notification.error("Error al reclamar reembolso");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? "Procesando..." : "Reclamar Reembolso"}
                </button>
              ) : (
                <div className="text-center py-2 bg-slate-100 rounded-lg text-[8px] font-black uppercase text-slate-500 italic border border-slate-200">
                  {isSuccess ? "Proyecto Exitoso" : "Campaña Finalizada"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;

const Perfil = ({ setActiveRole }: { setActiveRole: (role: any) => void }) => {
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

  let tier: "Ninguno" | "Bronce" | "Plata" | "Oro" = "Ninguno";
  let tierEmoji = "";
  let tierColor = "";

  if (ethDonados >= 0.1) {
    tier = "Oro";
    tierEmoji = "🥇";
    tierColor = "#FFD700";
  } else if (ethDonados >= 0.01) {
    tier = "Plata";
    tierEmoji = "🥈";
    tierColor = "#E5E7EB";
  } else if (ethDonados >= 0.001) {
    tier = "Bronce";
    tierEmoji = "🥉";
    tierColor = "#CD7F32";
  }

  const hasNFT = userNFTId ? BigInt(userNFTId.toString()) > 0n : false;
  const puedeReclamar = tier !== "Ninguno";

  useEffect(() => {
    if (uri && typeof uri === "string" && uri.includes("base64,")) {
      try {
        const jsonPart = uri.split("base64,")[1];
        const decoded = JSON.parse(window.atob(jsonPart));
        setNftMetadata(decoded);
      } catch (e) {
        console.error("Error decodificando NFT:", e);
      }
    } else {
      setNftMetadata(null);
    }
  }, [uri]);

  if (!mounted) return null;

  return (
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
          onChange={e => setSelectedProject(e.target.value)}
          className="p-2 border-2 border-black rounded-xl font-black text-xs bg-slate-100 shadow-[2px_2px_0px_0px_black] outline-none cursor-pointer"
        >
          <option value="">Selecciona un Proyecto</option>
          {(projects as any[])?.map(p => (
            <option key={p.contractAddress} value={p.contractAddress}>
              {p.name}
            </option>
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
          <p className="text-sm font-bold text-slate-500 mt-2">
            Contribución actual: {Number(ethDonados.toFixed(4))} ETH
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 items-start animate-in zoom-in duration-300">
          <div className="space-y-4">
            {/* Status Circular Original */}
            <div
              style={{ backgroundColor: tierColor }}
              className={`flex flex-col items-center justify-center p-6 border-4 border-black rounded-full w-56 h-56 mx-auto shadow-[8px_8px_0px_0px_black] mb-6 relative overflow-hidden transition-all hover:scale-105`}
            >
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/20 to-transparent pointer-events-none"></div>
              <span className="text-7xl drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] animate-pulse z-10">{tierEmoji}</span>
              <p className="font-black text-black uppercase italic text-[10px] mt-2 leading-none z-10">
                ¡ NIVEL {tier.toUpperCase()} !
              </p>
              <div className="mt-2 px-3 py-1 bg-black/10 rounded-full z-10 border border-black/10">
                <p className="text-[11px] font-black text-black leading-none">{Number(ethDonados.toFixed(4))} ETH</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border-2 border-black border-dashed mb-6">
              <p className="text-[10px] font-black uppercase italic text-slate-500 mb-2">Requisitos de Medalla:</p>
              <div className="grid grid-cols-3 gap-2 text-center text-[9px] font-black uppercase">
                <div
                  className={
                    tier === "Bronce"
                      ? "text-orange-600 outline outline-1 outline-orange-200 py-1 rounded"
                      : "text-slate-400 opacity-50"
                  }
                >
                  🥉 0.001
                </div>
                <div
                  className={
                    tier === "Plata"
                      ? "text-slate-600 outline outline-1 outline-slate-200 py-1 rounded"
                      : "text-slate-400 opacity-50"
                  }
                >
                  🥈 0.01
                </div>
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
                    console.error(error);
                  }
                }}
                disabled={isClaiming}
                className="w-full py-4 bg-blue-600 text-white font-black text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_0px_black] uppercase italic"
              >
                {isClaiming ? "MINTEANDO..." : "RECLAMAR MEDALLA"}
              </button>
            )}
          </div>

          <div className="relative w-80 h-[480px] mx-auto flex flex-col items-center justify-start p-2">
            {nftMetadata ? (
              <div className="text-center h-full flex flex-col items-center">
                <Image
                  src={nftMetadata.image}
                  alt="NFT Medalla"
                  width={320}
                  height={400}
                  className="w-full h-[85%] object-contain filter drop-shadow-[0_20px_30px_rgba(0,0,0,0.3)] transition-transform hover:scale-105"
                />
                <div className="mt-4 px-6 py-2 bg-white border-4 border-black rounded-2xl shadow-[6px_6px_0px_0px_black] transform -rotate-1 hover:rotate-0 transition-all">
                  <p className="font-black italic uppercase text-lg tracking-tighter text-black leading-none">
                    {nftMetadata.name.split(": ")[1] || nftMetadata.name}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-start w-full h-full opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-1000 group">
                <div
                  className="w-48 h-64 bg-blue-600 shadow-[0_8px_20px_rgba(0,0,0,0.4)] z-0 relative transform origin-top group-hover:scale-y-105 transition-transform"
                  style={{ clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 50% 75%, 0% 100%)" }}
                >
                  <div className="w-full h-full bg-blue-700 opacity-20 bg-[linear-gradient(90deg,transparent_45%,rgba(0,0,0,0.1)_50%,transparent_55%)]"></div>
                </div>
                <div
                  style={{ backgroundColor: tierColor }}
                  className={`-mt-16 flex flex-col items-center justify-center border-8 border-black rounded-full w-56 h-56 shadow-[0_15px_30px_rgba(0,0,0,0.4)] z-10 scale-90 group-hover:scale-100 transition-transform`}
                >
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-black/20 to-white/40 pointer-events-none rounded-full"></div>
                  <span className="text-8xl drop-shadow-xl">{tierEmoji}</span>
                </div>
                <p className="mt-8 font-black text-sm uppercase italic text-slate-400">Medalla Disponible</p>
              </div>
            )}
          </div>
        </div>
      )}
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
};
