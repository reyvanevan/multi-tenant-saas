# 🎨 Multi-Tenant SaaS - Frontend# Shadcn Admin Dashboard



Based on **[Shadcn Admin](https://github.com/satnaing/shadcn-admin)** by **Sat Naing** - customized for multi-tenant SaaS platform.Admin Dashboard UI crafted with Shadcn and Vite. Built with responsiveness and accessibility in mind.



---![alt text](public/images/shadcn-admin.png)



## 🚀 Quick StartI've been creating dashboard UIs at work and for my personal projects. I always wanted to make a reusable collection of dashboard UI for future projects; and here it is now. While I've created a few custom components, some of the code is directly adapted from ShadcnUI examples.



```bash> This is not a starter project (template) though. I'll probably make one in the future.

# Install dependencies

pnpm install## Features



# Setup environment- Light/dark mode

cp .env.example .env- Responsive

# Edit .env with backend URL- Accessible

- With built-in Sidebar component

# Start dev server- Global search command

pnpm run dev- 10+ pages

```- Extra custom components

- RTL support

Frontend: `http://localhost:5174`

<details>

---<summary>Customized Components (click to expand)</summary>



## 🛠️ Tech StackThis project uses Shadcn UI components, but some have been slightly modified for better RTL (Right-to-Left) support and other improvements. These customized components differ from the original Shadcn UI versions.



React 19 • TypeScript • Vite • TailwindCSS • ShadcnUI • TanStack Router • ZustandIf you want to update components using the Shadcn CLI (e.g., `npx shadcn@latest add <component>`), it's generally safe for non-customized components. For the listed customized ones, you may need to manually merge changes to preserve the project's modifications and avoid overwriting RTL support or other updates.



---> If you don't require RTL support, you can safely update the 'RTL Updated Components' via the Shadcn CLI, as these changes are primarily for RTL compatibility. The 'Modified Components' may have other customizations to consider.



## 📁 Structure### Modified Components



```- scroll-area

src/- sonner

├── components/    # UI components- separator

├── features/      # Feature modules (auth, pos, etc)

├── routes/        # Pages (public, admin, tenant)### RTL Updated Components

├── stores/        # Zustand stores

├── lib/           # Utils & API client- alert-dialog

└── styles/        # Global styles- calendar

```- command

- dialog

---- dropdown-menu

- select

## 🎨 From Shadcn Admin- table

- sheet

**Original by:** Sat Naing ([@satnaing](https://github.com/satnaing))  - sidebar

**Repo:** https://github.com/satnaing/shadcn-admin  - switch

**Support:** https://buymeacoffee.com/satnaing

**Notes:**

**Kept:**

- ✅ ShadcnUI components- **Modified Components**: These have general updates, potentially including RTL adjustments.

- ✅ Sidebar layout- **RTL Updated Components**: These have specific changes for RTL language support (e.g., layout, positioning).

- ✅ Dark mode- For implementation details, check the source files in `src/components/ui/`.

- ✅ Global search (⌘K)- All other Shadcn UI components in the project are standard and can be safely updated via the CLI.



**Added:**</details>

- 🎯 Multi-tenant routing

- 💰 POS system UI## Tech Stack

- 📦 Inventory management

- 📊 Business analytics**UI:** [ShadcnUI](https://ui.shadcn.com) (TailwindCSS + RadixUI)



---**Build Tool:** [Vite](https://vitejs.dev/)



## 📚 Docs**Routing:** [TanStack Router](https://tanstack.com/router/latest)



- [Main README](../README.md)**Type Checking:** [TypeScript](https://www.typescriptlang.org/)

- [Team Workflow](../docs/TEAM_WORKFLOW.md)

- [Original Shadcn Admin README](./README_SHADCN_ADMIN.md)**Linting/Formatting:** [Eslint](https://eslint.org/) & [Prettier](https://prettier.io/)



---**Icons:** [Lucide Icons](https://lucide.dev/icons/), [Tabler Icons](https://tabler.io/icons) (Brand icons only)



**MIT License** • Built with ❤️ by Multi-Tenant Team**Auth (partial):** [Clerk](https://go.clerk.com/GttUAaK)


## Run Locally

Clone the project

```bash
  git clone https://github.com/satnaing/shadcn-admin.git
```

Go to the project directory

```bash
  cd shadcn-admin
```

Install dependencies

```bash
  pnpm install
```

Start the server

```bash
  pnpm run dev
```

## Sponsoring this project ❤️

If you find this project helpful or use this in your own work, consider [sponsoring me](https://github.com/sponsors/satnaing) to support development and maintenance. You can [buy me a coffee](https://buymeacoffee.com/satnaing) as well. Don’t worry, every penny helps. Thank you! 🙏

For questions or sponsorship inquiries, feel free to reach out at [contact@satnaing.dev](mailto:contact@satnaing.dev).

### Current Sponsor

- [Clerk](https://go.clerk.com/GttUAaK) - for backing the implementation of Clerk in this project

## Author

Crafted with 🤍 by [@satnaing](https://github.com/satnaing)

## License

Licensed under the [MIT License](https://choosealicense.com/licenses/mit/)
