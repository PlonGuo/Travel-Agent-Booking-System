
import React, { useState, useEffect, useRef } from 'react';
import { Customer, Order } from './types';
import { CATEGORIES, MOCK_CUSTOMERS, MOCK_ORDERS } from './constants';

// --- Header Component ---
const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-[100] flex items-center justify-between border-b border-gray-200 bg-white/90 backdrop-blur-md px-8 py-3">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3 text-primary">
          <div className="size-8">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H17.3334V17.3334H30.6666V30.6666H44V44H4V4Z" fill="currentColor"></path>
            </svg>
          </div>
          <h1 className="text-[#111318] text-xl font-bold leading-tight tracking-tight">旅游财务核算系统</h1>
        </div>
        <nav className="hidden md:flex items-center gap-8 ml-4">
          <a className="text-primary text-sm font-bold border-b-2 border-primary py-4" href="#">首页概览</a>
          <a className="text-gray-500 text-sm font-medium hover:text-primary transition-colors" href="#">账务核对</a>
          <a className="text-gray-500 text-sm font-medium hover:text-primary transition-colors" href="#">客户档案</a>
          <a className="text-gray-500 text-sm font-medium hover:text-primary transition-colors" href="#">数据统计</a>
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <span className="text-sm font-bold text-gray-900">王会计</span>
          <span className="text-xs text-gray-500">高级管理员</span>
        </div>
        <div 
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-gray-100 shadow-inner" 
          style={{ backgroundImage: `url("https://picsum.photos/id/64/100/100")` }}
        />
      </div>
    </header>
  );
};

