const RATON = [
    ['Arrastrar', 'Mover el mapa'],
    ['Rueda', 'Acercar y alejar'],
    ['Clic derecho', 'Girar e inclinar'],
    ['Ctrl + arrastrar', 'Girar e inclinar'],
];

const TACTIL = [
    ['Un dedo', 'Mover el mapa'],
    ['Pellizcar', 'Acercar y girar'],
    ['Dos dedos ↕', 'Inclinar'],
];

const Lista = ({ filas }) => (
    <dl className="grid grid-cols-[auto_1fr] gap-x-2.5 gap-y-0.5">
        {filas.map(([gesto, accion]) => (
            <div key={gesto} className="contents">
                <dt className="whitespace-nowrap opacity-70">{gesto}</dt>
                <dd className="m-0">{accion}</dd>
            </div>
        ))}
    </dl>
);

const Map3DAyuda = ({ titulo }) => (
    <div className="flex flex-col gap-1.5 text-left">
        <span className="font-semibold">{titulo}</span>
        <Lista filas={RATON} />
        <hr className="border-0 border-t border-white/20 my-0.5" />
        <Lista filas={TACTIL} />
    </div>
);

export default Map3DAyuda;
