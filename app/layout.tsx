import "./globals.css";

export const metadata = {
  title: "Kas Kost",
  description: "Aplikasi kas rumah/kost",
};

// Set kelas "dark" sebelum React hydrate, supaya tidak ada kedipan
// (flash) dari tema salah saat halaman pertama kali dimuat.
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var isDark = stored ? stored === 'dark' : prefersDark;
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen transition-colors">
        {children}
      </body>
    </html>
  );
}
