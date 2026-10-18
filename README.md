<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>DineFlow - Restaurant Management System</title>

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }

        body {
            background-color: #f8f8f8;
            color: #333;
        }

        /* Navigation Bar */
        nav {
            background-color: #8b0000;
            color: white;
            padding: 18px 60px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .logo {
            font-size: 28px;
            font-weight: bold;
        }

        .logo span {
            color: #ffd700;
        }

        nav ul {
            list-style: none;
            display: flex;
            gap: 30px;
        }

        nav ul li a {
            color: white;
            text-decoration: none;
            font-size: 16px;
        }

        nav ul li a:hover {
            color: #ffd700;
        }

        /* Hero Section */
        .hero {
            min-height: 500px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px;
            background: linear-gradient(
                rgba(0, 0, 0, 0.6),
                rgba(0, 0, 0, 0.6)
            ),
            url("https://images.unsplash.com/photo-1517248135467-4c7edcad34c4")
            center/cover;
            color: white;
        }

        .hero h1 {
            font-size: 55px;
            margin-bottom: 15px;
        }

        .hero h1 span {
            color: #ffd700;
        }

        .hero p {
            font-size: 20px;
            margin-bottom: 30px;
        }

        .btn {
            background-color: #ffd700;
            color: #333;
            padding: 14px 30px;
            border: none;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            cursor: pointer;
        }

        .btn:hover {
            background-color: white;
        }

        /* Features */
        .features {
            padding: 60px 8%;
            text-align: center;
        }

        .features h2 {
            font-size: 32px;
            margin-bottom: 40px;
            color: #8b0000;
        }

        .feature-container {
            display: flex;
            justify-content: center;
            gap: 25px;
            flex-wrap: wrap;
        }

        .card {
            background: white;
            width: 250px;
            padding: 30px 20px;
            border-radius: 12px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }

        .card .icon {
            font-size: 45px;
            margin-bottom: 15px;
        }

        .card h3 {
            margin-bottom: 10px;
            color: #8b0000;
        }

        .card p {
            color: #666;
            line-height: 1.5;
        }

        /* About Section */
        .about {
            background-color: #fff;
            padding: 60px 10%;
            text-align: center;
        }

        .about h2 {
            color: #8b0000;
            font-size: 32px;
            margin-bottom: 20px;
        }

        .about p {
            max-width: 800px;
            margin: auto;
            line-height: 1.8;
            color: #555;
        }

        /* Footer */
        footer {
            background-color: #222;
            color: white;
            text-align: center;
            padding: 25px;
        }

        footer span {
            color: #ffd700;
        }
    </style>
</head>

<body>

    <!-- Navigation -->
    <nav>
        <div class="logo">Dine<span>Flow</span></div>

        <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#">Login</a></li>
        </ul>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
        <div>
            <h1>Welcome to <span>DineFlow</span></h1>

            <p>
                Smart Restaurant Management Made Simple
            </p>

            <a href="#features" class="btn">
                Explore DineFlow
            </a>
        </div>
    </section>

    <!-- Features Section -->
    <section class="features" id="features">

        <h2>DineFlow Features</h2>

        <div class="feature-container">

            <div class="card">
                <div class="icon">🍽️</div>
                <h3>Table Management</h3>
                <p>
                    Easily manage restaurant tables,
                    reservations and customer seating.
                </p>
            </div>

            <div class="card">
                <div class="icon">📋</div>
                <h3>Order Management</h3>
                <p>
                    Take, track and manage customer
                    orders quickly and efficiently.
                </p>
            </div>

            <div class="card">
                <div class="icon">👨‍🍳</div>
                <h3>Kitchen Management</h3>
                <p>
                    Send orders directly to the kitchen
                    and monitor food preparation.
                </p>
            </div>

            <div class="card">
                <div class="icon">💳</div>
                <h3>Billing</h3>
                <p>
                    Generate accurate bills and manage
                    restaurant payments with ease.
                </p>
            </div>

        </div>
    </section>

    <!-- About Section -->
    <section class="about" id="about">

        <h2>About DineFlow</h2>

        <p>
            DineFlow is a modern restaurant management system
            designed to simplify daily restaurant operations.
            It helps restaurant staff manage tables, orders,
            kitchen operations and billing from one centralized
            platform.
        </p>

    </section>

    <!-- Footer -->
    <footer>
        <p>
            © 2026 <span>DineFlow</span>. All Rights Reserved.
        </p>
    </footer>

</body>
</html>
