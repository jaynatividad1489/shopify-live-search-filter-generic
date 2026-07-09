/**
 * Search & Filter — Generic / Standalone Version
 * Works on ANY Shopify theme — zero Dawn dependencies
 * Author: John Venedick Natividad
 * GitHub: https://github.com/jaynatividad1489
 *
 * Components:
 * - SFG.Search    — Predictive Search API + keyboard nav + recent searches
 * - SFG.Filters   — AJAX collection filtering + URL sync
 * - SFG.Drawer    — Mobile filter drawer + focus trap
 * - SFG.PriceRange — Dual-handle price slider
 * - SFG.ShowMore  — Show more / less facet values
 */

(function () {
  'use strict';

  const SFG = {

    /* ─────────────────────────────────────────────
       Search Module
    ───────────────────────────────────────────── */
    Search: {
      wrap:      document.getElementById('SfgSearch'),
      input:     document.getElementById('SfgSearchInput'),
      results:   document.getElementById('SfgSearchResults'),
      spinner:   document.getElementById('SfgSearchSpinner'),
      clearBtn:  document.getElementById('SfgSearchClear'),
      announce:  document.getElementById('SfgSearchAnnounce'),
      limit:     6,
      cache:     {},
      activeIdx: -1,
      timer:     null,
      isOpen:    false,

      init() {
        if (!this.input) return;

        this.limit = parseInt(
          document.getElementById('SFG')?.dataset.searchLimit || 6
        );

        this.input.addEventListener('input', () => {
          this.toggleClear();
          this.debounce(() => this.fetch(this.input.value.trim()), 300);
        });

        this.input.addEventListener('keydown', this.onKeydown.bind(this));
        this.input.addEventListener('focus', () => {
          if (!this.input.value.trim()) this.showRecent();
        });

        this.clearBtn?.addEventListener('click', () => {
          this.input.value = '';
          this.input.focus();
          this.close();
          this.toggleClear();
        });

        document.addEventListener('click', (e) => {
          if (!this.wrap?.contains(e.target)) this.close();
        });
      },

      debounce(fn, ms) {
        clearTimeout(this.timer);
        this.timer = setTimeout(fn, ms);
      },

      toggleClear() {
        this.clearBtn?.classList.toggle('sfg__hidden', !this.input.value.trim());
      },

      async fetch(q) {
        if (q.length < 2) { this.close(); return; }
        if (this.cache[q]) { this.render(this.cache[q], q); return; }

        this.setLoading(true);
        try {
          const url  = `${window.Shopify.routes.root}search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=${this.limit}&resources[options][fields]=title,product_type,variants.title,vendor`;
          const res  = await fetch(url);
          if (!res.ok) throw new Error();
          const data = await res.json();
          this.cache[q] = data;
          this.render(data, q);
          this.saveRecent(q);
        } catch {
          this.renderError();
        } finally {
          this.setLoading(false);
        }
      },

      render(data, q) {
        const products = data?.resources?.results?.products || [];

        if (!products.length) {
          this.results.innerHTML = `
            <div class="sfg__search-empty">
              <p>No results for "<strong>${q}</strong>"</p>
              <p class="sfg__search-hint">Try a different search term.</p>
            </div>`;
          this.open();
          this.say(`No results for ${q}`);
          return;
        }

        this.results.innerHTML = `
          <div class="sfg__search-inner">
            <p class="sfg__search-label">Products</p>
            <ul class="sfg__search-list" role="listbox">
              ${products.map((p, i) => this.renderItem(p, i)).join('')}
            </ul>
            <a class="sfg__search-view-all"
               href="${window.Shopify.routes.root}search?q=${encodeURIComponent(q)}&type=product">
              View all results for "${q}"
            </a>
          </div>`;

        this.open();
        this.say(`${products.length} results for ${q}`);
        this.activeIdx = -1;
      },

      renderItem(p, i) {
        const price = p.price
          ? new Intl.NumberFormat(document.documentElement.lang || 'en', {
              style: 'currency',
              currency: window.Shopify.currency.active || 'USD'
            }).format(p.price / 100)
          : '';

        const img = p.featured_image?.url
          ? `<img src="${p.featured_image.url}&width=80" alt="${p.title}" loading="lazy" width="40" height="40">`
          : `<div class="sfg__search-placeholder"></div>`;

        return `
          <li class="sfg__search-item" role="option" id="SfgResult-${i}" aria-selected="false">
            <a href="${p.url}" class="sfg__search-link">
              <div class="sfg__search-img">${img}</div>
              <div class="sfg__search-info">
                <span class="sfg__search-title">${p.title}</span>
                ${p.vendor ? `<span class="sfg__search-vendor">${p.vendor}</span>` : ''}
                <span class="sfg__search-price">${price}</span>
              </div>
            </a>
          </li>`;
      },

      renderError() {
        this.results.innerHTML = `
          <div class="sfg__search-empty">
            <p>Something went wrong. Please try again.</p>
          </div>`;
        this.open();
      },

      onKeydown(e) {
        const items = this.results.querySelectorAll('.sfg__search-item');
        if (!items.length) return;

        if (e.key === 'ArrowDown') {
          e.preventDefault();
          this.activeIdx = Math.min(this.activeIdx + 1, items.length - 1);
          this.setActive(items);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          this.activeIdx = Math.max(this.activeIdx - 1, -1);
          this.setActive(items);
        } else if (e.key === 'Enter' && this.activeIdx >= 0) {
          e.preventDefault();
          items[this.activeIdx]?.querySelector('a')?.click();
        } else if (e.key === 'Escape') {
          this.close();
          this.input.focus();
        }
      },

      setActive(items) {
        items.forEach((item, i) => {
          const active = i === this.activeIdx;
          item.setAttribute('aria-selected', active);
          item.classList.toggle('is-active', active);
          if (active) item.scrollIntoView({ block: 'nearest' });
        });
        this.input.setAttribute(
          'aria-activedescendant',
          this.activeIdx >= 0 ? `SfgResult-${this.activeIdx}` : ''
        );
      },

      open() {
        this.isOpen = true;
        this.results.classList.add('is-visible');
        this.wrap?.setAttribute('aria-expanded', 'true');
      },

      close() {
        this.isOpen = false;
        this.results.classList.remove('is-visible');
        this.wrap?.setAttribute('aria-expanded', 'false');
        this.activeIdx = -1;
      },

      setLoading(on) {
        this.spinner?.classList.toggle('sfg__hidden', !on);
        this.input.setAttribute('aria-busy', on);
      },

      say(msg) {
        if (!this.announce) return;
        this.announce.textContent = '';
        requestAnimationFrame(() => { this.announce.textContent = msg; });
      },

      saveRecent(q) {
        try {
          const list = JSON.parse(localStorage.getItem('sfg_recent') || '[]');
          localStorage.setItem('sfg_recent',
            JSON.stringify([q, ...list.filter(x => x !== q)].slice(0, 5)));
        } catch {}
      },

      showRecent() {
        try {
          const list = JSON.parse(localStorage.getItem('sfg_recent') || '[]');
          if (!list.length) return;

          this.results.innerHTML = `
            <div class="sfg__search-inner">
              <p class="sfg__search-label">Recent searches</p>
              <ul class="sfg__recent-list" role="list">
                ${list.map(q => `
                  <li class="sfg__recent-item">
                    <a href="${window.Shopify.routes.root}search?q=${encodeURIComponent(q)}&type=product" class="sfg__recent-link">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                      ${q}
                    </a>
                    <button class="sfg__recent-remove" type="button" data-q="${q}" aria-label="Remove ${q}">✕</button>
                  </li>`).join('')}
              </ul>
            </div>`;

          this.open();

          this.results.querySelectorAll('.sfg__recent-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              e.stopPropagation();
              try {
                const list = JSON.parse(localStorage.getItem('sfg_recent') || '[]');
                localStorage.setItem('sfg_recent',
                  JSON.stringify(list.filter(q => q !== btn.dataset.q)));
              } catch {}
              btn.closest('.sfg__recent-item')?.remove();
              if (!this.results.querySelectorAll('.sfg__recent-item').length) this.close();
            });
          });
        } catch {}
      }
    },

    /* ─────────────────────────────────────────────
       Filters Module
    ───────────────────────────────────────────── */
    Filters: {
      form:       document.getElementById('SfgFacetsForm'),
      sort:       document.getElementById('SfgSort'),
      grid:       document.getElementById('SfgGrid'),
      count:      document.getElementById('SfgCount'),
      activeTags: document.getElementById('SfgActiveTags'),
      pagination: document.getElementById('SfgPagination'),
      timer:      null,
      currentUrl: new URL(window.location.href),

      init() {
        if (!this.form) return;

        // Checkbox changes
        this.form.querySelectorAll('.sfg__facet-checkbox').forEach(cb => {
          cb.addEventListener('change', () => this.onChange());
        });

        // Sort
        this.sort?.addEventListener('change', () => {
          this.currentUrl.searchParams.set('sort_by', this.sort.value);
          this.load(this.currentUrl.toString());
        });

        // Active tag + clear all remove (delegated on document)
        document.addEventListener('click', (e) => {
          const el = e.target.closest('[data-filter-url]');
          if (!el) return;
          e.preventDefault();
          this.load(el.dataset.filterUrl);
        });

        // Pagination (AJAX)
        document.addEventListener('click', (e) => {
          const link = e.target.closest('.sfg__pagination a');
          if (!link) return;
          e.preventDefault();
          this.load(link.href);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Browser back/forward
        window.addEventListener('popstate', (e) => {
          if (e.state?.sfgUrl) this.load(e.state.sfgUrl, false);
        });
      },

      onChange() {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          const params = new URLSearchParams(new FormData(this.form));
          const sortBy = this.currentUrl.searchParams.get('sort_by');
          if (sortBy) params.set('sort_by', sortBy);
          this.load(`${window.location.pathname}?${params}`);
        }, 200);
      },

      async load(url, push = true) {
        this.setLoading(true);
        try {
          const res  = await fetch(`${url}${url.includes('?') ? '&' : '?'}sections=search-filter-generic`);
          if (!res.ok) throw new Error();
          const data = await res.json();
          const doc  = new DOMParser().parseFromString(
            data['search-filter-generic'] || '', 'text/html'
          );

          // Update grid
          const newGrid = doc.getElementById('SfgGrid');
          if (newGrid && this.grid) this.grid.innerHTML = newGrid.innerHTML;

          // Update count
          const newCount = doc.getElementById('SfgCount');
          if (newCount && this.count) this.count.textContent = newCount.textContent;

          // Update active tags
          const newTags = doc.getElementById('SfgActiveTags');
          if (newTags && this.activeTags) this.activeTags.innerHTML = newTags.innerHTML;

          // Update facets
          const newFacets = doc.getElementById('SfgFacetsForm');
          if (newFacets && this.form) {
            this.form.innerHTML = newFacets.innerHTML;
            this.rebind();
          }

          if (push) history.pushState({ sfgUrl: url }, '', url);

          // Update drawer count
          SFG.Drawer.updateCount();

        } catch (err) {
          console.warn('Filter load failed:', err);
        } finally {
          this.setLoading(false);
        }
      },

      rebind() {
        this.form?.querySelectorAll('.sfg__facet-checkbox').forEach(cb => {
          cb.addEventListener('change', () => this.onChange());
        });
        SFG.PriceRange.initAll();
        SFG.ShowMore.init();
      },

      setLoading(on) {
        if (!this.grid) return;
        this.grid.setAttribute('aria-busy', on);
        this.grid.classList.toggle('sfg__loading', on);
      }
    },

    /* ─────────────────────────────────────────────
       Drawer Module
    ───────────────────────────────────────────── */
    Drawer: {
      drawer:  document.getElementById('SfgDrawer'),
      panel:   document.getElementById('SfgDrawerPanel'),
      overlay: document.getElementById('SfgDrawerOverlay'),
      toggle:  document.getElementById('SfgFilterToggle'),
      apply:   document.getElementById('SfgDrawerApply'),
      isOpen:  false,
      _trap:   null,

      init() {
        if (!this.drawer) return;

        this.toggle?.addEventListener('click', () => this.open());
        this.drawer.querySelector('.sfg__drawer-close')
          ?.addEventListener('click', () => this.close());
        this.overlay?.addEventListener('click', () => this.close());
        this.apply?.addEventListener('click', () => this.close());

        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape' && this.isOpen) this.close();
        });
      },

      open() {
        this.isOpen = true;
        this.drawer.setAttribute('aria-hidden', 'false');
        this.panel?.classList.add('is-open');
        this.overlay?.classList.add('is-visible');
        document.body.classList.add('sfg-drawer-open');
        this.toggle?.setAttribute('aria-expanded', 'true');
        this.trapFocus();
        this.panel?.focus();
      },

      close() {
        this.isOpen = false;
        this.drawer.setAttribute('aria-hidden', 'true');
        this.panel?.classList.remove('is-open');
        this.overlay?.classList.remove('is-visible');
        document.body.classList.remove('sfg-drawer-open');
        this.toggle?.setAttribute('aria-expanded', 'false');
        this.releaseFocus();
        this.toggle?.focus();
      },

      trapFocus() {
        const focusable = this.panel?.querySelectorAll(
          'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable?.length) return;
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];
        this._trap = (e) => {
          if (e.key !== 'Tab') return;
          if (e.shiftKey ? document.activeElement === first : document.activeElement === last) {
            e.preventDefault();
            (e.shiftKey ? last : first).focus();
          }
        };
        this.panel?.addEventListener('keydown', this._trap);
      },

      releaseFocus() {
        if (this._trap) this.panel?.removeEventListener('keydown', this._trap);
      },

      updateCount() {
        const countEl = document.getElementById('SfgDrawerCount');
        const tags    = document.querySelectorAll('.sfg__tag');
        if (countEl) countEl.textContent = tags.length ? `(${tags.length})` : '';

        // Update toggle badge
        const badge = this.toggle?.querySelector('.sfg__filter-badge');
        if (badge) {
          if (tags.length) { badge.textContent = tags.length; badge.classList.remove('sfg__hidden'); }
          else { badge.classList.add('sfg__hidden'); }
        }
      }
    },

    /* ─────────────────────────────────────────────
       Price Range Module
    ───────────────────────────────────────────── */
    PriceRange: {
      initAll() {
        document.querySelectorAll('.sfg__price-range').forEach(el => this.initOne(el));
      },

      initOne(el) {
        const minThumb = el.querySelector('.sfg__price-thumb--min');
        const maxThumb = el.querySelector('.sfg__price-thumb--max');
        const fill     = el.querySelector('.sfg__price-fill');
        const minInput = el.querySelector('.sfg__price-input:first-of-type') ||
                         document.getElementById('SfgPriceMinInput-' + el.id.split('-').pop());
        const maxInput = el.querySelector('.sfg__price-input:last-of-type') ||
                         document.getElementById('SfgPriceMaxInput-' + el.id.split('-').pop());
        const rangeMin = parseFloat(el.dataset.min) / 100;
        const rangeMax = parseFloat(el.dataset.max) / 100;
        let timer = null;

        if (!minThumb || !maxThumb) return;

        const updateFill = () => {
          if (!fill) return;
          const range = rangeMax - rangeMin;
          const lo = (parseFloat(minThumb.value) - rangeMin) / range * 100;
          const hi = (parseFloat(maxThumb.value) - rangeMin) / range * 100;
          fill.style.left  = `${lo}%`;
          fill.style.width = `${hi - lo}%`;
        };

        const triggerFilter = () => {
          clearTimeout(timer);
          timer = setTimeout(() => SFG.Filters.onChange(), 500);
        };

        minThumb.addEventListener('input', () => {
          if (parseFloat(minThumb.value) >= parseFloat(maxThumb.value))
            minThumb.value = parseFloat(maxThumb.value) - 1;
          if (minInput) minInput.value = Math.ceil(parseFloat(minThumb.value));
          updateFill(); triggerFilter();
        });

        maxThumb.addEventListener('input', () => {
          if (parseFloat(maxThumb.value) <= parseFloat(minThumb.value))
            maxThumb.value = parseFloat(minThumb.value) + 1;
          if (maxInput) maxInput.value = Math.ceil(parseFloat(maxThumb.value));
          updateFill(); triggerFilter();
        });

        minInput?.addEventListener('change', () => {
          const v = parseFloat(minInput.value);
          if (!isNaN(v) && v >= rangeMin && v < parseFloat(maxThumb.value)) {
            minThumb.value = v; updateFill(); triggerFilter();
          }
        });

        maxInput?.addEventListener('change', () => {
          const v = parseFloat(maxInput.value);
          if (!isNaN(v) && v <= rangeMax && v > parseFloat(minThumb.value)) {
            maxThumb.value = v; updateFill(); triggerFilter();
          }
        });

        updateFill();
      }
    },

    /* ─────────────────────────────────────────────
       Show More / Show Less
    ───────────────────────────────────────────── */
    ShowMore: {
      init() {
        document.querySelectorAll('.sfg__show-more').forEach(btn => {
          btn.addEventListener('click', () => {
            const target   = document.getElementById(btn.dataset.target);
            const showLess = btn.closest('.sfg__facet-show-more-item')
                               ?.querySelector('.sfg__show-less');
            if (!target) return;
            target.classList.remove('sfg__hidden');
            btn.classList.add('sfg__hidden');
            showLess?.classList.remove('sfg__hidden');
            btn.setAttribute('aria-expanded', 'true');
          });
        });

        document.querySelectorAll('.sfg__show-less').forEach(btn => {
          btn.addEventListener('click', () => {
            const target   = document.getElementById(btn.dataset.target);
            const showMore = btn.closest('.sfg__facet-show-more-item')
                               ?.querySelector('.sfg__show-more');
            if (!target) return;
            target.classList.add('sfg__hidden');
            btn.classList.add('sfg__hidden');
            showMore?.classList.remove('sfg__hidden');
            showMore?.setAttribute('aria-expanded', 'false');
          });
        });
      }
    },

    /* ─────────────────────────────────────────────
       Boot
    ───────────────────────────────────────────── */
    init() {
      this.Search.init();
      this.Filters.init();
      this.Drawer.init();
      this.PriceRange.initAll();
      this.ShowMore.init();
    }
  };

  document.addEventListener('DOMContentLoaded', () => SFG.init());
  window.SFG = SFG;

})();
