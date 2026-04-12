import React from 'react';
import {
  LayoutDashboard,
  Package,
  Wallet,
  FileText,
  Settings,
  Plus
} from 'lucide-react';

/**
 * MerchantSidebar - Side navigation for merchant portal
 */
const MerchantSidebar = ({ isOpen, activeTab, onTabChange }) => {
  const menuItems = [
    {
      id: 'overview',
      label: 'نظرة عامة',
      icon: <LayoutDashboard className="w-5 h-5" />,
      description: 'ملخص أداء متجرك'
    },
    {
      id: 'orders',
      label: 'الطلبات',
      icon: <Package className="w-5 h-5" />,
      description: 'جميع طلباتك'
    },
    {
      id: 'new-order',
      label: 'إضافة طلبية جديدة',
      icon: <Plus className="w-5 h-5" />,
      description: 'أضف طلبية من فيسبوك'
    },
    {
      id: 'wallet',
      label: 'المحفظة',
      icon: <Wallet className="w-5 h-5" />,
      description: 'سجل معاملات محفظتك'
    },
    {
      id: 'invoices',
      label: 'الفواتير',
      icon: <FileText className="w-5 h-5" />,
      description: 'فواتيرك الشهرية'
    },
    {
      id: 'settings',
      label: 'الإعدادات',
      icon: <Settings className="w-5 h-5" />,
      description: 'إعدادات الحساب'
    },
    {
      id: 'shopify-link',
      label: 'طلبات Shopify 📦',
      icon: <FileText className="w-5 h-5 text-orange-500" />,
      description: 'تأكيد وتصدير لشركة التوصيل'
    }
  ];

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 bottom-0 w-64 bg-[#1a120f] border-r border-brand-gold/20 overflow-y-auto transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-start gap-4 px-4 py-3 rounded-lg transition ${
                activeTab === item.id
                  ? 'bg-brand-gold/20 border border-brand-gold/50'
                  : 'hover:bg-white/5 border border-transparent'
              }`}
            >
              <div
                className={`flex-shrink-0 ${
                  activeTab === item.id
                    ? 'text-brand-gold'
                    : 'text-gray-400'
                }`}
              >
                {item.icon}
              </div>
              <div className="text-left">
                <p
                  className={`font-medium ${
                    activeTab === item.id
                      ? 'text-brand-gold'
                      : 'text-gray-300'
                  }`}
                >
                  {item.label}
                </p>
                <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Footer Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-brand-gold/20 bg-gradient-to-t from-[#0f0a08]">
          <div className="bg-brand-gold/10 border border-brand-gold/20 rounded-lg p-3">
            <p className="text-xs text-gray-400 text-center">
              نسخة البوابة 1.0
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" />
      )}
    </>
  );
};

export default MerchantSidebar;
