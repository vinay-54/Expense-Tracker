/**
 * Smart Expense Tracker - Dashboard Logic
 * Handles Data Loading, Calculations, CRUD for Transactions
 */

// State
let currentUser = null;
let transactions = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Check
    const storedUser = localStorage.getItem('expenseUser');
    if (!storedUser) {
        window.location.href = '../auth/login.html';
        return;
    }
    currentUser = JSON.parse(storedUser);

    // 2. Initial Setup
    setupUI();
    setupNavigation(); // Initialize Navigation
    initCustomDropdowns(); // Initialize Custom Dropdowns
    if (window.loadSettings) window.loadSettings();
    loadTransactions();
    updateSummary();
    renderTransactionList();

    // Initialize Charts (from charts.js)
    if (window.initCharts) {
        window.initCharts(transactions);
    }
});

// --- UI Helper: Custom Dropdowns ---
function initCustomDropdowns() {
    const dropdowns = document.querySelectorAll('.custom-select-container');

    dropdowns.forEach(dropdown => {
        const trigger = dropdown.querySelector('.custom-select-trigger');
        const input = dropdown.querySelector('input[type="hidden"]');
        const currentText = dropdown.querySelector('.selected-text');
        const options = dropdown.querySelectorAll('.custom-option');

        // Toggle Open
        trigger.addEventListener('click', (e) => {
            // Close others
            dropdowns.forEach(d => {
                if (d !== dropdown) d.classList.remove('open');
            });
            dropdown.classList.toggle('open');
            e.stopPropagation();
        });

        // Select Option
        options.forEach(option => {
            option.addEventListener('click', () => {
                // Update State
                options.forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');

                // Update UI
                const val = option.dataset.value;
                const text = option.innerText || option.textContent; // Handle icons embedded

                input.value = val;
                currentText.innerHTML = option.innerHTML; // Keep icons if any

                dropdown.classList.remove('open');

                // Trigger Change event for other listeners (like chart filter)
                const event = new Event('change');
                input.dispatchEvent(event);
            });
        });
    });

    // Close on click outside
    document.addEventListener('click', () => {
        dropdowns.forEach(d => d.classList.remove('open'));
    });
}

// --- UI Setup ---
function setupUI() {
    // Set Welcome Message
    document.getElementById('welcomeMsg').textContent = `Hello, ${currentUser.firstName}`;

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('rememberedUser'); // Optional: keep or clear
            window.location.href = '../auth/login.html';
        }
    });

    // Modal Logic
    const modal = document.getElementById('transactionModal');
    const fabBtn = document.getElementById('addTxBtn');
    const closeBtn = document.querySelector('.close-modal');
    const overlay = document.querySelector('.modal-overlay');

    fabBtn.addEventListener('click', () => {
        modal.classList.add('active');
        document.querySelector('.modal-content').classList.remove('slide-up');
        void document.querySelector('.modal-content').offsetWidth; // Trigger reflow
        document.querySelector('.modal-content').classList.add('slide-up');
    });

    const closeModal = () => modal.classList.remove('active');
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);

    // Dynamic Category Logic
    const typeRadios = document.querySelectorAll('input[name="type"]');
    typeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            updateCategoryOptions(e.target.value);
        });
    });

    // Form Submit
    const form = document.getElementById('transactionForm');
    form.addEventListener('submit', handleAddTransaction);

    // Set Date Input to Today
    document.getElementById('date').valueAsDate = new Date();

    // --- Dark Mode Logic ---
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        // Load state
        const isDark = localStorage.getItem('darkMode') === 'true';
        if (isDark) {
            document.body.classList.add('dark-mode');
            darkModeToggle.checked = true;
        }

        // Toggle Listener
        darkModeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'false');
            }
        });
    }

    // --- Wallet Buttons Logic ---
    // Use delegation or attach if elements exist (they do in DOM, just hidden)
    // Note: Use a more specific selector to avoid conflicts or ensure buttons exist
    setTimeout(() => {
        const walletBtns = document.querySelectorAll('.action-btn');
        walletBtns.forEach(btn => {
            // Clone to remove old listeners if any, or just add
            btn.addEventListener('click', () => {
                // Check button text to differentiate actions
                if (btn.innerHTML.includes('Add New Card')) {
                    alert('Add Card Feature: Coming Soon!');
                } else if (btn.innerHTML.includes('Quick Transfer')) {
                    alert('Transfer Feature: Coming Soon!');
                }
            });
        });
    }, 1000); // Delay slightly to ensure DOM is fully ready if needed
}

