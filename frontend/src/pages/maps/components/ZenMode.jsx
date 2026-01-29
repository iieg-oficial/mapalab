import React, { createContext, useState, useContext, useEffect } from 'react';

const ZenModeContext = createContext();

export const useZenMode = () => useContext(ZenModeContext);

export const ZenModeProvider = ({ children }) => {
    const [isZenMode, setIsZenMode] = useState(false);

    useEffect(() => {
        if (isZenMode) {
            document.body.classList.add('zen-mode-active');
        } else {
            document.body.classList.remove('zen-mode-active');
        }

        return () => {
            document.body.classList.remove('zen-mode-active');
        };
    }, [isZenMode]);

    return (
        <ZenModeContext.Provider value={{ isZenMode, setIsZenMode }}>
            {children}
            {isZenMode && (
                <style>{`
                    .zen-mode-active {
                        cursor: grab !important;
                    }
                    .zen-mode-active:active {
                        cursor: grabbing !important;
                    }
                    .zen-mode-active button, 
                    .zen-mode-active a, 
                    .zen-mode-active [role="button"] {
                        cursor: pointer !important;
                    }
                `}</style>
            )}
        </ZenModeContext.Provider>
    );
};
