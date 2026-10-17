const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export interface OrderPayload {
  tableNumber: string;
  items: Array<{
    id?: string;
    name: string;
    quantity: number;
    price: number;
    notes?: string;
  }>;
  water?: {
    enabled: boolean;
    normalQty: number;
    chilledQty: number;
  };
  totalAmount?: number;
  paymentMethod: string;
  specialNotes?: string;
}

export const CreateOrder = async (orderData: OrderPayload) => {
  const response = await fetch(`${BASE_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to place order!");
  }
  return response.json();
};

export const fetchOrders = async () => {
  const response = await fetch(`${BASE_URL}/api/orders/active`);
  if (!response.ok) throw new Error("Failed to fetch orders");
  return response.json();
};

export const fetchMenuItems = async () => {
  const response = await fetch(`${BASE_URL}/api/menu`);
  if (!response.ok) throw new Error("Failed to fetch menu catalog");
  return response.json();
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  const response = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error("Failed to update status");
  return response.json();
};

export const requestServiceCall = async (
  tableNumber: number,
  reason: string = "General Waiter Service"
) => {
  const response = await fetch(`${BASE_URL}/api/service-call`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tableNumber, reason }),
  });
  if (!response.ok) throw new Error("Failed to dispatch service request");
  return response.json();
};

export const fetchStaffList = async (token: string) => {
  const response = await fetch(`${BASE_URL}/api/staff`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to fetch staff list");
  return response.json();
};

export const createStaffMember = async (token: string, staffData: any) => {
  const response = await fetch(`${BASE_URL}/api/staff`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(staffData),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to create staff member");
  }
  return response.json();
};

export const toggleStaffStatus = async (token: string, staffId: string) => {
  const response = await fetch(`${BASE_URL}/api/staff/${staffId}/toggle`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error("Failed to toggle staff status");
  return response.json();
};

export const createMenuItem = async (token: string, itemData: any) => {
  const response = await fetch(`${BASE_URL}/api/menu`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(itemData)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to create menu item");
  }
  return response.json();
};

export const updateMenuItem = async (token: string, id: string, itemData: any) => {
  const response = await fetch(`${BASE_URL}/api/menu/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(itemData)
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to update menu item");
  }
  return response.json();
};