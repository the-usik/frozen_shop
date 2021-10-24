export interface ProductData {
    _id?: any;
    name: string;
    description: string;
    price: number;
    forSale: boolean;
    discount: number;
    color: string;
    sizes: {
        count: number;
        name: string;
    }[],
    category: string;
    sex: number;
    imageUrls: string[];
}

export interface ProductFullData {
    _id?: string;
    name: string;
    color: string;
    description: string;
    price: number;
    sex: number;
    views: number;
    category: {
        _id: string;
        name_en: string;
        name_ru: string;
    };
    sizes: {
        _id: string; purchased: number;
        count: number;
        size: { _id: string; name: string; }
    }[];
    for_sale: boolean;
    discount: number;
    images: {
        _id: string;
        type: number;
        filename: string;
    }[];
}