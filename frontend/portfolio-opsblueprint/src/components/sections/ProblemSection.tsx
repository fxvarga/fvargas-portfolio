import Section from '../layout/Section';
import useScrollReveal from '../../hooks/useScrollReveal';

const problems = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "You're the owner AND the admin",
    description: "Copying data between spreadsheets, updating CRMs, chasing invoices — you didn't start a business to do data entry all day.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    ),
    title: 'Leads slip through the cracks',
    description: 'Without a dedicated sales team, inquiries pile up in your inbox. By the time you reply, the prospect has moved on.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: 'Quotes and proposals eat up your evenings',
    description: "Building each proposal from scratch takes time you don't have. It's after-hours work that delays your pipeline.",
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    title: "You can't afford a full IT team",
    description: "Hiring developers or an operations manager isn't in the budget yet, but you've outgrown sticky notes and spreadsheets.",
  },
];

export default function ProblemSection() {
  const headerReveal = useScrollReveal();
  const gridReveal = useScrollReveal({ threshold: 0.1 });

  return (
    <Section>
      <div className="text-center mb-12" ref={headerReveal.ref} style={headerReveal.style}>
        <h2 className="font-heading font-bold text-3xl sm:text-4xl text-gray-900">
          Running a small business shouldn't mean doing everything manually
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
          If you're wearing every hat in your business, these probably hit close to home.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-6" ref={gridReveal.ref} style={gridReveal.style}>
        {problems.map((problem, i) => (
          <div
            key={i}
            className="flex gap-4 p-6 rounded-xl bg-white border border-gray-100 shadow-sm"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
              {problem.icon}
            </div>
            <div>
              <h3 className="font-heading font-semibold text-gray-900 mb-1">
                {problem.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {problem.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}