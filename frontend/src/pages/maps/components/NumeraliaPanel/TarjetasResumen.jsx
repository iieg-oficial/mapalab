import Icon from '@components/Icon';
import StatCard from '../LayerDetailModal/components/StatCard';

const REJILLA = 'grid grid-cols-2 auto-rows-fr gap-2 md:grid-cols-none md:grid-rows-2 md:grid-flow-col md:auto-cols-[minmax(120px,1fr)]';

const Propia = ({ stat, onQuitar, className = '' }) => (
    <div className={`relative h-full ${className}`}>
        <StatCard
            label={stat.nombre}
            value={stat.valor}
            simbolo={stat.simbolo}
            size="compact"
            receta={stat.receta}
            fondo="bg-[#F3ECF7]"
        />
        <button
            type="button"
            onClick={onQuitar}
            aria-label={`Quitar ${stat.nombre}`}
            className="absolute top-1.5 right-1.5 size-5 flex items-center justify-center rounded-full bg-white/70 text-[#8894AE] hover:text-white hover:bg-purple transition cursor-pointer"
        >
            <Icon name="close" className="size-3" />
        </button>
    </div>
);

const TarjetasResumen = ({ slots, propias, onQuitarPropia }) => {
    const total = slots.length + propias.length;
    const relleno = total % 2 === 1 ? 'max-md:col-span-2 md:row-span-2' : '';

    const esUltima = (indice) => indice === total - 1;

    return (
        <div className={REJILLA}>
            {slots.map((stat, indice) => (
                <StatCard
                    key={`oficial-${indice}`}
                    label={stat.nombre}
                    value={stat.valor}
                    simbolo={stat.simbolo}
                    size="compact"
                    receta={stat.receta}
                    className={esUltima(indice) ? relleno : ''}
                />
            ))}
            {propias.map((stat, indice) => (
                <Propia
                    key={`propia-${indice}`}
                    stat={stat}
                    onQuitar={() => onQuitarPropia(indice)}
                    className={esUltima(slots.length + indice) ? relleno : ''}
                />
            ))}
        </div>
    );
};

export default TarjetasResumen;
