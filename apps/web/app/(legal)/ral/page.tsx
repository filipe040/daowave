import { getCompanyInfo } from "@/lib/company";

export default function RalPage() {
  const { email } = getCompanyInfo();

  return (
    <>
      <h1>Resolução Alternativa de Litígios (RAL)</h1>

      <p>
        Em cumprimento do estipulado no artigo 18.º da Lei n.º 144/2015, informamos que no caso da ocorrência de um{" "}
        <strong>litígio de consumo online</strong> o cliente deve contactar previamente os nossos serviços pelo{" "}
        <a href={`mailto:${email}`}>{email}</a> procurando uma resolução amigável do diferendo.
      </p>

      <p>Caso a resolução não seja alcançada, o consumidor fica habilitado de recorrer a uma Entidade de Resolução Alternativa de Litígios de Consumo aprovada. Sugerimos a:</p>

      <div className="bg-white/5 border border-white/10 p-6 rounded-2xl my-6">
        <h3 className="mt-0 text-white">Centro Nacional de Informação e Arbitragem de Conflitos de Consumo (CNIACC)</h3>
        <ul className="mb-0 text-zinc-300">
          <li><strong>Contactos Telefónicos:</strong> 213 847 484</li>
          <li><strong>Site Web Oficial:</strong> <a href="https://www.cniacc.pt" target="_blank" rel="noopener noreferrer" className="text-[#00a0e3]">www.cniacc.pt</a></li>
          <li><strong>Email Oficial:</strong> <a href="mailto:geral@cniacc.pt" className="text-[#00a0e3]">geral@cniacc.pt</a></li>
        </ul>
      </div>

      <p>
        Alternativamente existe ao dispor do cidadão europeu a <strong>Plataforma Europeia de Resolução de Litígios em Linha (RLL)</strong> gerida pela Comissão Europeia, e que pode ser acedida no portal oficial em{" "}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-[#00a0e3]">https://ec.europa.eu/consumers/odr</a>.
      </p>
    </>
  );
}