function updateCategoryOptions(type) {
    const expenseOpts = ['Food', 'Shopping', 'Transport', 'Bills', 'Entertainment', 'Other'];
    const incomeOpts = ['Salary', 'Business', 'Other'];

    const dropdown = document.getElementById('categoryDropdown');
    const options = dropdown.querySelectorAll('.custom-option');
    const input = document.getElementById('category');
    const triggerText = dropdown.querySelector('.selected-text');

    // Determine which to show
    const currentOpts = type === 'income' ? incomeOpts : expenseOpts;

    options.forEach(opt => {
        const val = opt.dataset.value;
        if (currentOpts.includes(val)) {
            opt.style.display = 'flex';
        } else {
            opt.style.display = 'none';
        }
    });

    // Reset Selection to first available
    const firstAvailable = currentOpts[0];
    input.value = firstAvailable;

    // Update Text/Icon for reset (Quick fix logic)
    // Find option element for the default value
    const defaultOpt = Array.from(options).find(o => o.dataset.value === firstAvailable);
    if (defaultOpt) {
        triggerText.innerHTML = defaultOpt.innerHTML;
        options.forEach(o => o.classList.remove('selected'));
        defaultOpt.classList.add('selected');
    }
}

// --- Navigation ---
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link[data-target]');
    const views = document.querySelectorAll('.view-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // 1. Update Active Link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // 2. Switch View
            const targetId = link.getAttribute('data-target');
            views.forEach(view => {
                view.classList.remove('active');
                if (view.id === targetId) {
                    view.classList.add('active');
                    // Trigger Charts if Analytics
                    if (targetId === 'view-analytics' && window.initAnalyticsCharts) {
                        // Small timeout to allow display:block to render
                        setTimeout(() => window.initAnalyticsCharts(transactions), 100);
                    }
                }
            });
        });
    });
}

// --- Settings Logic ---
window.loadSettings = function () {
    if (currentUser && document.getElementById('settingsName')) {
        document.getElementById('settingsName').value = currentUser.firstName + " " + currentUser.lastName;
        document.getElementById('settingsEmail').value = currentUser.email;

        // Ensure Dark Mode Toggle state is consistent if Settings loaded later
        const isDark = localStorage.getItem('darkMode') === 'true';
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) darkModeToggle.checked = isDark;
    }
}

document.getElementById('settingsForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('Settings Saved! (Simulation)');
});

// --- Data Management ---
function loadTransactions() {
    const storedTx = localStorage.getItem(`transactions_${currentUser.email}`);
    transactions = storedTx ? JSON.parse(storedTx) : [];
}

function saveTransactions() {
    localStorage.setItem(`transactions_${currentUser.email}`, JSON.stringify(transactions));
    updateSummary();
    renderTransactionList();
    if (window.updateCharts) {
        window.updateCharts(transactions);
    }
}

function handleAddTransaction(e) {
    e.preventDefault();

    const type = document.querySelector('input[name="type"]:checked').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    const note = document.getElementById('note').value;

    const newTx = {
        id: Date.now(),
        type,
        amount,
        category,
        date,
        note
    };

    transactions.unshift(newTx); // Add to top
    saveTransactions();

    saveTransactions();

    // Reset & Close
    e.target.reset();
    document.getElementById('date').valueAsDate = new Date();
    document.getElementById('transactionModal').classList.remove('active');
}

