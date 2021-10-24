import { Context, Scenes } from "telegraf";

interface BotWizardSession extends Scenes.WizardSessionData {
    state: any;
}

interface BotSession extends Scenes.WizardSession<BotWizardSession> {
    page: number;
    currentRoute: number;
    auth: boolean;
    database: {
        categories: CategoryElement[];
        sizes: SizeElement[];
    }
}

export interface BotContext extends Context {
    match: RegExpMatchArray | null;
    // declare session type
    session: BotSession;

    // declare scene type
    scene: Scenes.SceneContextScene<BotContext, BotWizardSession>
    // declare wizard type
    wizard: Scenes.WizardContextWizard<BotContext> & { state: any; }
}

type CategoryElement = {
    _id: string;
    name_en: string;
    name_ru: string;
}

type SizeElement = {
    _id: string;
    name: string;
}