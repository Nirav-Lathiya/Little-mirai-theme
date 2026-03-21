class MainProductSection {
  constructor(container) {
    if (!container || container.dataset.mainProductReady === 'true') return;

    this.container = container;
    this.form = container.querySelector('[data-product-form]');
    this.variantInput = container.querySelector('[data-variant-id]');
    this.quantityInput = container.querySelector('[data-qty-input]');
    this.addToCartButton = container.querySelector('[data-add-to-cart]');
    this.buyNowButton = container.querySelector('[data-buy-now]');
    this.priceElement = container.querySelector('[data-product-price]');
    this.compareElement = container.querySelector('[data-product-compare]');
    this.stockBenefit = container.querySelector('[data-stock-benefit]');
    this.stockNote = container.querySelector('[data-stock-note]');
    this.mainImage = container.querySelector('[data-main-product-image]');
    this.thumbnails = [...container.querySelectorAll('[data-thumbnail]')];
    this.optionGroups = [...container.querySelectorAll('[data-option-position]')];
    this.variants = this.#readVariants();
    this.stockThreshold = Number(container.dataset.stockThreshold || 20);
    this.stockEnabled = container.dataset.stockEnabled === 'true';

    this.#bindThumbnails();
    this.#bindOptions();
    this.#bindQuantity();
    this.#bindBuyNow();

    this.container.dataset.mainProductReady = 'true';
  }

  #readVariants() {
    const jsonElement = this.container.querySelector('[data-product-variants]');
    if (!jsonElement) return [];

    try {
      return JSON.parse(jsonElement.textContent);
    } catch {
      return [];
    }
  }

  #bindThumbnails() {
    this.thumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener('click', () => {
        this.#activateThumbnail(thumbnail);
      });
    });
  }

  #activateThumbnail(thumbnail) {
    if (!this.mainImage || !thumbnail) return;

    this.mainImage.src = thumbnail.dataset.fullImage;
    this.mainImage.alt = thumbnail.dataset.alt || this.mainImage.alt;
    this.mainImage.dataset.currentMediaId = thumbnail.dataset.mediaId || '';

    this.thumbnails.forEach((item) => item.classList.remove('is-active'));
    thumbnail.classList.add('is-active');
  }

  #bindOptions() {
    this.optionGroups.forEach((group) => {
      const buttons = [...group.querySelectorAll('[data-option-value]')];

      buttons.forEach((button) => {
        button.addEventListener('click', () => {
          buttons.forEach((item) => item.classList.remove('is-selected'));
          button.classList.add('is-selected');
          this.#updateVariant();
        });
      });
    });
  }

  #selectedOptions() {
    return this.optionGroups.map((group) => {
      return group.querySelector('.is-selected')?.getAttribute('data-option-value') || null;
    });
  }

  #updateVariant() {
    if (!this.variants.length) return;

    const selectedOptions = this.#selectedOptions();
    const matchingVariant = this.variants.find((variant) => {
      return selectedOptions.every((value, index) => {
        if (!value) return true;
        return variant[`option${index + 1}`] === value;
      });
    });

    if (!matchingVariant) {
      this.#setAvailability(false, 'Unavailable');
      return;
    }

    if (this.variantInput) {
      this.variantInput.value = matchingVariant.id;
    }

    if (this.priceElement) {
      this.priceElement.textContent = matchingVariant.price;
    }

    if (this.compareElement) {
      if (matchingVariant.compare_at_price) {
        this.compareElement.textContent = matchingVariant.compare_at_price;
        this.compareElement.hidden = false;
      } else {
        this.compareElement.hidden = true;
      }
    }

    const isAvailable = Boolean(matchingVariant.available);
    this.#setAvailability(isAvailable, isAvailable ? 'Add to Cart' : 'Sold Out');
    this.#updateStock(matchingVariant.inventory_quantity);

    if (matchingVariant.featured_media_id) {
      const matchingThumbnail = this.thumbnails.find(
        (thumbnail) => thumbnail.dataset.mediaId === String(matchingVariant.featured_media_id)
      );

      if (matchingThumbnail) {
        this.#activateThumbnail(matchingThumbnail);
      }
    }
  }

  #setAvailability(isAvailable, text) {
    if (this.addToCartButton) {
      this.addToCartButton.disabled = !isAvailable;
      this.addToCartButton.textContent = text;
    }

    if (this.buyNowButton) {
      this.buyNowButton.disabled = !isAvailable;
    }
  }

  #updateStock(inventoryQuantity) {
    const quantity = Number(inventoryQuantity || 0);
    const defaultMessage = 'Made for everyday comfort';
    const stockMessage = quantity > 0 ? `Only ${quantity} left in stock` : defaultMessage;

    if (this.stockBenefit) {
      this.stockBenefit.textContent = stockMessage;
    }

    if (this.stockNote) {
      const shouldShow = this.stockEnabled && quantity > 0 && quantity <= this.stockThreshold;
      this.stockNote.hidden = !shouldShow;
      this.stockNote.textContent = stockMessage;
    }
  }

  #bindQuantity() {
    if (!this.quantityInput) return;

    const min = Number(this.quantityInput.min || 1);

    this.container.querySelectorAll('[data-qty-change]').forEach((button) => {
      button.addEventListener('click', () => {
        const change = Number(button.dataset.qtyChange || 0);
        const current = Number(this.quantityInput.value || min);
        const next = Math.max(min, current + change);

        this.quantityInput.value = String(next);
      });
    });
  }

  #bindBuyNow() {
    if (!this.buyNowButton || !this.variantInput || !this.quantityInput) return;

    this.buyNowButton.addEventListener('click', async () => {
      if (this.buyNowButton.disabled) return;

      const root = window.Shopify?.routes?.root || '/';
      const originalText = this.buyNowButton.textContent;

      this.buyNowButton.disabled = true;
      this.buyNowButton.textContent = 'Processing...';

      try {
        const response = await fetch(`${root}cart/add.js`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            id: Number(this.variantInput.value),
            quantity: Number(this.quantityInput.value || 1),
          }),
        });

        if (!response.ok) {
          throw new Error('Unable to add product to cart');
        }

        window.location.href = `${root}checkout`;
      } catch {
        this.buyNowButton.disabled = false;
        this.buyNowButton.textContent = originalText;
      }
    });
  }
}

function initMainProductSections(root = document) {
  root.querySelectorAll('[data-main-product]').forEach((container) => {
    new MainProductSection(container);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initMainProductSections());
} else {
  initMainProductSections();
}

document.addEventListener('shopify:section:load', (event) => {
  initMainProductSections(event.target);
});
