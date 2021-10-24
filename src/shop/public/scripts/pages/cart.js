
const subjectSet = {};
const STORAGE_CITIES_KEY = "cities";
const $cartContainer = $(".cart-grid");

$(document).ready(function () {
    initCache();
    updateCart();

    $("#back-to-main-button").click(function () {
        location.href = "/";
    });

    $("#pay-button").click(function () {
        orderCommit();
    });

    $("#clear-cart-button").click(function () {
        request("/api/cart.clear").then((response) => {
            $cartContainer.empty();
            updateCart();
        });
    });

    function initCache() {
        let cacheSubjects = localStorage.getItem(STORAGE_CITIES_KEY);
        if (cacheSubjects) {
            try {
                let data = JSON.parse(cacheSubjects);
                onLoadCities(data);
            } catch (error) { }
        } else {
            request("/api/cities.get")
                .then(function (response) {
                    if (response.error) {
                        return notification.error(
                            "Произошла ошибка при получении данных о городах"
                        );
                    }

                    for (let data of response.payload) {
                        if (!subjectSet[data.subject]) {
                            subjectSet[data.subject] = [];
                        }

                        subjectSet[data.subject].push(data.name);
                    }

                    localStorage.setItem(STORAGE_CITIES_KEY, JSON.stringify(subjectSet));

                    onLoadCities(subjectSet);
                });
        }
    }


    function onLoadCities(data) {
        let $subject = $("#subject");
        let $cities = $("#city");

        for (let name of Object.keys(data)) {
            $subject.append(`<option value="${name}">${name}</option>`);
        }

        updateCities();

        $subject.change(function () {
            updateCities();
        });

        function updateCities() {
            let name = $subject.val();
            $cities.empty();

            data[name].map(function (city) {
                $cities.append(`<option value=${city}>${city}</option>`);
            });
        }
    }
});

function orderCommit() {
    const formData = getFormData();

    if (!formData) {
        return orderPanic("Пожалуйста проверьте данные формы.");
    }

    request("/api/order.commit", { payload: formData })
        .then(function (response) {
            if (response.error) {
                orderPanic(response.error.message);
                return;
            }

            notification.notify("Отлично, ваш заказ оформлен.\n\nЧерез 5 секунд вы будете перенаправлены на страницу оплаты.")
            setTimeout(openPaymentPage, 5000);
        })
        .catch(function (error) {
            orderPanic(error.message);
        })
}

function openPaymentPage() {
    location.href = "/payment";
}

function orderPanic(message) {
    notification.error("Ошибка выполнения заказа.\n\n" + message);
}

function getFormData() {
    const array = $(".order-wrapper [name]").toArray();
    const data = {};

    for (let { name, value } of array) {
        if (!value && name != "flat") return null;
        data[name] = value.trim();
    }

    return {
        email: data.email,
        full_name: data.full_name,
        phone_number: data.phone_number,
        order_index: data.order_index,
        subject: data.subject,
        address: {
            city: data.city,
            street: data.street,
            home: data.home,
            flat: data.flat
        }

    }
}

function updateCart() {
    request("/api/cart.get").then(response => {
        if (!response.success) return location.href = "/";
        $(".cart-product-list").empty();
        response.payload.forEach(createCartItem);
    })
}

function createCartItem(item) {
    const size = item.data.productSize.size;
    const product = item.product;
    const image = product.images[0];
    const imageUrl = '/photos/' + image.filename;
    const price = product.for_sale ? product.price - calcPercent(product.price, product.discount) : item.product.price;
    const element = document.createElement("div");
    element.dataset.id = item.id;
    element.classList.add("cart-product");
    element.innerHTML =
        `<div class="product-image">
            <img
                src="${imageUrl}"
                alt="product image"
            />
            </div>

            <div class="product-info">
            <div class="cart-product-title">${escapeHtml(product.name)}</div>
            <div class="subinfo">
                <div class="cart-product-price">${escapeHtml(price)}₽</div>
                <div class="cart-product-size">
                Размер: <span id="product-size">${size}</span>
                </div>
                <div class="cart-product-count">
                Кол-во:
                <span id="product-count">${item.data.count}</span> шт
                </div>
            </div>
            </div>

            <div class="cart-product-buttons">
            <div id="trash-button" class="button">
                <i class="fas fa-trash-alt"></i>
            </div>
            <div class="row">
                <div id="inc-button" class="button"><span>+</span></div>
                <div id="dec-button" class="button"><span>-</span></div>
            </div>
        </div>`;

    document.querySelector(".cart-product-list").appendChild(element);
}