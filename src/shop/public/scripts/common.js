
let signupPopup = new Popup({
    title: "Регистрация",
    body: createDOMTree([
        [
            "form",
            {
                className: "form-container",
                id: "signup-form",
            },
            [
                [
                    "div",
                    { className: "form-field-column" },
                    [
                        [
                            "div",
                            { className: "form-field" },
                            [
                                ["label", { for: "username", innerText: "Логин" }],
                                [
                                    "input",
                                    {
                                        className: "input-field",
                                        required: true,
                                        type: "text",
                                        name: "login",
                                        placeholder: "Введите имя пользователя...",
                                    },
                                ],
                            ],
                        ],
                        [
                            "div",
                            { className: "form-field" },
                            [
                                ["label", { for: "email", innerText: "E-mail" }],
                                [
                                    "input",
                                    {
                                        className: "input-field",
                                        required: true,
                                        pattern: ".+@.+\..{2,}",
                                        type: "email",
                                        name: "email",
                                        minlength: 8,
                                        placeholder: "Введите email...",
                                    },
                                ],
                            ],
                        ],
                    ],
                ],
                [
                    "div",
                    { className: "form-field-column" },
                    [
                        [
                            "div",
                            { className: "form-field" },
                            [
                                [
                                    "label",
                                    {
                                        for: "password",
                                        innerText: "Пароль",
                                    },
                                ],
                                [
                                    "input",
                                    {
                                        className: "input-field",
                                        required: true,
                                        type: "password",
                                        name: "password",
                                        placeholder: "Введите пароль...",
                                    },
                                ],
                            ],
                        ],
                        [
                            "div",
                            { className: "form-field" },
                            [
                                [
                                    "label",
                                    {
                                        for: "repeat_password",
                                        innerText: "Повторите пароль",
                                    },
                                ],
                                [
                                    "input",
                                    {
                                        className: "input-field",
                                        required: true,
                                        type: "password",
                                        name: "repeat_password",
                                        placeholder: "Повторите пароль...",
                                    },
                                ],
                            ],
                        ],
                    ],
                ],
                [
                    "input",
                    {
                        id: "signup-submit-form",
                        type: "submit",
                        hidden: true,
                    },
                ],
            ],
        ],
    ]),
    buttons: createDOMTree([
        [
            "input",
            {
                className: "button",
                value: "Зарегистрироваться",
                type: "submit",
                onclick() {
                    $("#signup-submit-form").click();
                },
            },
        ],
    ]),
    onLoad: function () {
        let form = $("#signup-form");
        form.submit(async function (event) {
            event.preventDefault();
            let formData = {};
            let data = form.serializeArray();
            for (let index in data) {
                let field = data[index];
                formData[field.name] = field.value;
            }

            let response = await request("/auth/signup", formData);

            if (response.error) {
                notification.error(response.error.message);
            } else {                
                updateAuthHeader();

                signupPopup.hide();
            }
        });
    },
});

