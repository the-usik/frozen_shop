import { ok } from "@shop/utils/response";
import { CITIES_FILEPATH } from "@utils/constants";
import { readFileSync } from "fs";
import apiDecorator from "./decorator";

const citiesFileContent = readFileSync(CITIES_FILEPATH, { encoding: "utf-8" });
const cities = JSON.parse(citiesFileContent);

export default [
    apiDecorator(
        "cities.get", (_, response) => {
            response.send(ok(cities))
        }
    )
]