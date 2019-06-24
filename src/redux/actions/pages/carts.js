export const CARTS_TOGGLE_LIST = 'toggle_list_carts';
export const CARTS_TOGGLE_SORT = 'toggle_sort_carts';
export const CART_RESET_PAGE = 'reset_page_carts';
export const CARTS_RESET_BUTTONS = 'reset_buttons_carts';

export const acToggleListCarts = () => ({
  type: CARTS_TOGGLE_LIST,
});

export const acResetPageCarts = () => ({
  type: CART_RESET_PAGE,
});

export const acResetButtonsCarts = () => ({
  type: CARTS_RESET_BUTTONS,
});

export const acToggleSortCarts = (name) => ({
  type: CARTS_TOGGLE_SORT,
  name
});

export const acUpdateComponent = (type, name) => {
  return {
    type: 'update_carts_' + type,
    name
  };
};
