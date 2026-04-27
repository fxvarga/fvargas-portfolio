import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookProjects } from '@/hooks/useBookProjects';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { useEntitlements } from '@/hooks/useEntitlements';
import { api } from '@/lib/api';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Modal } from '@/components/Modal';
import { EmptyState } from '@/components/EmptyState';
import { generateInteriorPdf, generateCoverPdf, checkDpiWarnings } from './PdfGenerator';
import type { BookProject, PrintProduct, PrintProductSlug, ShippingOption, CoverTheme } from '@/types';
import {
  BookOpen, Plus, Printer, Trash2, Package,
  AlertTriangle, Truck, DollarSign, Loader, ShoppingBag,
} from 'lucide-react';

/* ── Order History (localStorage) ──────────────────────── */

interface SavedOrder {
  id: string;
  productName: string;
  productSlug: string;
  pageCount: number;
  email: string;
  createdAt: number;
  status: 'pending' | 'ordered';
}

const ORDER_STORAGE_KEY = 'tinytoes_print_orders';

function getSavedOrders(): SavedOrder[] {
  try {
    return JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY) || '[]');
  } catch { return []; }
}

function saveOrder(order: SavedOrder) {
  const orders = getSavedOrders();
  orders.unshift(order);
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders));
}

/* ── Print Products (static fallback, fetched from API) ── */

const FALLBACK_PRODUCTS: PrintProduct[] = [
  { slug: 'print-softcover', name: 'Keepsake Softcover', description: '6x9 perfect-bound softcover', basePriceUsd: 29.99, luluPodPackageId: '0600X0900BWSTDPB060UW444MXX', minPages: 32, maxPages: 240 },
  { slug: 'print-hardcover', name: 'Heirloom Hardcover', description: '8.5x8.5 case-wrap hardcover', basePriceUsd: 49.99, luluPodPackageId: '0850X0850FCSTDCW080CW444MXX', minPages: 32, maxPages: 240 },
  { slug: 'print-premium', name: 'Linen Premium', description: '8.5x11 linen hardcover', basePriceUsd: 79.99, luluPodPackageId: '0850X1100FCSTDCW080CW444MXX', minPages: 32, maxPages: 240 },
];

/* ── PrintTab Component ──────────────────────────────────── */

