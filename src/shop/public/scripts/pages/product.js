$(document).ready(function () {
    initWindowObject();
    initSize();
    initImageAnimation();
    updateProductInfo();
    function initWindowObject() {
        if (!window.cur) {
            window.cur = {}
        }
        window.cur.selectedSizeId = null;
        window.cur.isSizeSelected = false;
        window.cur.price = 0;
        window.cur.counter = 1;
        window.cur.correct = false;
    }

    function initImageAnimation() {
        $(".product-images").slick({
            autoplay: true,
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: true,
            dots: true,
            autoplaySpeed: 7000,
        });

        $(".product-image-item").zoom();
        $(".product-images-view").slick({
            dots: true,
            arrows: false,
            infinity: true,
            slidesToShow: 1,
            slidesToScroll: 1,
        });
    }

    function initSize() {
        const sizesBlock = $(".product-sizes");

        sizesBlock.find("[data-product-sizeid]").click(function () {
            const self = $(this);
            const data = self.data();
            if (!data.productSizeid) return;

            const sizeId = data.productSizeid;

            if (window.cur.isSizeSelected && window.cur.selectedSizeId == sizeId) {
                return;
            }

            unselectSizes();
            self.toggleClass("selected");

            cur.isSizeSelected = true;
            cur.selectedSizeId = sizeId;

            updateProductInfo();
        });
    }

    function unselectSizes() {
        $("[data-product-sizeid]").each(function (index, element) {
            $(this).removeClass("selected");
        });
    }

    function updateProductInfo() {
        let selectedSize = getCurrentSize();
        let price = getProductPrice();
        updateCounter();

        if (selectedSize) {
            $("#product-total-count").text(selectedSize.count);
            cur.correct = true;
        }
        
        
        $("#product-total-price").text(price * cur.counter);
        $("#add-to-cart").prop("disabled", !cur.correct);
    }

    function updateCounter() {
        $("#counter").text(cur.counter);
    }

    function getProductPrice() {
        return cur.product.for_sale ? cur.product.price - calcPercent(cur.product.price, cur.product.discount) : cur.product.price;
    }

    function getCurrentSize() {
        return cur.product.sizes.find(a => a._id == cur.selectedSizeId);
    }

    $("#counter-inc").click(function () {
        let size = getCurrentSize();
        if (!size) {
            return notification.error("Пожалуйста, укажите размер для увеличения количества")
        }
        if (size.count <= cur.counter + 1) {
            return notification.error("Больше товаров в наличии нет.");
        }
        cur.counter++;
        updateProductInfo();
    })

    $("#counter-dec").click(function () {
        if (cur.counter < 2) return;
        cur.counter--;
        updateProductInfo();
    })

    $("#add-to-cart").click(async function () {
        if (!cur.selectedSizeId) {
            return notification.error("Пожалуйста укажите размер!");
        }

        let response = await request("/api/cart.add", {
            id: cur.product._id,
            data: {
                size_id: cur.selectedSizeId,
                count: cur.counter
            }
        });

        if (response.error) {
            return notification.error(
                "При добавлении товара произошла ошибка: " + response.error.message
            );
        }

        cur.counter = 1;
        cur.isSizeSelected = false;
        cur.selectedSizeId = null;

        unselectSizes();

        notification.notify("Товар добавлен в корзину");
    });
});