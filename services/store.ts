import { MenuItem, Order, INITIAL_PIN, CartItem } from '../types';
import { INITIAL_MENU } from '../constants';

const KEYS = {
  MENU: 'st_menu',
  ORDERS: 'st_orders',
  PIN: 'st_admin_pin',
  DELIVERY_FEE: 'st_delivery_fee',
  LAST_ORDER: 'st_last_order'
};

export const getMenu = (): MenuItem[] => {
  const stored = localStorage.getItem(KEYS.MENU);
  return stored ? JSON.parse(stored) : INITIAL_MENU;
};

export const saveMenu = (menu: MenuItem[]) => {
  localStorage.setItem(KEYS.MENU, JSON.stringify(menu));
};

export const getOrders = (): Order[] => {
  const stored = localStorage.getItem(KEYS.ORDERS);
  return stored ? JSON.parse(stored) : [];
};

export const saveOrder = (order: Order) => {
  const orders = getOrders();
  // Add new order to the beginning
  const newOrders = [order, ...orders];
  localStorage.setItem(KEYS.ORDERS, JSON.stringify(newOrders));
};

export const updateOrder = (updatedOrder: Order) => {
  const orders = getOrders();
  const index = orders.findIndex(o => o.id === updatedOrder.id);
  if (index !== -1) {
    orders[index] = updatedOrder;
    localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
  }
};

export const getAdminPin = (): string => {
  return localStorage.getItem(KEYS.PIN) || INITIAL_PIN;
};

export const setAdminPin = (pin: string) => {
  localStorage.setItem(KEYS.PIN, pin);
};

export const getDeliveryFee = (): number => {
  const stored = localStorage.getItem(KEYS.DELIVERY_FEE);
  return stored ? Number(stored) : 0;
};

export const setDeliveryFee = (fee: number) => {
  localStorage.setItem(KEYS.DELIVERY_FEE, fee.toString());
};

export const saveLastOrder = (cart: CartItem[]) => {
  localStorage.setItem(KEYS.LAST_ORDER, JSON.stringify(cart));
};

export const getLastOrder = (): CartItem[] => {
  const stored = localStorage.getItem(KEYS.LAST_ORDER);
  return stored ? JSON.parse(stored) : [];
};
