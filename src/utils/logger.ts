export namespace Logger {
    export enum SpecialSymbols {
        Reset = "\x1b[0m",
        Bright = "\x1b[1m",
        Dim = "\x1b[2m",
        Underscore = "\x1b[4m",
        Blink = "\x1b[5m",
        Reverse = "\x1b[7m",
        Hidden = "\x1b[8m",
    }

    export enum ForegroundColors {
        FgBlack = "\x1b[30m",
        FgRed = "\x1b[31m",
        FgGreen = "\x1b[32m",
        FgYellow = "\x1b[33m",
        FgBlue = "\x1b[34m",
        FgMagenta = "\x1b[35m",
        FgCyan = "\x1b[36m",
        FgWhite = "\x1b[37m"
    }

    export enum BackgroundColors {
        BgBlack = "\x1b[40m",
        BgRed = "\x1b[41m",
        BgGreen = "\x1b[42m",
        BgYellow = "\x1b[43m",
        BgBlue = "\x1b[44m",
        BgMagenta = "\x1b[45m",
        BgCyan = "\x1b[46m",
        BgWhite = "\x1b[47m"
    }

    const groups = {
        count: 0,
        backgroundColor: BackgroundColors.BgMagenta,
        foregroundColor: ForegroundColors.FgMagenta,
        builderParams: {} as ConsoleMessageBuilderOptions
    }

    groups.builderParams = {
        foregroundColor: groups.foregroundColor,
        backgroundColor: groups.backgroundColor,
        showPointer: false,
        showCurrentTime: false
    } as ConsoleMessageBuilderOptions;

    export function clear() {
        console.clear();
    }

    export function log(...messages: any[]) {
        let buffer = getConsoleBuilderBuffer("LOG", {
            backgroundColor: BackgroundColors.BgCyan,
            foregroundColor: ForegroundColors.FgCyan
        });

        console.log("⚡", buffer, ...messages);
    }

    export function warn(...messages: any[]) {
        let buffer = getConsoleBuilderBuffer("WARN", {
            backgroundColor: BackgroundColors.BgYellow,
            foregroundColor: ForegroundColors.FgYellow
        });

        console.log("⚠", buffer, ...messages);
    }

    export function debug(...messages: any[]) {
        let buffer = getConsoleBuilderBuffer("DEBUG", {
            backgroundColor: BackgroundColors.BgGreen,
            foregroundColor: ForegroundColors.FgGreen
        });

        console.log("🍗", buffer, ...messages);
    }

    export function error(...messages: any[]) {
        let buffer = getConsoleBuilderBuffer("ERROR", {
            backgroundColor: BackgroundColors.BgRed,
            foregroundColor: ForegroundColors.FgRed
        });

        console.log("🛑", buffer, ...messages);
    }

    export function group(...messages: any[]) {
        let buffer = getConsoleBuilderBuffer("GROUP", groups.builderParams);

        console.log(`${buffer}${ForegroundColors.FgMagenta}`, ...messages, SpecialSymbols.Reset);
        groups.count++;
    }

    export function groupEnd(...messages: any[]) {
        if (groups.count != 0) {
            groups.count--;
            let buffer = getConsoleBuilderBuffer("GROUP", groups.builderParams);

            console.log(buffer + groups.foregroundColor, ...messages, SpecialSymbols.Reset, "\n");
        }
    }

    interface ConsoleMessageBuilderOptions {
        foregroundColor: ForegroundColors;
        backgroundColor: BackgroundColors
        showCurrentTime?: boolean;
        showPointer?: boolean;
        showLabel?: boolean;
        considerGroup?: boolean;
    }

    const DEFAULT_CONSOLE_BUILDER_OPTIONS: ConsoleMessageBuilderOptions = {
        foregroundColor: ForegroundColors.FgCyan,
        backgroundColor: BackgroundColors.BgCyan,
        showLabel: true,
        showPointer: true,
        considerGroup: true,
        showCurrentTime: true
    }

    function getConsoleBuilderBuffer(label: any, options: ConsoleMessageBuilderOptions): string {
        options = {
            ...DEFAULT_CONSOLE_BUILDER_OPTIONS,
            ...options
        }

        let buffer = "";

        let {
            showCurrentTime, showPointer, showLabel,
            foregroundColor, backgroundColor, considerGroup
        } = options;

        if (considerGroup && groups.count > 0) {
            let tabString = "\t".repeat(groups.count);
            let verticalLine = `${groups.foregroundColor}|${SpecialSymbols.Reset}`;

            buffer += `${tabString}${verticalLine} `;
        }

        if (showCurrentTime) {
            let dateTime = new Date();
            let timeString = `${foregroundColor}[${dateTime.toLocaleTimeString()}]${SpecialSymbols.Reset} `;
            buffer += timeString;
        }
        if (showLabel) {
            let labelString = `${SpecialSymbols.Bright}${backgroundColor} ${label} ${SpecialSymbols.Reset} `;
            buffer += labelString;
        }

        if (showPointer) {
            let pointerString = `${foregroundColor}${SpecialSymbols.Blink}>>${SpecialSymbols.Reset}`;
            buffer += pointerString;
        }

        return buffer;
    }
}