let authPopup = new Popup({
    title: "Авторизация",
    body: createDOMTree([
        [
            "div",
            { className: "form-container", id: "auth-form" },
            [
                [
                    "div",
                    { className: "form-field-column" },
                    [
                        [
                            "div",
                            { className: "form-field" },
                            [
                                ["label", { for: "login", innerText: "Логин" }],
                                [
                                    "input",
                                    {
                                        type: "text",
                                        required: "true",
                                        name: "login",
                                        className: "input-field",
                                        placeholder: "Введите логин...",
                                    },
                                ],
                            ],
                        ],
                        [
                            "div",
                            { className: "form-field" },
                            [
                                [
                                    "label",
                                    {
                                        for: "password",
                                        innerText: "Пароль",
                                    },
                                ],
                                [
                                    "input",
                                    {
                                        type: "password",
                                        required: "true",
                                        name: "password",
                                        className: "input-field",
                                        placeholder: "Введите пароль...",
                                    },
                                ],
                            ],
                        ],
                        [
                            "p",
                            {
                                className: "show-registration-form",
                                innerText: "Создать аккаунт",
                                onclick: () => {
                                    authPopup.hide();
                                    signupPopup.show();
                                },
                            },
                        ],
                    ],
                ],
            ],
        ],
    ]),
    buttons: createDOMTree([
        [
            "input",
            {
                type: "submit",
                value: "Авторизация",
                className: "button",
                onclick: async function () {
                    let loginInput = document.querySelector(
                        "#auth-form input[name=login]"
                    );
                    let passwordInput = document.querySelector(
                        "#auth-form input[name=password]"
                    );

                    let response = await request("/auth/login", {
                        login: loginInput.value.trim(),
                        password: passwordInput.value.trim(),
                    });

                    if (response.success) {
                        let user = response.payload;
                        notification.notify(`Привет, ${user.login}`);

                        updateAuthHeader();
                        return authPopup.hide();
                    } else {
                        return notification.error(response.error.message);
                    }
                },
            },
        ],
    ]),
});

let cart = {
    showing: true,
    enableSelect: false,
    popup: new Popup({
        title: "Корзина",
        body: createDOMTree([
            [
                "div",
                { className: "cart-container" },
                [["div", { className: "cart-flex-wrapper" }]],
            ],
        ]),
        buttons: createDOMTree([
            [
                "input",
                {
                    type: "submit",
                    id: "delete-button",
                    className: "button",
                    value: "Удалить",
                },
            ],
            [
                "input",
                {
                    type: "submit",
                    id: "open-cart-button",
                    className: "button",
                    value: "Перейти",
                },
            ],
        ]),
    }),

    async show() {
        await this.reload();
        if (this.showing) this.popup.show();
    },

    async reload() {
        try {
            let response = await this.loadCarts();
            if (response.error) {
                return notification.error(response.error.message);
            }

            if (response.payload.length < 1) {
                this.showing = false;

                return notification.error(
                    "Вы не добавили ни одного товара в корзину!"
                );
            } else this.showing = true;

            this.clear();
            this.fillCartByItems(response.payload);
            this.setHandlers();
        } catch (error) {
            this.errorHandler(error);
        }
    },

    errorHandler(error) {
        notification.error(
            "Произошла ошибка, подробнее в консоли разработчика"
        );
        console.error(error);
        return this;
    },

    clear() {
        return $(".cart-block").remove();
    },

    setHandlers() {
        const selectedClassName = "selected";
        const self = this;

        $("#open-cart-button").click(function () {
            location.href = "/cart";
        });

        $(".cart-block").click(function (event) {
            const cart = $(this);
            const cartId = cart.data("id");

            cart.toggleClass(selectedClassName);
        });

        let button = document.querySelector("#delete-button");

        button.onclick = () => {
            let elements = $(".cart-block.selected");
            for (let element of elements) {
                let itemId = element.dataset.id;
                if (!itemId) continue;

                request("/api/cart.delete", { id: itemId }).catch(console.error);

                element.parentElement.removeChild(element);
            }

            const blocks = $(".cart-block");
            if (blocks.length < 1) {
                return this.popup.hide();
            }
        };
    },

    fillCartByItems(items = []) {
        let container = document.querySelector(".cart-flex-wrapper");

        for (let index in items) {
            let item = items[index];
            let element = this.createCartElement(item);

            element.dataset.id = item.id;
            container.appendChild(element);
        }

        return this;
    },

    createCartElement: function (item) {
        let data = item.data;
        let product = item.product;

        let discount = product.price - product.price * (product.discount / 100);
        let filename = product.images[0].filename;

        return createDOMTree("div", { className: "cart-block" }, [
            [
                "div",
                { className: "image-wrapper" },
                [["img", { className: "image", src: "/photos/" + filename }]],
            ],
            [
                "div",
                { className: "product-info" },
                [
                    [
                        "div",
                        {
                            className: "product-name",
                            innerText: product.name,
                        },
                    ],
                    [
                        "div",
                        {
                            className: "product-size",
                            innerText: "Размер: " + data.productSize.size,
                        },
                    ],
                    [
                        "div",
                        {
                            className: "product-count",
                            innerText: "Кол-во: " + data.count,
                        },
                    ],
                ],
            ],
            [
                "div",
                {
                    className: "product-price",
                    innerText:
                        Number(
                            (discount * Number(data.count)).toFixed(0)
                        ).toLocaleString("ru-RU") + "₽",
                },
            ],
        ]);
    },

    loadCarts: function () {
        return request("/api/cart.get");
    },
};


