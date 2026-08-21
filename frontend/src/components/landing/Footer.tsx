import { Link } from 'react-router-dom'
import { Text } from '../index'

const PRODUCT_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Updates', href: '#' },
]
const COMPANY_LINKS = [
  { label: 'About', href: '#' },
  { label: 'Contact', href: '#' },
  { label: 'Careers', href: '#' },
]
const RESOURCES_LINKS = [
  { label: 'Help Center', href: '#' },
  { label: 'Documentation', href: '#' },
  { label: 'Support', href: '#' },
]
const LEGAL_LINKS = [
  { label: 'Privacy', href: '#' },
  { label: 'Terms', href: '#' },
]

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 text-white">
              <img src="/PlazaOS%20logo.png" alt="PlazaOS" className="h-6 w-auto" />
            </Link>
            <Text variant="bodySmall" className="mt-3 text-slate-400">
              Modern management for modern plazas.
            </Text>
          </div>

          <div>
            <Text variant="h3" className="text-white">Product</Text>
            <ul className="mt-3 space-y-2">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Text variant="h3" className="text-white">Company</Text>
            <ul className="mt-3 space-y-2">
              {COMPANY_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Text variant="h3" className="text-white">Resources</Text>
            <ul className="mt-3 space-y-2">
              {RESOURCES_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Text variant="h3" className="text-white">Legal</Text>
            <ul className="mt-3 space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-800 pt-8">
          <Text variant="bodySmall" className="text-slate-500">
            PlazaOS. All rights reserved.
          </Text>
        </div>
      </div>
    </footer>
  )
}
