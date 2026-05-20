import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import useLayerNotices from '@hooksMaps/useLayerNotices';
import {
    arrowMarginFor,
    collapsePositionForMobile,
    noticeContentHash,
    positionToContainerClasses,
} from '@pages/maps/helpers/noticeHelpers';
import { trackLayerNoticeView, trackLayerNoticeDismiss, trackLayerNoticeCtaClick } from '@services/analyticsService';
import { MOBILE_MEDIA_QUERY } from '@constants/sider';
import AnchoredNotice from './AnchoredNotice';
import BannerNotice from './BannerNotice';
import SwipeUpWrapper from './SwipeUpWrapper';
import NoticeArrow from './NoticeArrow';
import NoticeMessage from './NoticeMessage';

const MOBILE_VISIBLE_LIMIT = 2;

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

const groupByPosition = (notices) => {
    const groups = {};
    notices.forEach((entry) => {
        if (!groups[entry.position]) groups[entry.position] = [];
        groups[entry.position].push(entry);
    });
    return groups;
};

const LayerNotices = ({ enabled = true }) => {
    const isMobile = useSyncExternalStore(subscribeMatchMedia, getMobileSnapshot, () => false);
    const { notices, dismiss } = useLayerNotices({ enabled, mobileMode: isMobile });
    const seenRef = useRef(new Set());
    const [expanded, setExpanded] = useState(() => new Set());

    useEffect(() => {
        if (!enabled) return;
        const currentKeys = new Set();
        notices.forEach(({ layerId, notice }) => {
            const key = `${layerId}:${noticeContentHash(notice)}`;
            currentKeys.add(key);
            if (seenRef.current.has(key)) return;
            seenRef.current.add(key);
            trackLayerNoticeView({
                layerId,
                variant: notice.variant,
                position: notice.position,
                hasCta: Boolean(notice.cta?.url),
            });
        });
        seenRef.current.forEach((key) => {
            if (!currentKeys.has(key)) seenRef.current.delete(key);
        });
    }, [notices, enabled]);

    const { viewportNotices, anchoredNotices, bannerNotices } = useMemo(() => {
        const viewport = [];
        const anchored = [];
        const banner = [];
        notices.forEach((entry) => {
            if (entry.notice?.variant === 'banner') {
                banner.push(entry);
                return;
            }
            const isAnchored = !isMobile
                && entry.notice?.anchorMode === 'coord'
                && entry.notice?.anchorCoord
                && Number.isFinite(entry.notice.anchorCoord.lon)
                && Number.isFinite(entry.notice.anchorCoord.lat);
            if (isAnchored) anchored.push(entry);
            else viewport.push(entry);
        });
        return { viewportNotices: viewport, anchoredNotices: anchored, bannerNotices: banner };
    }, [notices, isMobile]);

    const grouped = useMemo(() => {
        if (!isMobile) return groupByPosition(viewportNotices);
        const remapped = viewportNotices.map((entry) => ({
            ...entry,
            position: collapsePositionForMobile(entry.position),
        }));
        return groupByPosition(remapped);
    }, [viewportNotices, isMobile]);

    const toggleExpanded = useCallback((position) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(position)) next.delete(position);
            else next.add(position);
            return next;
        });
    }, []);

    if (!enabled || notices.length === 0) return null;

    const renderBanners = bannerNotices.map(({ layerId, notice }) => {
        const onDismissNotice = () => {
            trackLayerNoticeDismiss({ layerId, variant: 'banner' });
            dismiss(layerId, notice);
        };
        const onCtaClick = () => trackLayerNoticeCtaClick({
            layerId,
            variant: 'banner',
            url: notice.cta?.url,
        });
        return (
            <BannerNotice
                key={`banner-${layerId}-${noticeContentHash(notice)}`}
                notice={notice}
                onDismiss={onDismissNotice}
                onCtaClick={onCtaClick}
            />
        );
    });

    return (
        <>
            {renderBanners}
            {Object.entries(grouped).map(([position, entries]) => {
                const overLimit = isMobile && entries.length > MOBILE_VISIBLE_LIMIT;
                const isExpanded = expanded.has(position);
                const visible = overLimit && !isExpanded
                    ? entries.slice(0, MOBILE_VISIBLE_LIMIT)
                    : entries;
                const hiddenCount = entries.length - visible.length;
                return (
                    <div
                        key={position}
                        className={`absolute z-40 md:z-15 flex flex-col gap-2 pointer-events-none ${positionToContainerClasses(position)}`}
                    >
                        {visible.map(({ layerId, notice }) => {
                            const variant = notice.variant || 'info';
                            const dismissible = isMobile ? true : (notice.dismissible !== false);
                            const onDismissNotice = () => {
                                trackLayerNoticeDismiss({ layerId, variant });
                                dismiss(layerId, notice);
                            };
                            const onCtaClick = () => trackLayerNoticeCtaClick({
                                layerId,
                                variant,
                                url: notice.cta?.url,
                            });
                            return (
                                <SwipeUpWrapper
                                    key={`${layerId}-${noticeContentHash(notice)}`}
                                    enabled={isMobile && dismissible}
                                    onDismiss={onDismissNotice}
                                >
                                    <NoticeMessage
                                        notice={notice}
                                        dismissible={dismissible}
                                        onDismiss={onDismissNotice}
                                        onCtaClick={onCtaClick}
                                        size="large"
                                    />
                                </SwipeUpWrapper>
                            );
                        })}
                        {overLimit && (
                            <button
                                type="button"
                                onClick={() => toggleExpanded(position)}
                                className="pointer-events-auto rounded-full bg-white shadow-md border border-[#9CA3AF] px-3 py-1.5 text-[12px] font-garet font-bold text-graphite hover:bg-[#F0F0F0] min-h-8"
                            >
                                {isExpanded ? 'Ver menos' : `+${hiddenCount} aviso${hiddenCount === 1 ? '' : 's'}`}
                            </button>
                        )}
                    </div>
                );
            })}
            {anchoredNotices.map(({ layerId, notice }) => {
                const variant = notice.variant || 'info';
                const dismissible = notice.dismissible !== false;
                const onDismissNotice = () => {
                    trackLayerNoticeDismiss({ layerId, variant });
                    dismiss(layerId, notice);
                };
                const onCtaClick = () => trackLayerNoticeCtaClick({
                    layerId,
                    variant,
                    url: notice.cta?.url,
                });
                const arrowPos = notice.arrowPosition || 'bottom';
                const anchoredSize = notice.size || 'large';
                return (
                    <AnchoredNotice
                        key={`anchored-${layerId}-${noticeContentHash(notice)}`}
                        coord={notice.anchorCoord}
                        arrowPosition={arrowPos}
                    >
                        <div className="relative" style={arrowMarginFor(arrowPos, anchoredSize)}>
                            <NoticeMessage
                                notice={notice}
                                dismissible={dismissible}
                                onDismiss={onDismissNotice}
                                onCtaClick={onCtaClick}
                            />
                            <NoticeArrow variant={variant} position={arrowPos} size={anchoredSize} />
                        </div>
                    </AnchoredNotice>
                );
            })}
        </>
    );
};

export default LayerNotices;
