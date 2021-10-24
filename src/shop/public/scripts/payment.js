DOMTokenList.prototype.addUnique = function (element) {
    if (this.contains(element)) return;
    this.add(element);
}
var alert = new Notification();

var cardHolderInput = document.querySelector("input[name=card_holder]");
var cardNumberInput = document.querySelector("input[name=card_number]");
var cardExpireMonthInput = document.querySelector("input[name=card_expire_month]");
var cardExpireYearInput = document.querySelector("input[name=card_expire_year]");
var cardCodeInput = document.querySelector("input[name=card_code]");
var payButton = document.querySelector(".button");


function isValidCardHolder() {
    var cardHolder = cardHolderInput.value;

    return (cardHolder !== "");
}

function isValidCardNumber() {
    let cardNumber = cardNumberInput.value;

    return cardNumber.replace(/\s+/g, "").trim().length == 16;
}

function isValidCardExpireYear() {
    var minYear = new Date().getFullYear();
    var maxYear = minYear + 10;
    var cardYear = Number(cardExpireYearInput.value);

    return (cardYear <= maxYear && cardYear >= minYear);
}

function isValidCardExpireMonth() {
    var cardMonth = Number(cardExpireMonthInput.value);

    return (cardMonth >= 1 && cardMonth <= 12);
}

function isValidCardCode() {
    return cardCodeInput.value.length == 3;
}

function isValidForm() {

    deleteIncorrectClass();

    let valid = true;
    if (!isValidCardNumber()) {
        cardNumberInput.classList.addUnique("incorrect");
        valid = false;
    }

    if (!isValidCardExpireMonth()) {
        cardExpireMonthInput.classList.addUnique("incorrect");
        valid = false;
    }

    if (!isValidCardExpireYear()) {
        cardExpireYearInput.classList.addUnique("incorrect");
        valid = false;
    }

    if (!isValidCardHolder()) {
        cardHolderInput.classList.addUnique("incorrect");
        valid = false;
    }

    if (!isValidCardCode()) {
        cardCodeInput.classList.addUnique("incorrect");
        valid = false;
    }

    return valid;
}

function deleteIncorrectClass() {
    let a = document.querySelectorAll(".incorrect");
    for (let element of a) {
        element.classList.remove("incorrect");
    }
}

cardHolderInput.oninput = function () {
    cardHolderInput.value = cardHolderInput.value.toUpperCase();
}

cardNumberInput.oninput = function () {
    var value = cardNumberInput.value.replace(/\s+/g, '').replace(/[^0-9]/gi, "");
    var matches = value.match(/\d{4,19}/g);
    var match = matches && matches[0] || "";
    var parts = [];

    for (var i = 0, length = match.length; i < length; i += 4) {
        parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
        cardNumberInput.value = parts.join(" ");
    } else {
        cardNumberInput.value = value;
    }

    if (cardNumberInput.value.replace(/\s+/g, "").length == 16) {
        cardExpireMonthInput.focus();
    }
}

cardExpireMonthInput.oninput = function () {
    if (cardExpireMonthInput.value.length == 2)
        cardExpireYearInput.focus();
}

cardExpireYearInput.oninput = function () {
    if (cardExpireYearInput.value.length == 4)
        cardCodeInput.focus();
}

function showErrorMessage(errorMessage) {
    let notificationElement = document.querySelector(".notification");
    notificationElement.innerHTML = `<div class="notify error-message">${errorMessage}</div>`;

    clearTimeout(window.globalErrorTimout);

    window.globalErrorTimout = setTimeout(() => {
        notificationElement.innerHTML = "";
    }, 4500);

    return true;
}

function setProgressStatus() {
    payButton.value = "Ожидание...";
    payButton.disabled = true;

    return true;
}


function removeProgressStatus() {
    payButton.value = "Оплата";
    payButton.disabled = false;
    return true;
}

payButton.onclick = async function () {
    try {
        setProgressStatus();
        if (!isValidForm()) {
            throw new Error("Проверьте данные формы");
        }

        request("/api/order.pay").then(response => {
            if (response.error) {
                showErrorMessage(response.error.message);
                return;
            }

            alert.notify(response.payload, 3000);
            alert.notify("Вы будете перенаправлены на главную страницу через 5 секунд");

            setTimeout(() => {
                location.href = "/";
            }, 5000);
        });

        removeProgressStatus();
        payButton.disabled = true;
    } catch (error) {
        showErrorMessage(error.message);
        removeProgressStatus();
        console.error(error);
    }
}