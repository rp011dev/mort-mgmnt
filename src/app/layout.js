import 'bootstrap/dist/css/bootstrap.min.css'
import './globals.css'
import { UserProvider } from '../context/UserContext'
import Navigation from '../components/Navigation'
import Script from 'next/script'

export const metadata = {
  title: 'GK Finance - Mortgages & Insurance',
  description: 'Professional mortgage and insurance services - manage customer journey from enquiry to offer',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css" />
      </head>
      <body>
        <UserProvider>
          <Navigation />
          <main className="py-4">{children}</main>
        </UserProvider>
        <Script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
      </body>
    </html>
  )
}