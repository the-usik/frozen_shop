class Popup {
    static WRAPPER_CLASSNAME = "popup-wrapper";
    static CONTAINER_CLASSNAME = "popup-container";
    static FOOTER_CLASSNAME = "popup-footer";
    static HIDE_CLASSNAME = "hide";

    constructor(options = {}) {
        if (!this.isValidOptions(options)) {
            throw new TypeError("Incorrect options");
        }
        this.options = options;
        this.element = null;
        this.init();
    }

    isValidOptions(options = {}) {
        let has = (options.title);
        return has;
    }

    init() {
        let wrapper = this.getWrapper();
        let container = this.createContainer();
        this.element = container;
        wrapper.appendChild(container);
        this.hide();

        if (this.options.onLoad && typeof this.options.onLoad == "function") {
            this.options.onLoad();
        }

        return this;
    }

    show() {
        this.showWrapper();
        this.showContainer();
    }

    hide() {
        this.hideWrapper();
        this.hideContainer();
    }

    showContainer() {
        let { classList } = this.element;
        if (classList.contains(Popup.HIDE_CLASSNAME)) {
            classList.remove(Popup.HIDE_CLASSNAME);
        }

        return this;
    }

    hideContainer() {
        let { classList } = this.element;
        if (!classList.contains(Popup.HIDE_CLASSNAME)) {
            classList.add(Popup.HIDE_CLASSNAME);
        }

        return this;
    }

    showWrapper() {
        let wrapper = this.getWrapper();
        if (wrapper.classList.contains(Popup.HIDE_CLASSNAME)) {
            wrapper.classList.remove(Popup.HIDE_CLASSNAME);
        }

        return wrapper;
    }

    hideWrapper() {
        let wrapper = this.getWrapper();
        if (!wrapper.classList.contains(Popup.HIDE_CLASSNAME)) {
            wrapper.classList.add(Popup.HIDE_CLASSNAME);
        }

        return this;
    }

    getWrapper() {
        let [wrapper] = document.getElementsByClassName(Popup.WRAPPER_CLASSNAME);
        if (!wrapper) {
            wrapper = document.createElement("div");
            wrapper.classList.add(Popup.WRAPPER_CLASSNAME);
        }

        return wrapper;
    }

    createContainer() {
        let { options } = this;
        let container = createDOMTree("div", { className: Popup.CONTAINER_CLASSNAME }, [
            ["div", { className: "popup-header" }, createDOMTree([
                ["p", { className: "title", innerText: options.title }],
                ["span", { className: "close", innerHTML: "&#x2716;", onclick: () => this.hide() }]
            ])],
            ["div", { className: "popup-body" }, options.body],
            options.buttons && ["div", { className: "popup-footer" }, options.buttons]
        ]);

        return container;
    }
}