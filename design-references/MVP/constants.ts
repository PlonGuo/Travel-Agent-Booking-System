
import { Customer, Order } from './types';

export const CATEGORIES = [
  "全部结算方",
  "中国国旅 (12)",
  "康辉旅游 (8)",
  "中旅国际 (5)",
  "凯撒旅游 (3)",
  "私营业主 (15)"
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: '1',
    name: '汤奇',
    unit: '上海国旅总社',
    phone: '138****8888',
    balance: 12850.00,
    type: 'VIP',
    avatarColor: 'bg-blue-100 text-primary',
    recentOrder: {
      id: 'o1',
      title: '北京-东京往返机票',
      orderNo: 'TR-20231025-01',
      date: '2023-10-25',
      amount: 8640.00,
      status: '核对中'
    },
    recentPayment: {
      amount: 5000.00,
      date: '2023-10-20'
    }
  },
  {
    id: '2',
    name: '李春林',
    unit: '康辉旅游分部',
    phone: '159****2233',
    balance: 8400.00,
    type: '普通',
    avatarColor: 'bg-emerald-100 text-emerald-600',
    recentOrder: {
      id: 'o2',
      title: '泰国普吉岛团费',
      orderNo: 'TR-20231024-11',
      date: '2023-10-24',
      amount: 4200.00,
      status: '待结'
    }
  },
  {
    id: '3',
    name: '张美玲',
    unit: '独立领队',
    phone: '131****0099',
    balance: 0.00,
    type: 'VIP',
    avatarColor: 'bg-purple-100 text-purple-600'
  },
  {
    id: '4',
    name: '汤小圆',
    unit: '上海国旅总社',
    phone: '138****5555',
    balance: 2400.00,
    type: 'VIP',
    avatarColor: 'bg-blue-100 text-primary'
  },
  {
    id: '5',
    name: '汤圆圆',
    unit: '私营业主',
    phone: '139****1234',
    balance: 0.00,
    type: '普通',
    avatarColor: 'bg-slate-100 text-slate-500'
  }
];

export const MOCK_ORDERS: Order[] = [
  {
    id: 'o1',
    title: '汤小圆 - 北京往返巴黎含税机票',
    orderNo: 'TR-20231025-01',
    date: '2023-10-25',
    amount: 8640.00,
    status: '核对中'
  },
  {
    id: 'o2',
    title: '汤小圆 - 普吉岛5天4晚自由行',
    orderNo: 'TR-20231018-05',
    date: '2023-10-18',
    amount: 4200.00,
    status: '已结清'
  }
];
