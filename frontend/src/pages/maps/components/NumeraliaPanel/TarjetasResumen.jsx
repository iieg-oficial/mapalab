import Icon from '@components/Icon';
import StatCard from '../LayerDetailModal/components/StatCard';

const REJILLA = 'grid grid-cols-2 auto-rows-fr gap-2 md:grid-cols-none md:grid-rows-2 md:grid-flow-col md:auto-cols-[minmax(120px,1fr)]';

const Propia = ({ stat, onQuitar }) => (
    <div className="relative h-full">
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
            className="absolute top-0.5 right-0.5 size-3.5 flex items-center justify-center rounded-full text-[#A9B4CC] hover:text-purple hover:bg-white transition cursor-pointer"
        >
            <Icon name="close" className="size-2" />
        </button>
    </div>
);

const TarjetasResumen = ({ slots, propias, onQuitarPropia }) => (
    <div className={REJILLA}>
        {slots.map((stat, indice) => (
            <StatCard
                key={`oficial-${indice}`}
                label={stat.nombre}
                value={stat.valor}
                simbolo={stat.simbolo}
                size="compact"
                receta={stat.receta}
            />
        ))}
        {propias.map((stat, indice) => (
            <Propia
                key={`propia-${indice}`}
                stat={stat}
                onQuitar={() => onQuitarPropia(indice)}
            />
        ))}
    </div>
);

export default TarjetasResumen;
