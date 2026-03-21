import Container from '../ui/Container';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.svg" alt="OpsBlueprint logo" className="w-8 h-8" />
              <span className="font-heading font-bold text-xl text-white">
                Ops<span className="text-primary-400">Blueprint</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Workflow automation built for small businesses.
              We handle the busywork so you can focus on your customers.
            </p>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#services" className="hover:text-white transition-colors">Workflow Audit</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Core Automation</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Advanced Systems</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-white mb-4">Get In Touch</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#lead-form" className="hover:text-white transition-colors">
                  Request a Consultation
                </a>
              </li>
              <li>
                <a href="mailto:fxvarga@gmail.com" className="hover:text-white transition-colors">
                  fxvarga@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} OpsBlueprint. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
