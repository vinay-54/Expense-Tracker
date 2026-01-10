/**
 * Smart Expense Tracker - Authentication Logic
 * Handles Login, Signup, Password Toggle, and LocalStorage management.
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const togglePasswordBtns = document.querySelectorAll('.toggle-password');
    const passwordInput = document.getElementById('password');
    const strengthMeter = document.querySelector('.strength-meter');
    const strengthBar = document.querySelector('.strength-bar');
    const strengthText = document.querySelector('.strength-text');

    // --- 1. Password Visibility Toggle ---
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Find the input in the same wrapper
            const input = btn.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                btn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
            } else {
                input.type = 'password';
                btn.innerHTML = '<i class="fa-regular fa-eye"></i>';
            }
        });
    });

    // --- 2. Password Strength Meter (Signup Only) ---
    if (passwordInput && strengthMeter) {
        passwordInput.addEventListener('input', () => {
            const val = passwordInput.value;
            strengthMeter.style.display = val.length > 0 ? 'block' : 'none';

            let strength = 0;
            if (val.length >= 6) strength++;
            if (val.length >= 10) strength++;
            if (/[A-Z]/.test(val)) strength++;
            if (/[0-9]/.test(val)) strength++;
            if (/[^A-Za-z0-9]/.test(val)) strength++;

            // Update UI
            let color = '#EF4444'; // Red (Weak)
            let text = 'Weak';
            let width = '33%';

            if (strength >= 4) {
                color = '#10B981'; // Green (Strong)
                text = 'Strong';
                width = '100%';
            } else if (strength >= 2) {
                color = '#F59E0B'; // Orange (Medium)
                text = 'Medium';
                width = '66%';
            }

            strengthBar.style.backgroundColor = color;
            strengthBar.style.width = width;
            strengthText.textContent = text;
            strengthText.style.color = color;
        });
    }

    // --- 3. Login Handling ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const remember = document.getElementById('remember').checked;

            // Simple Validation
            if (!email || !password) {
                showError('Please fill in all fields');
                return;
            }

            // Retrieve User from LocalStorage
            const storedUser = JSON.parse(localStorage.getItem('expenseUser'));

            if (storedUser && storedUser.email === email && storedUser.password === password) {
                // Success
                if (remember) {
                    localStorage.setItem('rememberedUser', email);
                }

                // Animate out
                document.querySelector('.auth-card').classList.remove('slide-up');
                document.querySelector('.auth-card').style.transform = 'translateY(-20px)';
                document.querySelector('.auth-card').style.opacity = '0';

                setTimeout(() => {
                    window.location.href = '../dashboard/index.html';
                }, 300);
            } else {
                showError('Invalid email or password');
            }
        });
    }

    // --- 4. Signup Handling ---
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const firstName = document.getElementById('firstName').value;
            const lastName = document.getElementById('lastName').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            // Validation
            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }

            if (password.length < 6) {
                showError('Password must be at least 6 characters');
                return;
            }

            // Save to LocalStorage
            const user = {
                firstName,
                lastName,
                email,
                password // Note: In production, NEVER store plain text passwords
            };

            // Since this is a simple mock, we overwrite the "expenseUser"
            // In a better mock, we would check if email exists in a "users" array.
            localStorage.setItem('expenseUser', JSON.stringify(user));

            // Redirect to Login (No Auto-Login)
            alert('Account created successfully! Please log in.');
            window.location.href = 'login.html';
        });
    }

    // Helper: Simple Alert for now (Could be toasted later)
    function showError(msg) {
        alert(msg); // Placeholder for a nicer UI toast
    }

    // --- 5. Pre-fill if remembered ---
    const rememberedEmail = localStorage.getItem('rememberedUser');
    if (rememberedEmail && document.getElementById('email')) {
        document.getElementById('email').value = rememberedEmail;
    }
});
