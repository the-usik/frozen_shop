function Notification() {
    let container = document.querySelector(".notifications");

    this.init = function () {
        if (!container) {
            container = document.createElement("div");
            container.classList.add("notifications");
            document.body.appendChild(container);
        }

        return container;
    }

    this.notify = function (message, timeout) {
        return createNotifyElement(message, false, timeout);
    }

    this.error = function (errorMessage, timeout) {
        return createNotifyElement(errorMessage, true, timeout)
    }

    function createNotifyElement(message, isError, timeout) {
        let element = createDOMTree("div", { className: "notify" + (isError ? " error" : "") }, [
            [
                "span", {
                    id: "close",
                    innerHTML: "&#10005;"
                }
            ],
            [
                "p", {
                    className: "notify-content",
                    innerText: message
                }
            ]
        ]);

        let timer = setTimeout(removeNotify.bind(this, element), timeout || 5000);
        let closeButton = element.querySelector("#close");

        closeButton.onclick = function () {
            clearTimeout(timer);
            return removeNotify(element);
        }

        container.appendChild(element);
        return element;
    }

    function removeNotify(element) {
        return container.removeChild(element);
    }
}