export function PrintTab() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { hasAnyCoreProduct } = useEntitlements(isAuthenticated);
  const { projects, createProject, deleteProject } = useBookProjects();
  const { profile } = useProfile();
  const [products, setProducts] = useState<PrintProduct[]>(FALLBACK_PRODUCTS);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showCheckout, setShowCheckout] = useState<BookProject | null>(null);

  // Fetch print products from API
  useEffect(() => {
    api.getPrintProducts().then(setProducts).catch(() => {});
  }, []);

  const handleCreateProject = useCallback(async (name: string, skuSlug: PrintProductSlug) => {
    const project = await createProject(name, {
      babyName: profile.name || 'Baby',
      year: new Date().getFullYear().toString(),
      theme: 'classic' as CoverTheme,
      photo: profile.photo,
    }, skuSlug);
    setShowNewProject(false);
    navigate(`/book-editor/${project.id}`);
  }, [createProject, profile, navigate]);

  const canPrint = hasAnyCoreProduct();

  return (
    <div className="px-4 pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-theme-text">Print Your Book</h2>
          <p className="text-xs text-theme-muted mt-0.5">Create a beautiful physical memory book</p>
        </div>
        {canPrint && (
          <Button size="sm" onClick={() => setShowNewProject(true)}>
            <Plus size={14} className="mr-1" /> New Book
          </Button>
        )}
      </div>

      {!canPrint ? (
        <Card padding="lg">
          <EmptyState
            icon={Package}
            title="Unlock printing"
            subtitle="Purchase any TinyToes product to unlock the ability to print physical memory books."
            action={<Button onClick={() => navigate('/store')}>View Store</Button>}
          />
        </Card>
      ) : projects.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={BookOpen}
            title="No book projects yet"
            subtitle="Create your first book project and start adding your favorite memories."
            action={
              <Button onClick={() => setShowNewProject(true)}>
                <Plus size={14} className="mr-1" /> Create Book
              </Button>
            }
          />
          {/* Show formats inside the empty state so first-time users can preview their options. */}
          <div className="mt-6">
            <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wide mb-2">Available Formats</h3>
            <div className="divide-y divide-theme-accent/30">
              {products.map(p => (
                <div key={p.slug} className="flex items-center gap-3 py-3">
                  <BookOpen size={16} className="text-theme-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-theme-text">{p.name}</p>
                    <p className="text-[11px] text-theme-muted">{p.description}</p>
                  </div>
                  <p className="text-sm text-theme-muted shrink-0">
                    from ${p.basePriceUsd.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-theme-muted text-center mt-2">
              Every physical book includes all 3 digital products free
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              products={products}
              onEdit={() => navigate(`/book-editor/${project.id}`)}
              onPrint={() => setShowCheckout(project)}
              onDelete={() => deleteProject(project.id)}
            />
          ))}
        </div>
      )}

      {/* Past orders */}
      {canPrint && <OrderHistory />}

      {/* New project modal */}
      <NewProjectModal
        isOpen={showNewProject}
        onClose={() => setShowNewProject(false)}
        onConfirm={handleCreateProject}
        defaultName={`${profile.name || 'Baby'}'s Memory Book`}
        products={products}
      />

      {/* Checkout modal */}
      {showCheckout && (
        <CheckoutModal
          project={showCheckout}
          products={products}
          onClose={() => setShowCheckout(null)}
        />
      )}
    </div>
  );
}

/* ── Order History ───────────────────────────────────────── */

