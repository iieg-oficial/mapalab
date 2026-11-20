import { Link } from 'react-router';
import SEO from '@components/SEO';
import Logo from '@components/Logo';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import Footer from '@components/Footer';
import useThemeColor from '@hooks/useThemeColor';
import ConnectorSection from './components/ConnectorSection';
import CopyUrl from './components/CopyUrl';
import { CLIENTS, EXAMPLES, FACTS, TOOLS, buildMcpUrl } from './config/connectorConfig';

const ConnectorPage = () => {
    useThemeColor('#5C2472');
    const mcpUrl = buildMcpUrl();

    return (
        <>
            <SEO
                title="Conector de IA — MapaLab"
                description="Conecta MapaLab a Claude u otro asistente compatible con MCP para consultar las capas de Jalisco del IIEG y crear mapas interactivos."
                path="/conector"
            />
            <div className="min-h-screen bg-purple-soft overflow-x-hidden flex flex-col">
                <header className="bg-white shadow-[0_3px_24px_#1A26641A]">
                    <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
                        <Link to="/" aria-label="Inicio de MapaLab">
                            <Logo name="mapalab" variant="light" size="w-44 md:w-60 h-10" expanded />
                        </Link>
                        <Link
                            to="/mapa"
                            className="whitespace-nowrap rounded-full bg-purple text-white font-garet font-bold px-6 py-2 hover:bg-purple-deep focus-visible:ring-2 focus-visible:ring-purple-deep outline-none transition-colors"
                        >
                            Ir al mapa
                        </Link>
                    </div>
                </header>

                <main className="flex-1 max-w-[1100px] w-full mx-auto px-4 md:px-8 py-10 flex flex-col gap-6">
                    <div className="flex flex-col gap-4">
                        <h1 className="font-garet font-bold text-[32px]/[40px] md:text-[40px]/[48px] text-purple">
                            Conecta MapaLab a tu asistente de IA
                        </h1>
                        <p className="text-graphite text-[17px]/[26px] max-w-[720px]">
                            Consulta las capas de Jalisco del IIEG y crea mapas desde Claude u otro asistente compatible con MCP.
                        </p>
                        <CopyUrl url={mcpUrl} />
                    </div>

                    <ConnectorSection title="Cómo conectarlo">
                        <dl className="divide-y divide-purple-soft">
                            {CLIENTS.map((client) => (
                                <div key={client.id} className="py-3 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-1 md:gap-6">
                                    <dt className="font-garet font-bold text-graphite">{client.name}</dt>
                                    <dd className="text-graphite break-words">
                                        {client.withUrl ? <code className="font-mono text-[14px]">{`${client.how} ${mcpUrl}`}</code> : client.how}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </ConnectorSection>

                    <ConnectorSection title={`Herramientas (${TOOLS.length})`}>
                        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {TOOLS.map((tool) => (
                                <li key={tool.id} className="rounded-[16px] bg-purple-soft p-4">
                                    <p className="font-garet font-bold text-purple-deep">{tool.name}</p>
                                    <p className="text-graphite text-[15px]/[22px]">{tool.detail}</p>
                                </li>
                            ))}
                        </ul>
                    </ConnectorSection>

                    <ConnectorSection title="Pruébalo con">
                        <ul className="flex flex-col gap-2">
                            {EXAMPLES.map((example) => (
                                <li key={example} className="text-graphite text-[16px]/[24px]">«{example}»</li>
                            ))}
                        </ul>
                    </ConnectorSection>

                    <ConnectorSection title="Datos y límites">
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {FACTS.map((fact) => (
                                <li key={fact.id} className="flex flex-col gap-1">
                                    <span className="flex items-center gap-2 font-garet font-bold text-graphite">
                                        {fact.title}
                                        {fact.info && (
                                            <Tooltip content={fact.info} variant="soft" placement="top">
                                                <button type="button" aria-label={fact.info} className="inline-flex rounded-full cursor-help focus-visible:ring-2 focus-visible:ring-purple-deep outline-none">
                                                    <Icon name="info" className="size-5" />
                                                </button>
                                            </Tooltip>
                                        )}
                                    </span>
                                    {fact.href
                                        ? <a href={fact.href} className="text-purple-deep underline">{fact.detail}</a>
                                        : <span className="text-graphite">{fact.detail}</span>}
                                </li>
                            ))}
                        </ul>
                    </ConnectorSection>
                </main>

                <Footer />
            </div>
        </>
    );
};

export default ConnectorPage;
