import { useState, useEffect } from 'react';
import Modal from '@components/Modal';
import { fetchReleaseNotes, releaseNotes as fallbackNotes, CURRENT_VERSION, RELEASE_TAGS } from '@pages/maps/helpers/releaseNotes';

const WhatsNewModal = ({ isOpen, onClose }) => {
    const [notes, setNotes] = useState(fallbackNotes);

    useEffect(() => {
        if (!isOpen) return;
        fetchReleaseNotes().then(setNotes);
    }, [isOpen]);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Novedades v${CURRENT_VERSION}`}
            width="max-w-sm"
            height="max-h-[70vh]"
        >
            <div className="px-6 py-4 space-y-5">
                {notes.map((release, idx) => {
                    const isCurrent = idx === 0;
                    return (
                        <div key={release.version}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[13px] font-semibold ${isCurrent ? 'text-[#5c2472]' : 'text-[#91a1ac]'}`}>
                                    v{release.version}
                                </span>
                                {isCurrent && (
                                    <span className="text-[10px] font-medium text-white bg-[#5c2472] px-2 py-0.5 rounded-full">
                                        actual
                                    </span>
                                )}
                            </div>
                            <ul className="space-y-2">
                                {release.items.map((item, itemIdx) => {
                                    const tag = RELEASE_TAGS[item.tag];
                                    return (
                                        <li
                                            key={itemIdx}
                                            className={`flex items-start gap-2 text-[12px]/[16px] ${isCurrent ? 'text-[#465055]' : 'text-[#91a1ac]'}`}
                                        >
                                            <span
                                                className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0"
                                                style={{ backgroundColor: isCurrent ? '#FF8300' : '#c8d0d8' }}
                                            />
                                            <span className="flex-1">
                                                {tag && (
                                                    <span
                                                        className="inline-block text-[9px] font-semibold uppercase mr-1.5 px-1.5 py-px rounded-sm text-white"
                                                        style={{ backgroundColor: isCurrent ? tag.color : '#c8d0d8' }}
                                                    >
                                                        {tag.label}
                                                    </span>
                                                )}
                                                {item.text}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                            {idx < notes.length - 1 && (
                                <div className="mt-4 border-b border-[#EFF3FC]" />
                            )}
                        </div>
                    );
                })}
            </div>
        </Modal>
    );
};

export default WhatsNewModal;
