const locales = {
    auth_failed: ["Ошибка авторизации", "Auth failed"],
    auth_success: ["Успешная авторизация", "Auth success"],
    auth_already_exists: ["Пользователь с таким логином уже есть", "User with this login already exists"],
    auth_already_logged: ["Вы уже авторизованы.", "You're already authorized."],
    need_auth: ["Требуется авторизация", "Need authorization."],
    invalid_params: ["Недостаточно параметров", "Not enough parameters"],
    cart_empty: ["Корзина пуста", "Cart is empty"],
    
    payment_error: ["Ошибка оплаты", "Payment error"],
    payment_success: ["Успешная оплата", "Success payment"],

    unknown_error: ["Неизвестная ошибка", "Unknown error"]
}

enum LocaleType {
    RUS = 0,
    ENG = 1
}

const locale = new class Locale {
    private currentLocale: LocaleType;
    public constructor(locale?: LocaleType) {
        this.currentLocale = locale ? locale : LocaleType.RUS;
    }

    public get(name: keyof typeof locales): string {
        return locales[name][this.currentLocale];
    }

    public setLocale(locale: LocaleType) {
        this.currentLocale = locale;

        return this;
    }
}

export default locale;