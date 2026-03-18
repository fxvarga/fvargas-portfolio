import Container from '../ui/Container';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-12">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 5h12M3 9h9M3 13h10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="font-heading font-bold text-xl text-white">
                Ops<span className="text-primary-400">Blueprint</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Workflow automation consulting for small and mid-size businesses.
              We turn manual chaos into structured, automated workflows.
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
                <a href="mailto:hello@opsblueprint.com" className="hover:text-white transition-colors">
                  hello@opsblueprint.com
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
