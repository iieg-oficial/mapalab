import { useContext, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Icon from '@components/Icon';
import { SiderContext } from '@contexts/SiderContext';
import { MOBILE_MEDIA_QUERY } from '@constants/sider';
import { renderInlineMarkdown } from '@utils/inlineMarkdown';

const useSiderWidthSafe = () => {
    const ctx = useContext(SiderContext);
    if (!ctx) return 0;
    if (ctx.isMobile) return 0;
    return ctx.width || 0;
};

const subscribeMatchMedia = (notify) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};
    const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
    mql.addEventListener('change', notify);
    return () => mql.removeEventListener('change', notify);
};

const getMobileSnapshot = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
};

const PANEL_RESERVE_DESKTOP = 397;
const SIDE_GAP_DESKTOP = 32;
const SIDE_GAP_MOBILE = 16;
const TOP_GAP_DESKTOP = 16;
const TOP_GAP_MOBILE = 16;

const BannerNotice = ({ notice, onDismiss, onCtaClick }) => {
    const siderWidth = useSiderWidthSafe();
    const isMobile = useSyncExternalStore(subscribeMatchMedia, getMobileSnapshot, () => false);
    const wrapperRef = useRef(null);
    const contentRef = useRef(null);
    const [overflows, setOverflows] = useState(false);

    const buildText = () => {
        const title = notice.title || '';
        const description = notice.description || '';
        if (title && description) return `${title} — ${description}`;
        return title || description;
    };

    const text = buildText();
    const hasCta = notice.cta?.label && notice.cta?.url;

    useEffect(() => {
        const check = () => {
            if (!contentRef.current || !wrapperRef.current) return;
            const contentWidth = contentRef.current.scrollWidth;
            const wrapperWidth = wrapperRef.current.clientWidth;
            setOverflows(contentWidth > wrapperWidth);
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, [text]);

    const positionStyle = isMobile
        ? { top: TOP_GAP_MOBILE, left: SIDE_GAP_MOBILE, right: SIDE_GAP_MOBILE }
        : { top: TOP_GAP_DESKTOP, left: siderWidth + SIDE_GAP_DESKTOP, right: PANEL_RESERVE_DESKTOP };

    return (
        <div
            role="status"
            className="absolute z-30"
            style={{
                ...positionStyle,
                pointerEvents: 'auto',
            }}
        >
            <div
                className="flex items-center bg-white font-garet rounded-lg shadow-[0px_3px_24px_#00000029] overflow-hidden"
                style={{ minHeight: 44 }}
            >
                <div
                    ref={wrapperRef}
                    className="flex-1 min-w-0 overflow-hidden px-4 py-2"
                >
                    <div
                        ref={contentRef}
                        className={`whitespace-nowrap ${overflows ? 'animate-[notice-marquee_22s_linear_infinite] hover:[animation-play-state:paused]' : ''}`}
                        style={overflows ? { display: 'inline-block', paddingRight: '3rem' } : undefined}
                    >
                        <span className="text-[14px] md:text-[15px] font-medium text-graphite tracking-normal">
                            {renderInlineMarkdown(text)}
                        </span>
                        {hasCta && (
                            <a
                                href={notice.cta.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={onCtaClick}
                                className="ml-3 text-[13px] md:text-[14px] font-bold text-purple hover:text-[#70308A] underline"
                            >
                                {notice.cta.label} →
                            </a>
                        )}
                        {overflows && (
                            <>
                                <span aria-hidden="true" className="text-[14px] md:text-[15px] font-medium text-graphite ml-12">
                                    {renderInlineMarkdown(text)}
                                </span>
                                {hasCta && (
                                    <span aria-hidden="true" className="ml-3 text-[13px] md:text-[14px] font-bold text-purple underline">
                                        {notice.cta.label} →
                                    </span>
                                )}
                            </>
                        )}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Cerrar"
                    className="shrink-0 p-2.5 rounded-full hover:bg-[#F0F0F0] transition-colors cursor-pointer flex items-center justify-center min-w-11 min-h-11 mr-2"
                >
                    <Icon name="close" className="size-4 text-graphite" />
                </button>
            </div>
        </div>
    );
};

export default BannerNotice;