// --- Rendering ---
function updateSummary() {
    // ... existing summary logic ...
    const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;

    document.getElementById('totalBalance').textContent = formatMoney(balance);
    document.getElementById('totalIncome').textContent = formatMoney(income);
    document.getElementById('totalExpense').textContent = formatMoney(expense);

    // Also update Wallet Card if present
    // For now, Wallet Card is static visual, but we could update its "Balance" if we added a placeholder there.
    // Ideally we update the wallet list too:
    renderWalletTransactions();
}

function renderWalletTransactions() {
    const list = document.getElementById('walletTransactionList');
    if (!list) return;

    list.innerHTML = '';
    if (transactions.length === 0) {
        list.innerHTML = '<li class="empty-state" style="text-align:center; padding:1rem; color:#6B7280;">No activity yet.</li>';
        return;
    }

    // Show recent 10 for wallet
    const recent = transactions.slice(0, 10);

    recent.forEach(tx => {
        const li = document.createElement('li');
        li.className = 'transaction-item';
        const iconClass = getCategoryIcon(tx.category);
        const sign = tx.type === 'income' ? '+' : '-';
        const colorClass = tx.type === 'income' ? 'income' : 'expense';

        li.innerHTML = `
            <div class="tx-details">
                <h4 style="display:flex; align-items:center; gap:0.5rem;">
                    <i class="${iconClass}" style="opacity:0.7;"></i> ${tx.category}
                </h4>
                <span>${new Date(tx.date).toLocaleDateString()}</span>
            </div>
            <div class="tx-amount ${colorClass}">
                ${sign}${formatMoney(tx.amount)}
            </div>
        `;
        list.appendChild(li);
    });
}

function renderTransactionList() {
    const list = document.getElementById('transactionList');
    list.innerHTML = '';

    if (transactions.length === 0) {
        list.innerHTML = '<li class="empty-state" style="text-align:center; padding:1rem; color:#6B7280;">No transactions yet. Start adding!</li>';
        return;
    }

    // Show only last 5 for recent
    const recent = transactions.slice(0, 5);

    recent.forEach(tx => {
        const li = document.createElement('li');
        li.className = 'transaction-item';

        const iconClass = getCategoryIcon(tx.category);
        const sign = tx.type === 'income' ? '+' : '-';
        const colorClass = tx.type === 'income' ? 'income' : 'expense';

        li.innerHTML = `
            <div class="tx-icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="tx-details">
                <h4>${tx.category}</h4>
                <span>${new Date(tx.date).toLocaleDateString()} ${tx.note ? '• ' + tx.note : ''}</span>
            </div>
            <div class="tx-amount ${colorClass}">
                ${sign}${formatMoney(tx.amount)}
            </div>
            <button class="delete-btn" onclick="deleteTransaction(${tx.id})" style="background:none; border:none; color:#EF4444; cursor:pointer; margin-left:1rem; opacity:0.5; transition:opacity 0.2s;">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
        // Hover effect for delete button
        li.querySelector('.delete-btn').addEventListener('mouseover', function () { this.style.opacity = '1'; });
        li.querySelector('.delete-btn').addEventListener('mouseout', function () { this.style.opacity = '0.5'; });

        list.appendChild(li);
    });
}

// Global for delete (since used in HTML onclick)
window.deleteTransaction = function (id) {
    if (confirm('Delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
    }
};

// Start Helpers
function formatMoney(amount) {
    return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getCategoryIcon(category) {
    const map = {
        'Food': 'fa-solid fa-utensils',
        'Shopping': 'fa-solid fa-bag-shopping',
        'Transport': 'fa-solid fa-car',
        'Bills': 'fa-solid fa-file-invoice-dollar',
        'Entertainment': 'fa-solid fa-film',
        'Other': 'fa-solid fa-circle-question'
    };
    return map[category] || 'fa-solid fa-money-bill'; // Default
}
