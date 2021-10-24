$(".carousel-wrapper").slick({
    autoplay: true,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplaySpeed: 7000,
});

$(document).ready(function () {
    let productListContainer = $(".product-container");

    productListContainer.click(function (event) {
        let productId;
        if (!event.delegateTarget) return;
        if (!(productId = event.delegateTarget.dataset.productId)) return;
        let url = "/product/" + productId;
        location.href = url;
    });
});