function OrderHistory() {
  const orders = getSavedOrders().filter(o => o.status === 'ordered');
  if (orders.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold text-theme-muted uppercase tracking-wide mb-2">Past Orders</h3>
      <div className="space-y-2">
        {orders.map(order => (
          <Card key={order.id} padding="sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                <ShoppingBag size={18} className="text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-theme-text">{order.productName}</p>
                <p className="text-[10px] text-theme-muted">
                  {order.pageCount} pages &middot; {new Date(order.createdAt).toLocaleDateString()}
                </p>
                <p className="text-[10px] text-green-600 font-medium">Order placed</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ── Project Card ────────────────────────────────────────── */

function ProjectCard({ project, products, onEdit, onPrint, onDelete }: {
  project: BookProject;
  products: PrintProduct[];
  onEdit: () => void;
  onPrint: () => void;
  onDelete: () => void;
}) {
  const pageCount = project.pages.length;
  const minPages = products[0]?.minPages ?? 24;
  const canPrint = pageCount >= minPages;
  const dpiWarnings = checkDpiWarnings(project);

  return (
    <Card padding="md" hoverable onClick={onEdit}>
      <div className="flex items-start gap-3">
        <div className="w-14 h-18 rounded-lg overflow-hidden shrink-0 flex items-center justify-center"
          style={{ backgroundColor: project.cover.theme === 'classic' ? '#FBF8F4' : project.cover.theme === 'pastel' ? '#FFF6F9' : '#FFFAF0' }}>
          {project.cover.photo ? (
            <img src={project.cover.photo} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <BookOpen size={20} className="text-theme-muted" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-theme-text truncate">{project.name}</p>
          <p className="text-[10px] text-theme-muted">
            {pageCount} page{pageCount !== 1 ? 's' : ''}
            {project.skuSlug && ` - ${products.find(p => p.slug === project.skuSlug)?.name ?? project.skuSlug}`}
          </p>
          <p className="text-[9px] text-theme-muted">
            Updated {new Date(project.updatedAt).toLocaleDateString()}
          </p>
          {!canPrint && (
            <p className="text-[10px] text-amber-600 mt-1">
              Add at least {minPages - pageCount} more page{minPages - pageCount !== 1 ? 's' : ''} to print (minimum {minPages})
            </p>
          )}
          {dpiWarnings.length > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <AlertTriangle size={10} className="text-amber-500" />
              <span className="text-[9px] text-amber-600">{dpiWarnings.length} low-res image warning{dpiWarnings.length > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        {/* Delete stays as a small icon top-right; the prominent Print CTA lives in the footer below. */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-50 text-theme-muted hover:text-red-500 shrink-0"
          title="Delete this book"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Prominent Print CTA */}
      <div className="mt-3 pt-3 border-t border-theme-accent/30" onClick={(e) => e.stopPropagation()}>
        <Button
          fullWidth
          onClick={onPrint}
          disabled={!canPrint}
        >
          <Printer size={16} className="mr-2" />
          Print This Book
        </Button>
      </div>
    </Card>
  );
}

/* ── New Project Modal ───────────────────────────────────── */

function NewProjectModal({ isOpen, onClose, onConfirm, defaultName, products }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, skuSlug: PrintProductSlug) => void;
  defaultName: string;
  products: PrintProduct[];
}) {
  const [name, setName] = useState(defaultName);
  const [selectedSku, setSelectedSku] = useState<PrintProductSlug>('print-softcover');

  useEffect(() => { setName(defaultName); }, [defaultName]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Book Project">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-theme-text block mb-1">Book Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-theme-accent/60 text-sm bg-transparent text-theme-text"
            placeholder="My Memory Book"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-theme-text block mb-2">Format</label>
          <div className="space-y-2">
            {products.map(p => (
              <button
                key={p.slug}
                onClick={() => setSelectedSku(p.slug)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  selectedSku === p.slug ? 'border-theme-primary' : 'border-theme-accent/40'
                }`}
              >
                <BookOpen size={18} className={selectedSku === p.slug ? 'text-theme-primary' : 'text-theme-muted'} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-theme-text">{p.name}</p>
                  <p className="text-[10px] text-theme-muted">{p.description}</p>
                </div>
                <p className="text-sm font-bold text-theme-primary">${p.basePriceUsd.toFixed(2)}</p>
              </button>
            ))}
          </div>
          <p className="text-[10px] text-theme-muted mt-1">You can change the format later.</p>
        </div>
        <Button fullWidth onClick={() => onConfirm(name, selectedSku)} disabled={!name.trim()}>
          Create Book
        </Button>
      </div>
    </Modal>
  );
}

/* ── Checkout Modal (SKU select, cost preview, shipping, Stripe) ── */

function CheckoutModal({ project, products, onClose }: {
  project: BookProject;
  products: PrintProduct[];
  onClose: () => void;
}) {
  const [step, setStep] = useState<'sku' | 'shipping' | 'generating'>('sku');
  const [selectedSku, setSelectedSku] = useState(project.skuSlug ?? 'print-softcover');
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState({
    name: '', street1: '', street2: '', city: '', stateCode: '', postalCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generationProgress, setGenerationProgress] = useState('');

  const product = products.find(p => p.slug === selectedSku) ?? products[0];
  const pageCount = project.pages.length;

  const handleFetchShipping = useCallback(async () => {
    if (!address.postalCode || !address.stateCode) {
      setError('Enter your zip code and state first.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const options = await api.getShippingOptions(
        product.luluPodPackageId, pageCount, address.postalCode, address.stateCode,
        address.city || undefined, address.street1 || undefined,
      );
      setShippingOptions(options);
      if (options.length > 0) setSelectedShipping(options[0].level);
      setStep('shipping');
    } catch (e: any) {
      setError(e.message || 'Failed to fetch shipping options.');
    } finally {
      setIsLoading(false);
    }
  }, [product, pageCount, address]);

  const handleCheckout = useCallback(async () => {
    if (!email || !address.name || !address.street1 || !address.city || !address.stateCode || !address.postalCode) {
      setError('Please fill in all required fields.');
      return;
    }
    setStep('generating');
    setError('');
    try {
      // 1. Generate interior PDF
      setGenerationProgress('Generating interior PDF...');
      const interiorBytes = await generateInteriorPdf(project);
      const interiorBlob = new Blob([interiorBytes], { type: 'application/pdf' });

      // 2. Get cover dimensions from Lulu (returned in points)
      setGenerationProgress('Fetching cover dimensions...');
      const coverDims = await api.getCoverDimensions(product.luluPodPackageId, pageCount);

      // 3. Generate cover PDF
      setGenerationProgress('Generating cover PDF...');
      const coverBytes = await generateCoverPdf(
        project.cover,
        product.slug,
        coverDims.widthPt,  // already in points
        coverDims.heightPt, // already in points
      );
      const coverBlob = new Blob([coverBytes], { type: 'application/pdf' });

      // 4. Upload both PDFs
      setGenerationProgress('Uploading interior PDF...');
      const interiorUpload = await api.uploadPdf(interiorBlob, 'interior');

      setGenerationProgress('Uploading cover PDF...');
      const coverUpload = await api.uploadPdf(coverBlob, 'cover');

      // 5. Create checkout session
      setGenerationProgress('Creating checkout...');
      const { url } = await api.printCheckout({
        productSlug: product.slug,
        interiorBlobId: interiorUpload.blobId,
        coverBlobId: coverUpload.blobId,
        pageCount,
        email,
        shippingLevel: selectedShipping,
        shippingAddress: {
          name: address.name,
          street1: address.street1,
          street2: address.street2 || undefined,
          city: address.city,
          stateCode: address.stateCode,
          postalCode: address.postalCode,
          countryCode: 'US',
        },
      });

      // 6. Save order to localStorage before redirect
      const orderId = `order-${Date.now()}`;
      saveOrder({
        id: orderId,
        productName: product.name,
        productSlug: product.slug,
        pageCount,
        email,
        createdAt: Date.now(),
        status: 'pending',
      });
      // Store pending order id so success page can mark it
      localStorage.setItem('tinytoes_pending_order', orderId);

      // 7. Redirect to Stripe
      window.location.href = url;
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
      setStep('shipping');
    }
  }, [project, product, pageCount, email, address, selectedShipping]);

  return (
    <Modal isOpen={true} onClose={onClose} title="Print Book">
      {step === 'sku' && (
        <div className="space-y-4">
          <p className="text-sm text-theme-text font-semibold">{project.name} ({pageCount} pages)</p>

          {/* SKU selector */}
          <div className="space-y-2">
            {products.map(p => (
              <button
                key={p.slug}
                onClick={() => setSelectedSku(p.slug)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  selectedSku === p.slug ? 'border-theme-primary' : 'border-theme-accent/40'
                }`}
              >
                <BookOpen size={20} className={selectedSku === p.slug ? 'text-theme-primary' : 'text-theme-muted'} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-theme-text">{p.name}</p>
                  <p className="text-[10px] text-theme-muted">{p.description}</p>
                </div>
                <p className="text-sm font-bold text-theme-primary">${p.basePriceUsd.toFixed(2)}</p>
              </button>
            ))}
          </div>

          {/* Cost preview — show our retail price, not Lulu's cost */}
          <Card padding="sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign size={14} className="text-theme-primary" />
                <span className="text-sm text-theme-text">Book price</span>
              </div>
              <span className="text-sm font-bold text-theme-text">${product.basePriceUsd.toFixed(2)}</span>
            </div>
          </Card>

          {/* Shipping address fields */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-theme-text">Shipping Address</h3>
            <input
              type="email"
              placeholder="Email for order updates"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-theme-accent/60 text-sm bg-transparent text-theme-text"
            />
            <input
              type="text"
              placeholder="Full name"
              value={address.name}
              onChange={e => setAddress(a => ({ ...a, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-theme-accent/60 text-sm bg-transparent text-theme-text"
            />
            <input
              type="text"
              placeholder="Street address"
              value={address.street1}
              onChange={e => setAddress(a => ({ ...a, street1: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-theme-accent/60 text-sm bg-transparent text-theme-text"
            />
            <input
              type="text"
              placeholder="Apt, suite, etc. (optional)"
              value={address.street2}
              onChange={e => setAddress(a => ({ ...a, street2: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-theme-accent/60 text-sm bg-transparent text-theme-text"
            />
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="City"
                value={address.city}
                onChange={e => setAddress(a => ({ ...a, city: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-theme-accent/60 text-sm bg-transparent text-theme-text"
              />
              <input
                type="text"
                placeholder="State"
                value={address.stateCode}
                onChange={e => setAddress(a => ({ ...a, stateCode: e.target.value.toUpperCase().slice(0, 2) }))}
                maxLength={2}
                className="px-3 py-2 rounded-xl border border-theme-accent/60 text-sm bg-transparent text-theme-text"
              />
              <input
                type="text"
                placeholder="ZIP"
                value={address.postalCode}
                onChange={e => setAddress(a => ({ ...a, postalCode: e.target.value }))}
                className="px-3 py-2 rounded-xl border border-theme-accent/60 text-sm bg-transparent text-theme-text"
              />
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <Button fullWidth loading={isLoading} onClick={handleFetchShipping}>
            <Truck size={14} className="mr-1" /> Get Shipping Options
          </Button>
        </div>
      )}

      {step === 'shipping' && (
        <div className="space-y-4">
          <button onClick={() => setStep('sku')} className="text-xs text-theme-primary font-medium">
            Back to book options
          </button>

          <h3 className="text-sm font-semibold text-theme-text">Choose Shipping</h3>
          <div className="space-y-2">
            {shippingOptions.map(opt => (
              <button
                key={opt.level}
                onClick={() => setSelectedShipping(opt.level)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  selectedShipping === opt.level ? 'border-theme-primary' : 'border-theme-accent/40'
                }`}
              >
                <Truck size={16} className={selectedShipping === opt.level ? 'text-theme-primary' : 'text-theme-muted'} />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-theme-text">{opt.name}</p>
                  <p className="text-[10px] text-theme-muted">{opt.estimatedDays}</p>
                </div>
                <p className="text-sm font-bold text-theme-primary">${opt.costUsd.toFixed(2)}</p>
              </button>
            ))}
          </div>

          {/* Total */}
          <Card padding="md">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-theme-muted">Book</span>
                <span className="text-theme-text">${product.basePriceUsd.toFixed(2)}</span>
              </div>
              {selectedShipping && shippingOptions.find(o => o.level === selectedShipping) && (
                <div className="flex justify-between text-sm">
                  <span className="text-theme-muted">Shipping</span>
                  <span className="text-theme-text">${shippingOptions.find(o => o.level === selectedShipping)!.costUsd.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-theme-accent/40 pt-2 flex justify-between text-sm font-bold">
                <span className="text-theme-text">Total</span>
                <span className="text-theme-primary">
                  ${(product.basePriceUsd + (shippingOptions.find(o => o.level === selectedShipping)?.costUsd ?? 0)).toFixed(2)}
                </span>
              </div>
              <p className="text-[9px] text-theme-muted">+ applicable tax calculated at checkout</p>
            </div>
          </Card>

          <p className="text-[10px] text-theme-muted text-center">
            Includes all 3 digital products free with your print order
          </p>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <Button fullWidth onClick={handleCheckout}>
            <Printer size={14} className="mr-1" /> Proceed to Payment
          </Button>
        </div>
      )}

      {step === 'generating' && (
        <div className="flex flex-col items-center gap-4 py-8">
          <Loader size={32} className="text-theme-primary animate-spin" />
          <p className="text-sm font-medium text-theme-text">{generationProgress}</p>
          <p className="text-xs text-theme-muted">This may take a moment...</p>
        </div>
      )}
    </Modal>
  );
}