const notification = new Notification();
const superiorWindow = {
    init() {
        this.root = $(".superior-window");

        $(document).keydown(function (event) {
            if (event.keyCode == 27) {
                !this.isHide() && this.hide();
            }
        }.bind(this));

        this.root.find("#search-input").change(function (event) {
            let reasonElement = event.target;
            let value = reasonElement.value;
            reasonElement.value = "";
            location.href = "/?search=" + value;
            this.hide();
        }.bind(this));


        this.root.find(".menu .menu-item").click(function (event) {
            let element = event.target;
            if ("href" in element.dataset) {
                location.href = element.dataset.href;
            }
        });

        this.root.find(".close-button").click(this.hide.bind(this));

        return this;
    },

    showMenu() {
        this.show();
        let menu = this.root.find(".menu");
        this.tryShow(menu);

        return this;
    },

    hideMenu() {
        let menu = this.root.find(".menu");
        this.tryHide(menu);

        return this;
    },

    showSearchInput() {
        this.show();
        let searchBox = this.root.find(".search-box");
        let input = searchBox.find("#search-input");
        this.tryShow(searchBox);
        input.focus();

        return this;
    },

    hideSearchInput() {
        let searchBox = this.root.find(".search-box");
        this.tryHide(searchBox);

        return this;
    },

    show() {
        this.tryShow(this.root);
        return this;
    },

    hide() {
        this.tryHide(this.root);
        this.hideMenu();
        this.hideSearchInput();
        return this;
    },

    isHide() {
        return this.root.hasClass("hide");
    },

    tryHide(element) {
        var has = element.hasClass("hide");
        if (!has) {
            element.addClass("hide")
        }

        return this;
    },

    tryShow(element) {
        var has = element.hasClass("hide");
        if (has) {
            element.removeClass("hide");
        }

        return this;
    }
};

$(document).ready(function () {
    notification.init();
    superiorWindow.init();
    initDocument();
    initHeaderButtons();
    updateAuthHeader();
    
    function initDocument() {
        $(".preload").hide();
        $(".wrapper").removeClass("blur");
    }

    function initHeaderButtons() {
        $("#exit-button").click(logoutUser);
        $("#cart-button").click(cart.show.bind(cart));
        $("#auth-button").click(authPopup.show.bind(authPopup));
        $("#show-menu").click(superiorWindow.showMenu.bind(superiorWindow));
        $("#search-show-button").click(superiorWindow.showSearchInput.bind(superiorWindow));
    }
});

function updateAuthHeader() {
    request("/auth/check").then((response) => {
        response.success ? showLogoutButton() : showSignupButton();
    });
}

function showSignupButton() {
    let buttons = $(".header .right-buttons");
    buttons.find("#exit-button").hide();
    buttons.find("#auth-button").show();
}

function showLogoutButton() {
    let buttons = $(".header .right-buttons");
    buttons.find("#auth-button").hide();
    buttons.find("#exit-button").show();
}

function logoutUser() {
    request("/auth/logout")
        .then((response) => updateAuthHeader())
        .catch(console.error);
}

function calcPercent(n, p) {
    return n * (p / 100);
}