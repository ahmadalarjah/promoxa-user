# Promoxa User Frontend

A modern Next.js application for the Promoxa user platform.

## Features

- User authentication and authorization
- Profile management
- Transaction history
- Deposit and withdrawal functionality
- Community features
- Support system
- Multi-language support
- Responsive design

## Tech Stack

- **Framework**: Next.js 15.2.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Package Manager**: pnpm
- **UI Components**: Custom components with shadcn/ui

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ahmadalarjah/promoxa-user.git
cd promoxa-user
```

2. Install dependencies:
```bash
pnpm install
```

3. Run the development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
pnpm build
pnpm start
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── change-password/    # Password change page
│   ├── community/          # Community features
│   ├── deposit/           # Deposit functionality
│   ├── forgot-password/   # Password recovery
│   ├── home/              # Home dashboard
│   ├── login/             # Login page
│   ├── notifications/     # Notifications
│   ├── orders/            # Order management
│   ├── plans/             # Subscription plans
│   ├── profile/           # User profile
│   ├── promo/             # Promotional content
│   ├── register/          # Registration page
│   ├── support/           # Support system
│   ├── team/              # Team information
│   ├── transactions/      # Transaction history
│   └── withdraw/          # Withdrawal functionality
├── components/            # Reusable components
├── contexts/              # React contexts
├── hooks/                 # Custom hooks
├── lib/                   # Utility libraries
└── public/                # Static assets
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software.

## Author

Ahmad Alarjah - fischer16290@gmail.com
