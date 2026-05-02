import Foundation
import StoreKit

/// Manages StoreKit 2 in-app purchases for the First Year Bundle.
@MainActor
class StoreKitManager: ObservableObject {
    static let productId = "com.tinytoes.app.firstyearbundle"

    @Published private(set) var product: Product?
    @Published private(set) var isPurchased = false
    @Published private(set) var isLoading = false
    @Published private(set) var errorMessage: String?

    /// The verified transaction ID after a successful purchase (for server verification).
    @Published private(set) var transactionId: String?

    private var updateTask: Task<Void, Never>?

    init() {
        updateTask = listenForTransactions()
        Task { await loadProducts() }
        Task { await checkEntitlement() }
    }

    deinit {
        updateTask?.cancel()
    }

    // MARK: - Load Products

    func loadProducts() async {
        do {
            let products = try await Product.products(for: [Self.productId])
            product = products.first
        } catch {
            print("[StoreKit] Failed to load products: \(error)")
        }
    }

    // MARK: - Purchase

    func purchase() async {
        guard let product else { return }

        isLoading = true
        errorMessage = nil

        do {
            let result = try await product.purchase()
            switch result {
            case .success(let verification):
                let transaction = try checkVerified(verification)
                transactionId = String(transaction.originalID)
                isPurchased = true
                await transaction.finish()
            case .userCancelled:
                break
            case .pending:
                errorMessage = "Purchase is pending approval."
            @unknown default:
                break
            }
        } catch {
            errorMessage = "Purchase failed: \(error.localizedDescription)"
        }

        isLoading = false
    }

    // MARK: - Restore

    func restore() async {
        isLoading = true
        errorMessage = nil

        do {
            try await AppStore.sync()
            await checkEntitlement()
        } catch {
            errorMessage = "Restore failed: \(error.localizedDescription)"
        }

        isLoading = false
    }

    // MARK: - Entitlement Check

    func checkEntitlement() async {
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result,
               transaction.productID == Self.productId {
                transactionId = String(transaction.originalID)
                isPurchased = true
                return
            }
        }
        // If we got here, no valid entitlement found
        isPurchased = false
        transactionId = nil
    }

    // MARK: - Transaction Listener

    private func listenForTransactions() -> Task<Void, Never> {
        Task.detached { [weak self] in
            for await result in Transaction.updates {
                if case .verified(let transaction) = result {
                    await MainActor.run {
                        if transaction.productID == StoreKitManager.productId {
                            self?.transactionId = String(transaction.originalID)
                            self?.isPurchased = true
                        }
                    }
                    await transaction.finish()
                }
            }
        }
    }

    // MARK: - Verification

    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified(_, let error):
            throw error
        case .verified(let safe):
            return safe
        }
    }
}