// --- Add Customer Modal ---
interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddCustomerModal: React.FC<AddCustomerModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal content */}
      <div className="relative w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h1 className="text-xl font-bold text-[#111318] font-display">添加客户</h1>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="p-6 space-y-5 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar">
          <div className="flex flex-col gap-1.5">
            <label className="text-[#111318] text-sm font-semibold">客户名称 <span className="text-red-500">*</span></label>
            <input className="w-full rounded-lg border-[#dbdee6] focus:ring-primary focus:border-primary h-12 px-4 text-sm" placeholder="请输入客户名称" type="text" />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[#111318] text-sm font-semibold">客户来源</label>
            <input className="w-full rounded-lg border-[#dbdee6] focus:ring-primary focus:border-primary h-12 px-4 text-sm" placeholder="例如：军分区" type="text" />
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[#111318] text-sm font-semibold">开票公司</label>
            <select className="custom-select-arrow w-full rounded-lg border-[#dbdee6] focus:ring-primary focus:border-primary h-12 px-4 text-sm text-gray-500">
              <option disabled selected value="">请选择开票公司</option>
              <option value="1">Travel Plus 旅游有限公司</option>
              <option value="2">环球联程会计师事务所</option>
              <option value="3">地平线旅行社</option>
            </select>
          </div>
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[#111318] text-sm font-semibold">备注</label>
            <textarea className="w-full rounded-lg border-[#dbdee6] focus:ring-primary focus:border-primary min-h-[120px] resize-none px-4 py-3 text-sm" placeholder="请输入备注信息..."></textarea>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end items-center gap-3">
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-slate-600 font-medium text-sm hover:bg-slate-200/50 transition-colors">
            取消
          </button>
          <button className="px-6 py-2.5 rounded-lg bg-primary hover:bg-blue-700 text-white font-semibold text-sm shadow-sm shadow-blue-200 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">person_add</span>
            添加客户
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Search Dropdown ---
interface SearchDropdownProps {
  isVisible: boolean;
  searchTerm: string;
}

const SearchDropdown: React.FC<SearchDropdownProps> = ({ isVisible, searchTerm }) => {
  if (!isVisible) return null;

  const filteredCustomers = MOCK_CUSTOMERS.filter(c => 
    c.name.includes(searchTerm) || c.unit.includes(searchTerm)
  );

  return (
    <div className="absolute top-[calc(100%+0.75rem)] left-0 right-0 bg-white rounded-3xl border border-gray-200 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] z-[80] overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-top-4 duration-300">
      <div className="p-6 border-b border-gray-100 space-y-6">
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">tune</span> 分类筛选
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-4 py-1.5 bg-primary/10 text-primary text-sm font-bold rounded-full border border-primary/20 cursor-pointer">全部结果</span>
            <span className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-full hover:border-primary hover:text-primary transition-all cursor-pointer">VIP客户</span>
            <span className="px-4 py-1.5 bg-white border border-gray-200 text-gray-600 text-sm font-medium rounded-full hover:border-primary hover:text-primary transition-all cursor-pointer">有欠款客户</span>
          </div>
        </div>
        
        <div className="space-y-3">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">calendar_today</span> 时间范围
          </p>
          <div className="flex items-center gap-3 bg-slate-50 border border-gray-200 px-4 py-2 rounded-xl cursor-pointer hover:border-primary transition-colors">
            <span className="material-symbols-outlined text-gray-400">event_note</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 leading-none">起始日期</span>
              <span className="text-sm font-medium text-gray-700">2023-10-01</span>
            </div>
            <span className="mx-2 text-gray-300">—</span>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 leading-none">结束日期</span>
              <span className="text-sm font-medium text-gray-700">2023-10-31</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
        <div className="px-4 py-3 text-xs font-bold text-gray-400 flex items-center justify-between">
          <span>匹配客户 ({filteredCustomers.length})</span>
          <span className="text-[10px] font-normal cursor-pointer hover:text-primary transition-colors">输入关键词检索更多</span>
        </div>
        
        {filteredCustomers.map(customer => (
          <div key={customer.id} className="flex items-center justify-between p-4 hover:bg-blue-50/80 cursor-pointer rounded-2xl transition-all group border border-transparent hover:border-blue-100">
            <div className="flex items-center gap-4">
              <div className={`size-12 rounded-full ${customer.avatarColor} flex items-center justify-center font-bold text-lg`}>
                {customer.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-base">{customer.name}</span>
                  {customer.type === 'VIP' && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md border border-blue-100">VIP核心客户</span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{customer.unit} | 手机: {customer.phone}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-400 font-bold uppercase">当前待结算</p>
              <p className={`text-lg font-bold ${customer.balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                ¥ {customer.balance.toLocaleString()}
              </p>
            </div>
          </div>
        ))}

        <div className="px-4 py-3 text-xs font-bold text-gray-400 flex items-center gap-2 border-t border-gray-50 mt-2">
          <span>匹配订单 ({MOCK_ORDERS.length})</span>
        </div>
        {MOCK_ORDERS.map(order => (
          <div key={order.id} className="flex items-center justify-between p-4 hover:bg-blue-50/80 cursor-pointer rounded-2xl transition-all group border border-transparent hover:border-blue-100">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-primary transition-all">
                <span className="material-symbols-outlined">receipt_long</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{order.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">订单号: {order.orderNo} | 日期: {order.date}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${order.status === '核对中' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                {order.status}
              </span>
              <p className="text-sm font-bold text-gray-900 mt-1">¥ {order.amount.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
        <button className="text-sm font-bold text-primary hover:underline flex items-center justify-center gap-1 mx-auto py-1 group">
          查看全部相关搜索结果 
          <span className="material-symbols-outlined text-sm transition-transform group-hover:translate-x-1">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};

// --- Main App ---
const App: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("全部结算方");
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>('1');

  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchFocus = () => {
    setIsSearchVisible(true);
  };

  const toggleExpand = (id: string) => {
    setExpandedCustomerId(prev => prev === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-display">
      <Header />
      
      <main className="w-full max-w-6xl mx-auto px-6 py-12 relative">
        {/* Search Section */}
        <div className="mb-16 relative">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">欢迎回来，今天想查找什么？</h2>
              <p className="text-gray-500 text-lg">快速检索客户名称、联系电话或未结订单</p>
            </div>
            <div className="relative" ref={searchContainerRef}>
              <div className="relative flex w-full items-stretch rounded-2xl h-16 bg-white shadow-xl shadow-primary/5 border-2 border-primary ring-8 ring-primary/5 z-[70]">
                <div className="text-primary flex items-center justify-center pl-6">
                  <span className="material-symbols-outlined text-2xl">search</span>
                </div>
                <input 
                  className="form-input flex w-full flex-1 border-none bg-transparent focus:ring-0 text-lg font-medium text-[#111318] placeholder:text-gray-400 px-4" 
                  placeholder="输入客户姓名 (如: 汤奇) 或 拼音首字母..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={handleSearchFocus}
                />
                <div className="flex items-center justify-center pr-4">
                  <button className="bg-primary text-white px-8 py-2.5 rounded-xl text-base font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-primary/30">
                    搜索
                  </button>
                </div>
              </div>
              <SearchDropdown isVisible={isSearchVisible} searchTerm={searchTerm} />
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-10 overflow-x-auto custom-scrollbar">
          <div className="flex items-center gap-3 pb-4">
            {CATEGORIES.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-base font-bold whitespace-nowrap transition-all ${
                  activeCategory === cat 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "bg-white text-gray-600 border border-gray-200 hover:border-primary hover:text-primary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Customer List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-2xl">person_search</span>
              当前待处理客户 (24)
            </h3>
            <div className="flex gap-6">
              <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">filter_list</span>
                筛选
              </button>
              <button className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">sort</span>
                金额排序
              </button>
            </div>
          </div>

          {MOCK_CUSTOMERS.slice(0, 3).map(customer => (
            <div 
              key={customer.id} 
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className={`size-14 rounded-full ${customer.avatarColor} flex items-center justify-center text-xl font-bold shadow-sm`}>
                    {customer.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h4 className="text-xl font-bold text-gray-900">{customer.name}</h4>
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded border uppercase ${
                        customer.type === 'VIP' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                      }`}>
                        {customer.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 font-medium">
                      所属单位: {customer.unit} <span className="mx-2 opacity-30">|</span> 联系方式: {customer.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-10">
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">待结算金额</p>
                    <p className={`text-2xl font-bold ${customer.balance > 0 ? 'text-red-600' : 'text-gray-300'}`}>
                      ¥ {customer.balance.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="px-6 py-2.5 bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-white hover:border-primary hover:text-primary transition-all">查看明细</button>
                    <button 
                      onClick={() => toggleExpand(customer.id)}
                      className={`p-2 rounded-full transition-all hover:bg-primary/5 ${expandedCustomerId === customer.id ? 'text-primary bg-primary/5 rotate-180' : 'text-gray-400'}`}
                    >
                      <span className="material-symbols-outlined">expand_more</span>
                    </button>
                  </div>
                </div>
              </div>

              {expandedCustomerId === customer.id && (
                <div className="px-6 pb-6 pt-2 bg-slate-50/50 border-t border-gray-100 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                    {customer.recentOrder && (
                      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-orange-500 text-lg">flight_takeoff</span>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">最近订单 ({customer.recentOrder.date.slice(5)})</span>
                        </div>
                        <p className="text-base font-bold text-gray-900">{customer.recentOrder.title}</p>
                        <p className="text-xs text-gray-400 mt-2">单号: {customer.recentOrder.orderNo}</p>
                      </div>
                    )}
                    
                    {customer.recentPayment && (
                      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-green-500 text-lg">history</span>
                          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">最近回款</span>
                        </div>
                        <p className="text-base font-bold text-gray-900">¥ {customer.recentPayment.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-2">日期: {customer.recentPayment.date}</p>
                      </div>
                    )}

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center items-center gap-3">
                      <button className="w-full py-2.5 text-sm font-bold text-white bg-primary rounded-xl hover:bg-blue-700 transition-colors shadow-md shadow-primary/20">录入回款</button>
                      <button className="w-full py-2.5 text-sm font-bold text-primary bg-white border-2 border-primary/10 rounded-xl hover:border-primary transition-all">生成账单</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          <div className="mt-12 text-center">
            <button className="px-10 py-3.5 bg-white border-2 border-gray-100 text-gray-500 font-bold rounded-2xl hover:border-primary hover:text-primary hover:bg-white transition-all shadow-sm">
              显示更多客户
            </button>
          </div>
        </div>
      </main>

      {/* FABs */}
      <div className="fixed bottom-10 right-10 flex flex-col gap-4 z-[90]">
        <button className="size-14 rounded-full bg-white shadow-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-all group relative">
          <span className="material-symbols-outlined text-2xl">help_center</span>
          <span className="absolute right-full mr-4 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">使用帮助</span>
        </button>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="size-16 rounded-full bg-primary shadow-2xl shadow-primary/40 flex items-center justify-center text-white hover:scale-105 hover:bg-blue-700 active:scale-95 transition-all group relative"
        >
          <span className="material-symbols-outlined text-3xl">add</span>
          <span className="absolute right-full mr-4 bg-gray-800 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">新增账单/客户</span>
        </button>
      </div>

      <AddCustomerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default App;
