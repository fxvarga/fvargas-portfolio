import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showCart?: boolean;
  cartCount?: number;
  rightElement?: React.ReactNode;
}

const TOAST_SLUG = import.meta.env.VITE_TOAST_RESTAURANT_SLUG || 'pinchos-lounge';

function Header({ title, showBack = false, showCart = false, cartCount = 0, rightElement }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-dark-bg/95 backdrop-blur-sm px-4 py-3 flex items-center justify-between">
      <div className="w-10">
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            className="text-white hover:text-neon-pink transition-colors"
            aria-label="Go back"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
      </div>

      {title && (
        <h1 className="font-script text-2xl neon-text text-center flex-1">{title}</h1>
      )}

      <div className="w-10 flex justify-end">
        {showCart && (
          <a
            href={`https://order.toasttab.com/${TOAST_SLUG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative text-white hover:text-neon-pink transition-colors"
            aria-label="View cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-neon-green text-dark-bg text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </a>
        )}
        {rightElement}
      </div>
    </header>
  );
}

export default Header;
