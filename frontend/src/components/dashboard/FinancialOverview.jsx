import React from 'react';
import { 
  FaArrowUp, 
  FaArrowDown, 
  FaWallet, 
  FaMoneyBillWave,
  FaChartLine,
  FaPiggyBank 
} from 'react-icons/fa';
import { formatCurrency } from '../../utils/helpers';

const FinancialOverview = ({ user, insights }) => {
  const stats = [
    {
      title: 'Current Balance',
      value: user?.balance || 0,
      icon: FaWallet,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12.5%',
      trend: 'up',
    },
    {
      title: 'Monthly Income',
      value: user?.monthlyIncome || 0,
      icon: FaMoneyBillWave,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: '+5.2%',
      trend: 'up',
    },
    {
      title: 'Monthly Expenses',
      value: insights?.totalSpent || 0,
      icon: FaChartLine,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: '-3.1%',
      trend: 'down',
    },
    {
      title: 'Total Savings',
      value: user?.totalSavings || 0,
      icon: FaPiggyBank,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: '+8.7%',
      trend: 'up',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div key={index} className="card hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600">{stat.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {formatCurrency(stat.value, user?.currency)}
              </p>
              <div className="flex items-center mt-2">
                {stat.trend === 'up' ? (
                  <FaArrowUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <FaArrowDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change} from last month
                </span>
              </div>
            </div>
            <div className={`${stat.bgColor} p-3 rounded-lg`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FinancialOverview;