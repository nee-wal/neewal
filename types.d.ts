import { Session, User } from '@supabase/supabase-js';
import type * as React from 'react';

export { };

declare global {
    // Electron Desktop Capturer Source
    interface DesktopCapturerSource {
        id: string;
        name: string;
        thumbnail: {
            toDataURL: () => string;
        };
    }

    // Media Stream Constraints for recording
    interface RecordingConstraints extends MediaStreamConstraints {
        audio: boolean | {
            mandatory: {
                chromeMediaSource: 'desktop';
            };
        };
        video: {
            mandatory: {
                chromeMediaSource: 'desktop';
                chromeMediaSourceId: string;
                minFrameRate: number;
                maxFrameRate: number;
            };
        };
    }

    // Extended MediaStream with cleanup function
    interface ExtendedMediaStream extends MediaStream {
        _cleanupCanvas?: () => void;
    }

    interface Window {
        electron: {
            selectDirectory: () => Promise<string | null>;
            getDefaultSaveDirectory: () => Promise<string>;
            getSources: () => Promise<DesktopCapturerSource[]>;
            getPrimaryScreen: () => Promise<DesktopCapturerSource | null>;
            startRecording: () => Promise<string>;
            saveChunk: (chunk: ArrayBuffer) => Promise<void>;
            stopRecording: (saveDir: string, format: string) => Promise<string | null>;
            openRegionSelector: () => Promise<boolean>;
            closeRegionSelector: () => Promise<boolean>;
            regionSelected: (region: Region) => Promise<boolean>;
            onRegionSelected: (callback: (region: Region, sourceId?: string) => void) => void;
            prepareRecording: (id: string, includeAudio?: boolean) => Promise<boolean>;
            getRegionBackground: () => Promise<string | null>;
            showCountdown: () => Promise<boolean>;
            hideCountdown: () => Promise<boolean>;
            updateCountdown: (count: number) => Promise<boolean>;
            onCountdownUpdate: (callback: (count: number) => void) => void;
        };
    }

    type EventPayloadMapping = {
        getDefaultSaveDirectory: string;
        'dialog:selectDirectory': string | null;
        'getSources': DesktopCapturerSource[];
        'getPrimaryScreen': DesktopCapturerSource | null;
        'startRecording': string;
        'stopRecording': string | null;
        'saveChunk': void;
        'openRegionSelector': boolean;
        'closeRegionSelector': boolean;
        'regionSelected': boolean;
        'prepareRecording': boolean;
        'getRegionBackground': string | null;
        'showCountdown': boolean;
        'hideCountdown': boolean;
        'updateCountdown': boolean;
    }

    type EventParamsMapping = {
        getDefaultSaveDirectory: [];
        'dialog:selectDirectory': [];
        'getSources': [];
        'getPrimaryScreen': [];
        'startRecording': [];
        'stopRecording': [string, string];
        'saveChunk': [ArrayBuffer];
        'openRegionSelector': [];
        'closeRegionSelector': [];
        'regionSelected': [Region];
        'prepareRecording': [string, boolean?];
        'getRegionBackground': [];
        'showCountdown': [];
        'hideCountdown': [];
        'updateCountdown': [number];
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
        signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
        signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
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

    interface CountdownOverlayProps {
        count: number;
    }
}
