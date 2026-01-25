import { Session, User } from '@supabase/supabase-js';
import type * as React from 'react';

export { };

declare global {
    interface Window {
        electron: {
            selectDirectory: () => Promise<string | null>;
            getDefaultSaveDirectory: () => Promise<string>;
        };
    }

    type EventPayloadMapping = {
        getDefaultSaveDirectory: string;
        'dialog:selectDirectory': string | null;
    }

    interface SettingsModalProps {
        isOpen: boolean;
        onClose: () => void;
        frameRate: number;
        onFrameRateChange: (fps: number) => void;
        saveDirectory: string;
        onSelectDirectory: () => void;
    }

    type AuthContextType = {
        session: Session | null;
        user: User | null;
        isGuest: boolean;
        loading: boolean;
        signInWithEmail: (email: string, password: string) => Promise<{ error: any }>;
        signUpWithEmail: (email: string, password: string) => Promise<{ error: any }>;
        loginAsGuest: () => Promise<void>;
        signOut: () => Promise<void>;
    };

    interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
        variant?: 'default' | 'outline' | 'ghost' | 'link';
        size?: 'default' | 'sm' | 'lg' | 'icon';
    }

    type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

    interface AudioControlsProps {
        micActive: boolean;
        onToggleMic: () => void;
        systemActive: boolean;
        onToggleSystem: () => void;
    }

    interface FormatSelectorProps {
        format: string;
        onFormatChange: (format: string) => void;
    }

    interface RecordButtonProps {
        isRecording: boolean;
        onClick: () => void;
    }

    interface SettingsModalProps {
        isOpen: boolean;
        onClose: () => void;
        frameRate: number;
        onFrameRateChange: (fps: number) => void;
        saveDirectory: string;
        onSelectDirectory: () => void;
        showCursor: boolean;
        onShowCursorChange: (show: boolean) => void;
        countdown: boolean;
        onCountdownChange: (enabled: boolean) => void;
    }

    type SourceMode = 'screen' | 'window' | 'region';

    interface SourceSelectorProps {
        selectedMode: SourceMode;
        onSelectMode: (mode: SourceMode) => void;
    }

    interface TimerDisplayProps {
        seconds: number;
    }
}
