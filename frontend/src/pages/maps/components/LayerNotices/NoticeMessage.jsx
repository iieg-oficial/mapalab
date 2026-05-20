import Message from '@components/Message';
import {
    DEFAULT_VARIANT_ICON,
    NOTICE_SIZE_WIDTH_CLASS,
    NOTICE_VARIANT_BORDER,
} from '@pages/maps/helpers/noticeHelpers';

const NoticeCta = ({ cta, onClick }) => (
    <a
        href={cta.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className="inline-block mt-1.5 text-[12px] font-garet font-bold text-purple hover:text-[#70308A] underline min-h-8 py-1"
    >
        {cta.label} →
    </a>
);

const NoticeMessage = ({ notice, dismissible, onDismiss, onCtaClick, size: sizeOverride }) => {
    const variant = notice.variant || 'info';
    const iconName = notice.icon ?? DEFAULT_VARIANT_ICON[variant];
    const size = sizeOverride || notice.size || 'large';
    const widthClass = NOTICE_SIZE_WIDTH_CLASS[size] || NOTICE_SIZE_WIDTH_CLASS.large;
    const borderClass = NOTICE_VARIANT_BORDER[variant] ?? NOTICE_VARIANT_BORDER.info;
    return (
        <Message
            variant={variant}
            title={notice.title}
            description={notice.description}
            icon={iconName}
            closable={dismissible}
            onClose={onDismiss}
            size={size}
            className={`${widthClass} pointer-events-auto ${borderClass}`}
        >
            {notice.cta?.label && notice.cta?.url && (
                <NoticeCta cta={notice.cta} onClick={onCtaClick} />
            )}
        </Message>
    );
};

export default NoticeMessage;
