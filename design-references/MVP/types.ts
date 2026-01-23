
export type CustomerType = 'VIP' | '普通';

export interface Order {
  id: string;
  title: string;
  orderNo: string;
  date: string;
  amount: number;
  status: '核对中' | '已结清' | '待结';
}

export interface PaymentRecord {
  amount: number;
  date: string;
}

export interface Customer {
  id: string;
  name: string;
  unit: string;
  phone: string;
  balance: number;
  type: CustomerType;
  avatarColor: string;
  recentOrder?: Order;
  recentPayment?: PaymentRecord;
}

export interface SearchResult {
  customers: Customer[];
  orders: Order[];
}
