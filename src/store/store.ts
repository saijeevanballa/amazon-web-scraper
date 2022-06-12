import categories from "../../categories.json";

let store = {
  BASE_FOLDER: "PRODUCTS_DATA",
  links: {
    AMAZON: (category: string, pageNumber: number = 1) => `https://www.amazon.in/s?k=${category}&page=${pageNumber}`,
  },
  categories: categories,
  data: {},
};

export default store;
