export const INPUT = 'block w-full h-10 px-4 py-2 rounded-[8px] bg-[#F8F8F8] text-[#5C2472] font-garet font-medium text-[13px] '
    + 'border border-transparent placeholder-[#6B6B6B] placeholder:font-normal '
    + 'hover:shadow-[0px_2px_24px_#B6A6BC98] hover:bg-white hover:border-[#5C2472] '
    + 'focus:outline-none focus:ring-1 focus:ring-[#5C2472] focus:bg-white';

export const INPUT_ERROR = 'border-[#EA4336]! bg-white';

export const TEXTAREA = `${INPUT.replace('h-10 ', '')} min-h-20 leading-5 resize-y`;

export const SELECT = `${INPUT} pr-8 cursor-pointer appearance-none truncate`;

export const ETIQUETA = 'block mb-1.5 text-[13px] font-garet font-medium text-[#191919]';

const BOTON = 'inline-flex items-center justify-center gap-2 h-10 px-6 rounded-[20px] font-garet font-bold text-[13px] transition-all cursor-pointer disabled:cursor-not-allowed';

export const BOTON_PRIMARIO = `${BOTON} bg-[#5C2472] text-white hover:shadow-[0px_8px_16px_#4615524D] disabled:bg-[#CBCBCB] disabled:text-[#5B6670] disabled:shadow-none`;

export const BOTON_CONTORNO = `${BOTON} bg-transparent text-[#5C2472] border border-[#5C2472] hover:bg-[#FAF5FC] disabled:opacity-50`;

export const BOTON_ICONO = 'size-8 shrink-0 rounded-full flex items-center justify-center text-[#6E7477] hover:text-[#5C2472] hover:bg-[#FAF5FC] transition-colors cursor-pointer disabled:text-[#D8D4DE] disabled:hover:bg-transparent disabled:cursor-default';

export const BOTON_ICONO_PELIGRO = 'size-8 shrink-0 rounded-full flex items-center justify-center text-[#B3261E] hover:bg-[#FCDBDA] transition-colors cursor-pointer';

const CHIP = 'inline-flex items-center gap-1.5 h-8 px-4 rounded-[20px] font-garet font-medium text-[12px] transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50';

export const chip = (activo) => `${CHIP} ${activo ? 'bg-[#FFE9CC] text-[#9E5200] ring ring-[#FF8300]' : 'bg-[#F8F8F8] text-[#465055] hover:bg-[#EFEFEF]'}`;

export const ERROR = 'flex items-center gap-1.5 mt-1.5 font-garet text-[12px] text-[#B3261E]';

export const CANCELAR = `${CHIP} bg-transparent text-[#B3261E] border border-[#FCDBDA] hover:bg-[#FCDBDA]`;
