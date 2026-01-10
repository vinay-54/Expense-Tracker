/**
 * Smart Expense Tracker - Charts Logic
 * Uses Chart.js to render visuals
 */

let expenseChart = null;
let categoryChart = null;

// Global Function exposed to dashboard.js
window.initCharts = function (transactions) {
    renderMainChart(transactions);
    renderCategoryChart(transactions);
};

window.updateCharts = function (transactions) {
    updateMainChartData(transactions);
    updateCategoryChartData(transactions);
};

// --- Main Chart (Line: Spending over time) ---
function renderMainChart(transactions) {
    const ctx = document.getElementById('expenseChart').getContext('2d');

    // Initial Empty Data
    const data = processChartData(transactions);

    expenseChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Expenses',
                data: data.values,
                borderColor: '#111827', // Black
                backgroundColor: 'rgba(17, 24, 39, 0.05)', // Transparent Black
                borderWidth: 2,
                tension: 0.4, // Smooth Splines
                pointRadius: 3,
                pointBackgroundColor: '#111827',
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#111827',
                    titleColor: '#fff',
                    bodyColor: '#fff',
                    padding: 10,
                    cornerRadius: 8,
                    displayColors: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { borderDash: [5, 5], color: '#E5E7EB' },
                    ticks: { color: '#9CA3AF' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9CA3AF' }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
}

function updateMainChartData(transactions) {
    const data = processChartData(transactions);
    expenseChart.data.labels = data.labels;
    expenseChart.data.datasets[0].data = data.values;
    expenseChart.update();
}

function processChartData(transactions) {
    const expenses = transactions
        .filter(t => t.type === 'expense')
        .sort((a, b) => new Date(a.date) - new Date(b.date)); // Oldest first for chart

    const recent = expenses.slice(-7);

    return {
        labels: recent.map(t => new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })),
        values: recent.map(t => t.amount)
    };
}

// --- Category Chart (Doughnut) ---
function renderCategoryChart(transactions) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    const data = processCategoryData(transactions);

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.values,
                backgroundColor: [
                    '#111827', // Black
                    '#374151', // Gray 700
                    '#6B7280', // Gray 500
                    '#9CA3AF', // Gray 400
                    '#D1D5DB', // Gray 300
                    '#E5E7EB'  // Gray 200
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                }
            }
        }
    });
}

function updateCategoryChartData(transactions) {
    const data = processCategoryData(transactions);
    categoryChart.data.labels = data.labels;
    categoryChart.data.datasets[0].data = data.values;
    categoryChart.update();
}

function processCategoryData(transactions) {
    const categories = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            categories[t.category] = (categories[t.category] || 0) + t.amount;
        });

    return {
        labels: Object.keys(categories),
        values: Object.values(categories)
    };
}

// --- Analytics Page Charts ---
window.initAnalyticsCharts = function (transactions) {
    // Prevent re-init/duplicates usually, but Chart.js handles canvas reuse if we destroy.
    // simpler: check if canvas exists.

    // 1. Bar Chart (Income vs Expense)
    const ctxBar = document.getElementById('analyticsBarChart');
    if (ctxBar) {
        // Simple aggregation
        const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        // Destroy existing instance if checking window.analyticsBarInstance (omitted for brevity)
        new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: ['Income', 'Expense'],
                datasets: [{
                    label: 'Amount',
                    data: [income, expense],
                    backgroundColor: ['#10B981', '#111827'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
            }
        });
    }

    // 2. Line Chart (Monthly Trend)
    const ctxLine = document.getElementById('analyticsLineChart');
    if (ctxLine) {
        // Mock Trend
        new Chart(ctxLine, {
            type: 'line',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Spending',
                    data: [120, 300, 150, 450], // Mock
                    borderColor: '#111827',
                    tension: 0.4,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
};
