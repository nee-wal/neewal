import { Session, User } from '@supabase/supabase-js';
import type * as React from 'react';

export { };

declare global {
    interface Window {
        electron: {
            selectDirectory: () => Promise<string | null>;
            getDefaultSaveDirectory: () => Promise<string>;
            getSources: () => Promise<any[]>; // returning basic DesktopCapturerSource[]
            getPrimaryScreen: () => Promise<any | null>;
            startRecording: () => Promise<string>;
            saveChunk: (chunk: ArrayBuffer) => Promise<void>;
            stopRecording: (saveDir: string) => Promise<string | null>;
            openRegionSelector: () => Promise<boolean>;
            closeRegionSelector: () => Promise<boolean>;
            regionSelected: (region: Region) => Promise<boolean>;
            onRegionSelected: (callback: (region: Region) => void) => void;
            prepareRecording: (id: string) => Promise<boolean>;
            getRegionBackground: () => Promise<string | null>;
        };
    }

    type EventPayloadMapping = {
        getDefaultSaveDirectory: string;
        'dialog:selectDirectory': string | null;
        'getSources': any[];
        'getPrimaryScreen': any | null;
        'startRecording': string;
        'stopRecording': string | null;
        'saveChunk': void;
        'openRegionSelector': boolean;
        'closeRegionSelector': boolean;
        'regionSelected': boolean;
        'prepareRecording': boolean;
        'getRegionBackground': string | null;
    }

    type EventParamsMapping = {
        getDefaultSaveDirectory: [];
        'dialog:selectDirectory': [];
        'getSources': [];
        'getPrimaryScreen': [];
        'startRecording': [];
        'stopRecording': [string];
        'saveChunk': [ArrayBuffer];
        'openRegionSelector': [];
        'closeRegionSelector': [];
        'regionSelected': [Region];
        'prepareRecording': [string];
        'getRegionBackground': [];
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

    interface RegionSelectorProps {
        isOpen: boolean;
        onRegionSelect: (region: Region) => void;
        onCancel: () => void;
    }

    interface Region {
        x: number;
        y: number;
        width: number;
        height: number;
    }
}
