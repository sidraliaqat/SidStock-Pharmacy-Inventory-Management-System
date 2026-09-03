const dashboardRepository = require('../repositories/dashboardRepository');

const adminSummary = async () => {
  const [stats, recentActivity] = await Promise.all([
    dashboardRepository.getSummaryStats(),
    dashboardRepository.getRecentActivity(8),
  ]);
  return { stats, recentActivity };
};

// Staff see the same live counts minus supplier/category management context.
const userSummary = async () => {
  const stats = await dashboardRepository.getSummaryStats();
  return {
    stats: {
      total_medicines: stats.total_medicines,
      total_stock_units: stats.total_stock_units,
      low_stock: stats.low_stock,
      expiring_soon: stats.expiring_soon,
    },
  };
};

module.exports = { adminSummary, userSummary };
