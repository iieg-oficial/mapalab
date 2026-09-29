import { useMemo, useSyncExternalStore } from 'react';
import { loteAceptado, telemetryDebugStore } from '@services/telemetryDebugStore';
import { flushNow } from '@services/telemetryService';

const pendientesDe = (c) => Math.max(0, c.encolados - c.aceptados - c.rechazados - c.perdidos);

const hora = (fecha) => fecha.toLocaleTimeString('es-MX');

const LoteFila = ({ lote }) => {
    const ok = loteAceptado(lote.estado) && !lote.perdido;
    return (
        <div className="px-3 py-1 border-b border-gray-800 last:border-0">
            <div className="flex justify-between items-baseline gap-2">
                <span className={ok ? 'text-green-400' : 'text-red-400'}>
                    {ok ? '✓' : '✗'} {lote.estado}
                </span>
                <span className="text-gray-400">{lote.enviados} ev</span>
                <span className="text-gray-500 text-[10px] ml-auto">{hora(lote.hora)}</span>
            </div>
            {lote.rechazados.length > 0 && (
                <div className="text-[10px] text-red-300">rechazado: {lote.rechazados.join(', ')}</div>
            )}
            {lote.perdido && lote.enviados > 0 && (
                <div className="text-[10px] text-red-300">se perdieron los eventos del lote</div>
            )}
        </div>
    );
};

const TelemetriaDebugTab = () => {
    const { sesion, cola, porEvento, lotes } = useSyncExternalStore(
        telemetryDebugStore.subscribe,
        telemetryDebugStore.getSnapshot,
    );

    const filas = useMemo(() => Object.entries(porEvento)
        .map(([nombre, conteo]) => ({ nombre, ...conteo, pendientes: pendientesDe(conteo) }))
        .sort((a, b) => (b.rechazados + b.perdidos) - (a.rechazados + a.perdidos) || b.encolados - a.encolados), [porEvento]);

    const fallidos = lotes.filter(lote => !loteAceptado(lote.estado) || lote.perdido).length;

    return (
        <div className="max-h-80 overflow-y-auto rounded-b-xl">
            <div className="px-3 py-1.5 border-b border-gray-700 flex flex-wrap gap-x-3 text-gray-400">
                <span>sesión <span className="text-blue-300">{sesion ? sesion.slice(0, 8) : '—'}</span></span>
                <span>cola <span className="text-blue-300">{cola}</span></span>
                <span>lotes <span className="text-blue-300">{lotes.length}</span></span>
                {fallidos > 0 && <span className="text-red-400">{fallidos} ✗</span>}
            </div>

            {filas.length === 0 ? (
                <p className="text-gray-500 px-3 py-3 text-center">Sin eventos aún</p>
            ) : (
                <table className="w-full">
                    <thead>
                        <tr className="text-gray-500 text-[10px]">
                            <th className="text-left font-normal px-3 py-1">Evento</th>
                            <th className="font-normal">env</th>
                            <th className="font-normal">ok</th>
                            <th className="font-normal">pend</th>
                            <th className="font-normal pr-3">✗</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filas.map(fila => {
                            const falla = fila.rechazados + fila.perdidos;
                            return (
                                <tr key={fila.nombre} className="border-t border-gray-800">
                                    <td className={`px-3 py-0.5 truncate max-w-40 ${falla ? 'text-red-400' : 'text-yellow-400'}`}>{fila.nombre}</td>
                                    <td className="text-center">{fila.encolados}</td>
                                    <td className="text-center text-green-400">{fila.aceptados}</td>
                                    <td className="text-center text-gray-400">{fila.pendientes}</td>
                                    <td className={`text-center pr-3 ${falla ? 'text-red-400' : 'text-gray-600'}`}>{falla}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            )}

            {lotes.length > 0 && (
                <div className="border-t border-gray-700">
                    <p className="px-3 pt-1.5 text-gray-500 text-[10px]">Últimos lotes</p>
                    {lotes.map((lote, i) => <LoteFila key={i} lote={lote} />)}
                </div>
            )}

            <div className="flex justify-between px-3 py-2 border-t border-gray-700">
                <button type="button" onClick={() => flushNow()} className="px-2.5 py-0.5 rounded-full bg-gray-700 hover:bg-gray-600 cursor-pointer">
                    Enviar ahora
                </button>
                <button type="button" onClick={() => telemetryDebugStore.limpiar()} className="px-2.5 py-0.5 rounded-full text-gray-400 hover:text-white cursor-pointer">
                    Limpiar
                </button>
            </div>
        </div>
    );
};

export default TelemetriaDebugTab;
