import axios from "axios";
const baseUrl = "http://localhost:80/api";

test("Database unit testing", () => {
    it("should be correct response the product list", () => {
        const testUrl = new URL("product.getAll", baseUrl).toString();
        axios.post(testUrl)
            .then(({ data }) => expect(data).toBeDefined())
            .catch((error) => expect(error).not.toBeDefined());
    })

    it("should be correct add the product to db", () => {
        const testUrl = new URL("product.add", baseUrl).toString();
        const productData = {
            name: "test",
            description: "some description of the product",
            price: 3_000,
            forSale: false,
            discount: 0,
            color: "purple",
            sizes: [
                {
                    count: 10,
                    name: "XS",
                },
                {
                    count: 600,
                    name: "L",
                }
            ],
            category: "Бомбер",
            sex: 2,
            imageUrls: []
        }

        axios.post(testUrl, productData)
            .then(({ data }) => expect(data).toBeDefined())
            .catch((error) => expect(error).not.toBeDefined());
    })
})